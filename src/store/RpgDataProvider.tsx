import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, CharacterModule, RpgDataV1, Session } from "../domain/rpg";
import { RpgDataContext, type RpgDataActions } from "./RpgDataContext";
import { useAuth } from "../contexts/AuthContext";
import { defaultLevelForSystem, isSavagePathfinder } from "../domain/savagePathfinder";
import { createCharacterApiV1Client } from "../services/characterApiV1";
import {
  createCharacterRevisionStore,
  dualWriteCharacterCombatState,
} from "../services/characterDualWrite";
import { isCharacterV1DualWriteEnabled } from "../services/featureFlags";
import { loadCloudRpgData, saveCloudRpgData } from "../services/cloudRpgDataApi";
import {
  createSeedData,
  loadRpgData,
  normalizeRpgDataV1,
  newId,
  newIsoNow,
  saveRpgData,
} from "./rpgStorage";
import { loadRpgDataFromSqlite, saveRpgDataToSqlite } from "./sqliteStorage";

export function RpgDataProvider(props: { children: React.ReactNode }) {
  const [data, setData] = useState<RpgDataV1>(() => loadRpgData("local-user"));
  const { user, isLoading: isAuthLoading, isConfigured } = useAuth();
  const [isCloudReady, setIsCloudReady] = useState(false);
  const [, setCloudError] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const dualWriteEnabled = isCharacterV1DualWriteEnabled();
  const characterApiClient = useMemo(() => {
    if (!dualWriteEnabled) return null;
    return createCharacterApiV1Client({
      baseUrl:
        (import.meta.env.VITE_CHARACTER_API_BASE_URL as string | undefined) ??
        "/api/v1",
    });
  }, [dualWriteEnabled]);
  const characterRevisionStoreRef = useRef(createCharacterRevisionStore());

  function syncUserId() {
    return user?.id ?? "local-user";
  }

  useEffect(() => {
    let isCancelled = false;
    const storageUserId = syncUserId();

    void (async () => {
      const sqliteData = await loadRpgDataFromSqlite(storageUserId);
      if (isCancelled) return;

      if (sqliteData) {
        setData(sqliteData);
        saveRpgData(sqliteData, storageUserId);
      } else {
        const localData = loadRpgData(storageUserId);
        setData(localData);
        saveRpgData(localData, storageUserId);
        await saveRpgDataToSqlite(localData, storageUserId);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isConfigured) {
      setIsCloudReady(false);
      setCloudError(null);
      return;
    }
    if (!user) {
      setIsCloudReady(false);
      setCloudError(null);
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        setCloudError(null);
        const localData = loadRpgData(user.id);
        const cloudData = await loadCloudRpgData(user.id);
        if (isCancelled) return;
        const normalized = normalizeRpgDataV1({
          ...localData,
          ...(cloudData ?? {}),
          campaign: {
            ...localData.campaign,
            ...(cloudData?.campaign ?? {}),
          },
          notes: {
            ...localData.notes,
            ...(cloudData?.notes ?? {}),
          },
          social: localData.social,
        });
        setData(normalized);
        saveRpgData(normalized, user.id);
        await saveRpgDataToSqlite(normalized, user.id);
        if (!isCancelled) setIsCloudReady(true);
      } catch (e: any) {
        if (!isCancelled) {
          setIsCloudReady(false);
          setCloudError(
            e?.message ? String(e.message) : "Erro ao sincronizar com a nuvem",
          );
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [user, isAuthLoading, isConfigured]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const actions = useMemo<RpgDataActions>(() => {
    function normalizeModuleLayout(module: CharacterModule): CharacterModule {
      const column = Math.min(2, Math.max(0, module.column ?? 0)) as 0 | 1 | 2;
      const maxSpan = (3 - column) as 1 | 2 | 3;
      const span = Math.min(maxSpan, Math.max(1, module.span ?? 1)) as 1 | 2 | 3;
      const rowSpan = Math.min(3, Math.max(1, module.rowSpan ?? 1)) as 1 | 2 | 3;
      return { ...module, column, span, rowSpan };
    }

    function toModuleSystem(system: string): CharacterModule["system"] {
      return isSavagePathfinder(system) ? "savage_pathfinder" : "generic";
    }

    function createDefaultStats(system: string): Character["stats"] {
      if (isSavagePathfinder(system)) {
        return {
          ca: 10,
          hp: { current: 3, max: 3 },
          initiative: 0,
          pace: 6,
          parry: 6,
          toughness: 8,
          wounds: 0,
          fatigue: 0,
          isIncapacitated: false,
        };
      }

      return { ca: 10, hp: { current: 10, max: 10 }, initiative: 0 };
    }

    function createDefaultModules(system: string): CharacterModule[] {
      if (!isSavagePathfinder(system)) return [];
      const moduleSystem = toModuleSystem(system);
      return [
        { id: newId(), type: "combat_stats", system: moduleSystem, column: 0, span: 1, rowSpan: 1 },
        { id: newId(), type: "attributes", system: moduleSystem, column: 1, span: 1, rowSpan: 1 },
        {
          id: newId(),
          type: "power_points",
          system: moduleSystem,
          column: 2,
          span: 1,
          rowSpan: 1,
          data: { current: 10, max: 10 },
        },
      ];
    }

    function commit(
      updater: (prev: RpgDataV1) => RpgDataV1,
      options?: {
        dualWriteCharacterId?: string;
        shouldDualWrite?: (prev: RpgDataV1, next: RpgDataV1) => boolean;
        skipCloudSync?: boolean;
      },
    ) {
      setData((prev) => {
        const next = updater(prev);
        saveRpgData(next, user?.id);
        void saveRpgDataToSqlite(next, user?.id);
        const shouldDualWrite =
          options?.dualWriteCharacterId &&
          (!options.shouldDualWrite || options.shouldDualWrite(prev, next));

        if (shouldDualWrite && characterApiClient) {
          const character = next.characters.find(
            (item) => item.id === options.dualWriteCharacterId,
          );
          if (character) {
            void dualWriteCharacterCombatState({
              enabled: dualWriteEnabled,
              client: characterApiClient,
              character,
              revisions: characterRevisionStoreRef.current,
            });
          }
        }

        if (user && isCloudReady && !options?.skipCloudSync) {
          const userId = user.id;
          if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = window.setTimeout(() => {
            void (async () => {
              try {
                await saveCloudRpgData(userId, next);
                setIsCloudReady(true);
              } catch {
                setIsCloudReady(false);
              }
            })();
          }, 600);
        }

        return next;
      });
    }

    return {
      setCampaignName(name) {
        commit((prev) => ({ ...prev, campaign: { ...prev.campaign, name } }));
      },
      setCampaignSystem(system) {
        commit((prev) => ({ ...prev, campaign: { ...prev.campaign, system } }));
      },
      registerCampaign(input) {
        commit((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            name: input.name.trim(),
            system: input.system.trim(),
            role: input.role,
            locale: input.locale.trim(),
            timeZone: input.timeZone.trim(),
            isRegistered: true,
            partyMemberIds: prev.campaign.partyMemberIds ?? [],
          },
        }));
      },
      setCampaignPartyMembers(characterIds) {
        commit((prev) => {
          const ids = characterIds
            .map((id) => id.trim())
            .filter((id) => id.length > 0);
          const existingIds = new Set(prev.characters.map((character) => character.id));
          const filtered = ids.filter((id) => existingIds.has(id));
          return {
            ...prev,
            campaign: {
              ...prev.campaign,
              partyMemberIds: Array.from(new Set(filtered)),
            },
          };
        });
      },
      setSocialFriends(friends) {
        commit((prev) => {
          const social = prev.social ?? { friends: [], groups: [] };
          const normalized = friends
            .map((friend) => {
              const id = friend.id.trim();
              const name = friend.name.trim();
              if (!id || !name) return null;
              return {
                id,
                name,
                status: friend.status,
                activity: friend.activity?.trim() || undefined,
                avatarUrl: friend.avatarUrl,
              };
            })
            .filter(
              (friend): friend is NonNullable<typeof friend> => Boolean(friend),
            );

          return {
            ...prev,
            social: {
              ...social,
              friends: normalized,
            },
          };
        }, { skipCloudSync: true });
      },
      sendFriendRequest(input) {
        commit((prev) => {
          const id = input.id.trim();
          const name = input.name.trim();
          if (!id || !name) return prev;

          const social = prev.social ?? { friends: [], groups: [] };
          const alreadyFriend = social.friends.some((friend) => friend.id === id);
          if (alreadyFriend) return prev;

          const requestsSent = social.requestsSent ?? [];
          const alreadyRequested = requestsSent.some((request) => request.id === id);
          if (alreadyRequested) return prev;

          return {
            ...prev,
            social: {
              ...social,
              requestsSent: [
                ...requestsSent,
                {
                  id,
                  name,
                  handle: input.handle?.trim() || undefined,
                  avatarUrl: input.avatarUrl,
                  sentAtIso: newIsoNow(),
                  status: "pending",
                },
              ],
            },
          };
        }, { skipCloudSync: true });
      },
      setSentFriendRequests(requests) {
        commit((prev) => {
          const social = prev.social ?? { friends: [], groups: [] };
          const normalized = requests
            .map((request) => ({
              id: request.id.trim(),
              name: request.name.trim(),
              handle: request.handle?.trim() || undefined,
              avatarUrl: request.avatarUrl,
              sentAtIso: request.sentAtIso,
              status: "pending" as const,
            }))
            .filter((request) => request.id.length > 0 && request.name.length > 0);

          return {
            ...prev,
            social: {
              ...social,
              requestsSent: normalized,
            },
          };
        }, { skipCloudSync: true });
      },
      upsertCharacter(input) {
        commit((prev) => {
          const now = newIsoNow();
          const id = input.id ?? newId();
          const existingCharacter = prev.characters.find((character) => character.id === id);
          const exists = Boolean(existingCharacter);
          const system = input.system.trim() || prev.campaign.system || "savage_pathfinder";
          const conviction =
            typeof input.conviction === "number" && Number.isFinite(input.conviction)
              ? Math.max(0, Math.floor(input.conviction))
              : undefined;
          const edges =
            typeof input.edges === "number" && Number.isFinite(input.edges)
              ? Math.max(0, Math.floor(input.edges))
              : undefined;
          const nextChar: Character = {
            id,
            name: input.name.trim(),
            system,
            playerName: input.playerName.trim(),
            class: input.class ?? existingCharacter?.class,
            race: input.race ?? existingCharacter?.race,
            ancestry: input.ancestry ?? existingCharacter?.ancestry,
            height: input.height ?? existingCharacter?.height,
            weight: input.weight ?? existingCharacter?.weight,
            edges: edges ?? existingCharacter?.edges,
            conviction: conviction ?? existingCharacter?.conviction,
            level: input.level ?? existingCharacter?.level ?? defaultLevelForSystem(system),
            createdAtIso: input.id
              ? (existingCharacter?.createdAtIso ?? now)
              : now,
            stats: exists ? existingCharacter?.stats : createDefaultStats(system),
            attributes: exists
              ? existingCharacter?.attributes
              : { agility: 4, smarts: 4, spirit: 4, strength: 4, vigor: 4 },
            modules: exists
              ? (existingCharacter?.modules ?? [])
              : createDefaultModules(system),
          };
          const characters = exists
            ? prev.characters.map((c) => (c.id === id ? nextChar : c))
            : [nextChar, ...prev.characters];
          const partyMemberIds = exists
            ? prev.campaign.partyMemberIds ?? []
            : Array.from(new Set([...(prev.campaign.partyMemberIds ?? []), id]));
          return {
            ...prev,
            campaign: {
              ...prev.campaign,
              partyMemberIds,
            },
            characters,
          };
        });
      },
      removeCharacter(id) {
        commit((prev) => ({
          ...prev,
          campaign: {
            ...prev.campaign,
            partyMemberIds: (prev.campaign.partyMemberIds ?? []).filter(
              (characterId) => characterId !== id,
            ),
          },
          characters: prev.characters.filter((c) => c.id !== id),
        }));
      },
      addSession(input) {
        commit((prev) => {
          const now = newIsoNow();
          const campaignName = input.campaignName?.trim() || prev.campaign.name;
          const nextSession: Session = {
            id: newId(),
            title: input.title.trim(),
            scheduledAtIso: input.scheduledAtIso,
            address: input.address?.trim(),
            campaignName,
            notes: input.notes?.trim(),
            createdAtIso: now,
          };
          return { ...prev, sessions: [nextSession, ...prev.sessions] };
        });
      },
      removeSession(id) {
        commit((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => s.id !== id),
        }));
      },
      setCampaignNotes(notes) {
        commit((prev) => ({
          ...prev,
          notes: { ...prev.notes, campaign: notes },
        }));
      },
      resetToSeed() {
        commit(() => createSeedData());
      },
      updateCharacter(id, updates) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
      },
      updateCharacterStats(id, stats) {
        commit(
          (prev) => ({
            ...prev,
            characters: prev.characters.map((c) =>
              c.id === id ? { ...c, stats } : c,
            ),
          }),
          { dualWriteCharacterId: id },
        );
      },
      updateCharacterAttributes(id, attributes) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === id ? { ...c, attributes } : c,
          ),
        }));
      },
      addCharacterModule(charId, module) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  modules: [
                    ...(c.modules || []),
                    normalizeModuleLayout({
                      id: newId(),
                      type: module.type,
                      system: module.system,
                      title: module.title,
                      span: module.span,
                      rowSpan: module.rowSpan,
                      column: module.column,
                    }),
                  ],
                }
              : c,
          ),
        }));
      },
      updateCharacterModule(charId, moduleId, updates) {
        commit(
          (prev) => ({
            ...prev,
            characters: prev.characters.map((c) =>
              c.id === charId
                ? {
                    ...c,
                    modules: (c.modules || []).map((m) =>
                      m.id === moduleId
                        ? normalizeModuleLayout({ ...m, ...updates })
                        : m,
                    ),
                  }
                : c,
            ),
          }),
          {
            dualWriteCharacterId: charId,
            shouldDualWrite(prev) {
              const character = prev.characters.find((item) => item.id === charId);
              const module = character?.modules?.find((item) => item.id === moduleId);
              return module?.type === "power_points";
            },
          },
        );
      },
      reorderCharacterModule(charId, moduleId, direction) {
        commit((prev) => {
          return {
            ...prev,
            characters: prev.characters.map((c) => {
              if (c.id !== charId) return c;
              const modules = [...(c.modules || [])];
              const currentIndex = modules.findIndex((m) => m.id === moduleId);
              if (currentIndex === -1) return c;

              // Simplificação: apenas trocar com o item adjacente no array
              // Com grid-auto-flow: dense, a ordem do array dita a prioridade de preenchimento
              let targetIndex = -1;
              if (direction === "up") {
                if (currentIndex > 0) targetIndex = currentIndex - 1;
              } else {
                if (currentIndex < modules.length - 1)
                  targetIndex = currentIndex + 1;
              }

              if (targetIndex !== -1) {
                // Troca simples
                [modules[currentIndex], modules[targetIndex]] = [
                  modules[targetIndex],
                  modules[currentIndex],
                ];
                return { ...c, modules };
              }

              return c;
            }),
          };
        });
      },
      moveCharacterModuleColumn(charId, moduleId, direction) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  modules: (c.modules || []).map((m) => {
                    if (m.id !== moduleId) return m;
                    const currentColumn = m.column ?? 0;
                    let newColumn = currentColumn;
                    if (direction === "left")
                      newColumn = Math.max(0, currentColumn - 1) as 0 | 1 | 2;
                    if (direction === "right")
                      newColumn = Math.min(2, currentColumn + 1) as 0 | 1 | 2;
                    return { ...m, column: newColumn };
                  }),
                }
              : c,
          ),
        }));
      },
      removeCharacterModule(charId, moduleId) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  modules: (c.modules || []).filter((m) => m.id !== moduleId),
                }
              : c,
          ),
        }));
      },
      setCharacterModulesLayout(charId, layout) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) => {
            if (c.id !== charId) return c;

            const modules = c.modules || [];
            const layoutById = new Map(layout.map((item) => [item.id, item]));
            const modulesById = new Map(modules.map((module) => [module.id, module]));

            const ordered = layout
              .map((item) => modulesById.get(item.id))
              .filter((module): module is (typeof modules)[number] => Boolean(module));

            const missing = modules.filter(
              (module) => !layoutById.has(module.id),
            );

            const nextModules = [...ordered, ...missing].map((module) => {
              const nextLayout = layoutById.get(module.id);
              if (!nextLayout) return module;
              return {
                ...module,
                column: nextLayout.column,
                span: nextLayout.span,
                rowSpan: nextLayout.rowSpan,
              };
            });

            return {
              ...c,
              modules: nextModules.map((module) => normalizeModuleLayout(module)),
            };
          }),
        }));
      },
    };
  }, [
    characterApiClient,
    dualWriteEnabled,
    isCloudReady,
    user,
  ]);

  return (
    <RpgDataContext.Provider value={{ data, actions }}>
      {props.children}
    </RpgDataContext.Provider>
  );
}
