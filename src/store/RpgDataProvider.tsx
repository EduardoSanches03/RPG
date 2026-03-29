import { useEffect, useMemo, useRef, useState } from "react";
import type { Campaign, Character, CharacterModule, RpgDataV1, Session } from "../domain/rpg";
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

function ensureCampaignState(data: RpgDataV1) {
  const list = data.campaigns?.length ? [...data.campaigns] : [data.campaign];
  const deduped = list.filter((campaign, index) => list.findIndex((entry) => entry.id === campaign.id) === index);
  const campaigns = deduped.length > 0 ? deduped : [data.campaign];
  const hasActive = campaigns.some((campaign) => campaign.id === data.activeCampaignId);
  const activeCampaignId = hasActive ? data.activeCampaignId ?? campaigns[0].id : campaigns[0].id;
  const activeCampaign = campaigns.find((campaign) => campaign.id === activeCampaignId) ?? campaigns[0];
  return { campaigns, activeCampaignId, activeCampaign };
}

function ensureNotesByCampaign(data: RpgDataV1, activeCampaignId: string) {
  const byCampaign = { ...(data.notes.byCampaign ?? {}) };
  if (typeof byCampaign[activeCampaignId] !== "string") {
    byCampaign[activeCampaignId] = data.notes.campaign ?? "";
  }
  return byCampaign;
}

function resolveCampaignScopedData(data: RpgDataV1): RpgDataV1 {
  const { campaigns, activeCampaignId, activeCampaign } = ensureCampaignState(data);
  const notesByCampaign = ensureNotesByCampaign(data, activeCampaignId);
  const campaignNote = notesByCampaign[activeCampaignId] ?? "";
  const activeName = activeCampaign.name.trim().toLowerCase();
  const filteredSessions = data.sessions.filter((session) => {
    if (session.campaignId && session.campaignId.trim().length > 0) {
      return session.campaignId === activeCampaignId;
    }
    if (session.campaignName && session.campaignName.trim().length > 0) {
      return session.campaignName.trim().toLowerCase() === activeName;
    }
    return true;
  });

  return {
    ...data,
    campaign: activeCampaign,
    campaigns,
    activeCampaignId,
    sessions: filteredSessions,
    notes: {
      ...data.notes,
      campaign: campaignNote,
      byCampaign: notesByCampaign,
    },
  };
}

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

    function resolveCampaignState(prev: RpgDataV1) {
      const campaigns = prev.campaigns?.length ? [...prev.campaigns] : [prev.campaign];
      const activeCampaignId = campaigns.some((campaign) => campaign.id === prev.activeCampaignId)
        ? prev.activeCampaignId ?? campaigns[0].id
        : campaigns[0].id;
      const activeCampaign =
        campaigns.find((campaign) => campaign.id === activeCampaignId) ?? campaigns[0];
      return { campaigns, activeCampaignId, activeCampaign };
    }

    function withCampaignState(
      prev: RpgDataV1,
      nextCampaigns: Campaign[],
      nextActiveCampaignId: string,
    ) {
      const campaignPool = nextCampaigns.length > 0 ? nextCampaigns : [prev.campaign];
      const activeCampaign =
        campaignPool.find((campaign) => campaign.id === nextActiveCampaignId) ??
        campaignPool[0];
      return {
        ...prev,
        campaigns: campaignPool,
        activeCampaignId: activeCampaign.id,
        campaign: activeCampaign,
      };
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
      createCampaign(input) {
        commit((prev) => {
          const { campaigns, activeCampaign } = resolveCampaignState(prev);
          const baseName = input?.name?.trim() || `Campanha ${campaigns.length + 1}`;
          const existingNames = new Set(
            campaigns.map((campaign) => campaign.name.trim().toLowerCase()).filter(Boolean),
          );
          let nextName = baseName;
          let suffix = 2;
          while (existingNames.has(nextName.trim().toLowerCase())) {
            nextName = `${baseName} ${suffix}`;
            suffix += 1;
          }

          const now = newIsoNow();
          const createdCampaign: Campaign = {
            id: newId(),
            name: nextName,
            system: input?.system?.trim() || activeCampaign.system || "savage_pathfinder",
            createdAtIso: now,
            role: input?.role ?? activeCampaign.role ?? "mestre",
            locale: input?.locale?.trim() || activeCampaign.locale || "pt-BR",
            timeZone: input?.timeZone?.trim() || activeCampaign.timeZone || "America/Sao_Paulo",
            isRegistered: false,
            partyMemberIds: [],
          };
          const nextCampaigns = [createdCampaign, ...campaigns];
          const notesByCampaign = {
            ...(prev.notes.byCampaign ?? {}),
            [createdCampaign.id]: "",
          };
          const next = withCampaignState(prev, nextCampaigns, createdCampaign.id);
          return {
            ...next,
            notes: {
              ...prev.notes,
              campaign: "",
              byCampaign: notesByCampaign,
            },
          };
        });
      },
      removeCampaign(campaignId) {
        commit((prev) => {
          const targetId = campaignId.trim();
          if (!targetId) return prev;
          const { campaigns, activeCampaignId } = resolveCampaignState(prev);
          if (campaigns.length <= 1) return prev;
          const removedCampaign = campaigns.find((campaign) => campaign.id === targetId);
          if (!removedCampaign) return prev;

          const remainingCampaigns = campaigns.filter((campaign) => campaign.id !== targetId);
          if (!remainingCampaigns.length) return prev;

          const nextActiveCampaignId =
            targetId === activeCampaignId ? remainingCampaigns[0].id : activeCampaignId;
          const next = withCampaignState(prev, remainingCampaigns, nextActiveCampaignId);

          const notesByCampaign = { ...(prev.notes.byCampaign ?? {}) };
          delete notesByCampaign[targetId];
          const nextCampaignNote = notesByCampaign[nextActiveCampaignId] ?? "";
          const removedCampaignName = removedCampaign.name.trim().toLowerCase();
          const nextSessions = prev.sessions.filter((session) => {
            if (session.campaignId && session.campaignId.trim().length > 0) {
              return session.campaignId !== targetId;
            }
            if (!removedCampaignName) return true;
            const sessionCampaignName = session.campaignName?.trim().toLowerCase();
            if (!sessionCampaignName) return true;
            return sessionCampaignName !== removedCampaignName;
          });

          return {
            ...next,
            sessions: nextSessions,
            notes: {
              ...prev.notes,
              campaign: nextCampaignNote,
              byCampaign: notesByCampaign,
            },
          };
        });
      },
      setActiveCampaign(campaignId) {
        commit((prev) => {
          const targetId = campaignId.trim();
          if (!targetId) return prev;
          const { campaigns, activeCampaignId } = resolveCampaignState(prev);
          if (!campaigns.some((campaign) => campaign.id === targetId)) return prev;
          if (targetId === activeCampaignId) return prev;
          const notesByCampaign = ensureNotesByCampaign(prev, targetId);
          const next = withCampaignState(prev, campaigns, targetId);
          return {
            ...next,
            notes: {
              ...prev.notes,
              campaign: notesByCampaign[targetId] ?? "",
              byCampaign: notesByCampaign,
            },
          };
        });
      },
      setCampaignName(name) {
        commit((prev) => {
          const { campaigns, activeCampaignId } = resolveCampaignState(prev);
          const nextCampaigns = campaigns.map((campaign) =>
            campaign.id === activeCampaignId ? { ...campaign, name } : campaign,
          );
          const sanitizedName = name.trim();
          const nextSessions =
            sanitizedName.length > 0
              ? prev.sessions.map((session) =>
                  session.campaignId === activeCampaignId
                    ? { ...session, campaignName: sanitizedName }
                    : session,
                )
              : prev.sessions;
          const next = withCampaignState(prev, nextCampaigns, activeCampaignId);
          return {
            ...next,
            sessions: nextSessions,
          };
        });
      },
      setCampaignSystem(system) {
        commit((prev) => {
          const { campaigns, activeCampaignId } = resolveCampaignState(prev);
          const nextCampaigns = campaigns.map((campaign) =>
            campaign.id === activeCampaignId ? { ...campaign, system } : campaign,
          );
          return withCampaignState(prev, nextCampaigns, activeCampaignId);
        });
      },
      registerCampaign(input) {
        commit((prev) => {
          const { campaigns, activeCampaignId, activeCampaign } = resolveCampaignState(prev);
          const nextCampaigns = campaigns.map((campaign) =>
            campaign.id === activeCampaignId
              ? {
                  ...campaign,
                  name: input.name.trim(),
                  system: input.system.trim(),
                  role: input.role,
                  locale: input.locale.trim(),
                  timeZone: input.timeZone.trim(),
                  isRegistered: true,
                  partyMemberIds: campaign.partyMemberIds ?? [],
                }
              : campaign,
          );
          const notesByCampaign = ensureNotesByCampaign(prev, activeCampaignId);
          if (typeof notesByCampaign[activeCampaignId] !== "string") {
            notesByCampaign[activeCampaignId] = prev.notes.campaign ?? "";
          }
          const next = withCampaignState(prev, nextCampaigns, activeCampaignId);
          return {
            ...next,
            notes: {
              ...prev.notes,
              campaign: notesByCampaign[activeCampaign.id] ?? prev.notes.campaign ?? "",
              byCampaign: notesByCampaign,
            },
          };
        });
      },
      setCampaignPartyMembers(characterIds) {
        commit((prev) => {
          const { campaigns, activeCampaignId } = resolveCampaignState(prev);
          const ids = characterIds
            .map((id) => id.trim())
            .filter((id) => id.length > 0);
          const existingIds = new Set(prev.characters.map((character) => character.id));
          const filtered = Array.from(new Set(ids.filter((id) => existingIds.has(id))));
          const nextCampaigns = campaigns.map((campaign) =>
            campaign.id === activeCampaignId
              ? {
                  ...campaign,
                  partyMemberIds: filtered,
                }
              : campaign,
          );
          return withCampaignState(prev, nextCampaigns, activeCampaignId);
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
          const { campaigns, activeCampaignId, activeCampaign } = resolveCampaignState(prev);
          const now = newIsoNow();
          const id = input.id ?? newId();
          const existingCharacter = prev.characters.find((character) => character.id === id);
          const exists = Boolean(existingCharacter);
          const system = input.system.trim() || activeCampaign.system || "savage_pathfinder";
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
            campaignId: existingCharacter?.campaignId ?? activeCampaignId,
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
            ? activeCampaign.partyMemberIds ?? []
            : Array.from(new Set([...(activeCampaign.partyMemberIds ?? []), id]));
          const nextCampaigns = campaigns.map((campaign) =>
            campaign.id === activeCampaignId
              ? {
                  ...campaign,
                  partyMemberIds,
                }
              : campaign,
          );
          const next = withCampaignState(prev, nextCampaigns, activeCampaignId);
          return {
            ...next,
            characters,
          };
        });
      },
      removeCharacter(id) {
        commit((prev) => {
          const { campaigns, activeCampaignId } = resolveCampaignState(prev);
          const nextCampaigns = campaigns.map((campaign) => ({
            ...campaign,
            partyMemberIds: (campaign.partyMemberIds ?? []).filter(
              (characterId) => characterId !== id,
            ),
          }));
          const next = withCampaignState(prev, nextCampaigns, activeCampaignId);
          return {
            ...next,
            characters: prev.characters.filter((character) => character.id !== id),
          };
        });
      },
      addSession(input) {
        commit((prev) => {
          const { activeCampaignId, activeCampaign } = resolveCampaignState(prev);
          const now = newIsoNow();
          const campaignName = input.campaignName?.trim() || activeCampaign.name;
          const nextSession: Session = {
            id: newId(),
            title: input.title.trim(),
            scheduledAtIso: input.scheduledAtIso,
            campaignId: activeCampaignId,
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
        commit((prev) => {
          const { activeCampaignId } = resolveCampaignState(prev);
          const byCampaign = ensureNotesByCampaign(prev, activeCampaignId);
          byCampaign[activeCampaignId] = notes;
          return {
            ...prev,
            notes: {
              ...prev.notes,
              campaign: notes,
              byCampaign,
            },
          };
        });
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
  const scopedData = useMemo(() => resolveCampaignScopedData(data), [data]);

  return (
    <RpgDataContext.Provider value={{ data: scopedData, actions }}>
      {props.children}
    </RpgDataContext.Provider>
  );
}
