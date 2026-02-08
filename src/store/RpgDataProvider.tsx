import { useMemo, useState } from "react";
import type { Character, RpgDataV1, Session } from "../domain/rpg";
import { RpgDataContext, type RpgDataActions } from "./RpgDataContext";
import {
  createSeedData,
  loadRpgData,
  newId,
  newIsoNow,
  saveRpgData,
} from "./rpgStorage";

export function RpgDataProvider(props: { children: React.ReactNode }) {
  const [data, setData] = useState<RpgDataV1>(() => loadRpgData());

  const actions = useMemo<RpgDataActions>(() => {
    function commit(updater: (prev: RpgDataV1) => RpgDataV1) {
      setData((prev) => {
        const next = updater(prev);
        saveRpgData(next);
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
      upsertCharacter(input) {
        commit((prev) => {
          const now = newIsoNow();
          const id = input.id ?? newId();
          const exists = prev.characters.some((c) => c.id === id);
          const nextChar: Character = {
            id,
            name: input.name.trim(),
            system: input.system,
            playerName: input.playerName.trim(),
            class:
              input.class ??
              (exists
                ? prev.characters.find((c) => c.id === id)?.class
                : undefined),
            race:
              input.race ??
              (exists
                ? prev.characters.find((c) => c.id === id)?.race
                : undefined),
            level:
              input.level ??
              (exists ? prev.characters.find((c) => c.id === id)?.level : 1),
            createdAtIso: input.id
              ? (prev.characters.find((c) => c.id === id)?.createdAtIso ?? now)
              : now,
            stats: exists
              ? prev.characters.find((c) => c.id === id)?.stats
              : { ca: 10, hp: { current: 10, max: 10 }, initiative: 0 },
            attributes: exists
              ? prev.characters.find((c) => c.id === id)?.attributes
              : { agility: 4, smarts: 4, spirit: 4, strength: 4, vigor: 4 },
            modules: exists
              ? (prev.characters.find((c) => c.id === id)?.modules ?? [])
              : [],
          };
          const characters = exists
            ? prev.characters.map((c) => (c.id === id ? nextChar : c))
            : [nextChar, ...prev.characters];
          return { ...prev, characters };
        });
      },
      removeCharacter(id) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.filter((c) => c.id !== id),
        }));
      },
      addSession(input) {
        commit((prev) => {
          const now = newIsoNow();
          const nextSession: Session = {
            id: newId(),
            title: input.title.trim(),
            scheduledAtIso: input.scheduledAtIso,
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
        const next = createSeedData();
        saveRpgData(next);
        setData(next);
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
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === id ? { ...c, stats } : c,
          ),
        }));
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
                    {
                      id: newId(),
                      type: module.type,
                      system: module.system,
                      title: module.title,
                      span: module.span,
                      rowSpan: module.rowSpan,
                      column: module.column,
                    },
                  ],
                }
              : c,
          ),
        }));
      },
      updateCharacterModule(charId, moduleId, updates) {
        commit((prev) => ({
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === charId
              ? {
                  ...c,
                  modules: (c.modules || []).map((m) =>
                    m.id === moduleId ? { ...m, ...updates } : m,
                  ),
                }
              : c,
          ),
        }));
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
    };
  }, []);

  return (
    <RpgDataContext.Provider value={{ data, actions }}>
      {props.children}
    </RpgDataContext.Provider>
  );
}
