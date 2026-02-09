import { createContext, useContext } from "react";
import type { Character, CharacterModule, RpgDataV1 } from "../domain/rpg";
import type { SavagePathfinderRank } from "../domain/savagePathfinder";

export type RpgDataActions = {
  setCampaignName: (name: string) => void;
  setCampaignSystem: (system: string) => void;
  upsertCharacter: (input: {
    id?: string;
    name: string;
    system: string;
    playerName: string;
    class?: string;
    race?: string;
    level?: number | SavagePathfinderRank;
  }) => void;
  removeCharacter: (id: string) => void;
  addSession: (input: {
    title: string;
    scheduledAtIso: string;
    address?: string;
    campaignName?: string;
    notes?: string;
  }) => void;
  removeSession: (id: string) => void;
  setCampaignNotes: (notes: string) => void;
  resetToSeed: () => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  updateCharacterStats: (id: string, stats: Character["stats"]) => void;
  updateCharacterAttributes: (
    id: string,
    attrs: Character["attributes"],
  ) => void;
  addCharacterModule: (
    charId: string,
    module: {
      type: CharacterModule["type"];
      system: CharacterModule["system"];
      title?: string;
      span?: 1 | 2 | 3;
      rowSpan?: 1 | 2 | 3;
      column?: 0 | 1 | 2;
    },
  ) => void;
  updateCharacterModule: (
    charId: string,
    moduleId: string,
    updates: Partial<CharacterModule>,
  ) => void;
  reorderCharacterModule: (
    charId: string,
    moduleId: string,
    direction: "up" | "down",
  ) => void;
  moveCharacterModuleColumn: (
    charId: string,
    moduleId: string,
    direction: "left" | "right",
  ) => void;
  removeCharacterModule: (charId: string, moduleId: string) => void;
};

export type RpgDataContextValue = {
  data: RpgDataV1;
  actions: RpgDataActions;
};

export const RpgDataContext = createContext<RpgDataContextValue | null>(null);

export function useRpgData() {
  const ctx = useContext(RpgDataContext);
  if (!ctx) {
    throw new Error("useRpgData must be used within RpgDataProvider");
  }
  return ctx;
}
