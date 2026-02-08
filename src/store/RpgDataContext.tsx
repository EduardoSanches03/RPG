import { createContext, useMemo, useState } from "react";
import type {
  Character,
  CharacterModule,
  RpgDataV1,
  Session,
} from "../domain/rpg";
import {
  createSeedData,
  loadRpgData,
  newId,
  newIsoNow,
  saveRpgData,
} from "./rpgStorage";

export type RpgDataActions = {
  setCampaignName: (name: string) => void;
  setCampaignSystem: (system: string) => void;
  upsertCharacter: (input: {
    id?: string;
    name: string;
    playerName: string;
    class?: string;
    race?: string;
    level?: number;
    system?: "savage_pathfinder" | "generic";
  }) => void;
  removeCharacter: (id: string) => void;
  addSession: (input: { title: string; scheduledAtIso: string }) => void;
  removeSession: (id: string) => void;
  setCampaignNotes: (notes: string) => void;
  resetToSeed: () => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  updateCharacterStats: (id: string, stats: Character["stats"]) => void;
  updateCharacterAttributes: (
    id: string,
    attrs: Character["attributes"],
  ) => void;

  // Módulos
  addCharacterModule: (
    charId: string,
    module: {
      type: CharacterModule["type"];
      system: CharacterModule["system"];
      title?: string;
      span?: 1 | 2 | 3;
      column?: 0 | 1 | 2;
    },
  ) => void;
  updateCharacterModule: (
    charId: string,
    moduleId: string,
    updates: Partial<CharacterModule>,
  ) => void;
  removeCharacterModule: (charId: string, moduleId: string) => void;
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
};

export type RpgDataContextValue = {
  data: RpgDataV1;
  actions: RpgDataActions;
};

export const RpgDataContext = createContext<RpgDataContextValue | null>(null);
