import { createContext, useContext } from "react";
import type { Character, CharacterModule, RpgDataV1 } from "../domain/rpg";
import type { SavagePathfinderRank } from "../domain/savagePathfinder";

export type RpgDataActions = {
  createCampaign: (input?: {
    name?: string;
    system?: string;
    role?: "mestre" | "jogador";
    locale?: string;
    timeZone?: string;
  }) => void;
  removeCampaign: (campaignId: string) => void;
  setActiveCampaign: (campaignId: string) => void;
  setCampaignName: (name: string) => void;
  setCampaignSystem: (system: string) => void;
  registerCampaign: (input: {
    name: string;
    system: string;
    role: "mestre" | "jogador";
    locale: string;
    timeZone: string;
  }) => void;
  setCampaignPartyMembers: (characterIds: string[]) => void;
  setSocialFriends: (
    friends: Array<{
      id: string;
      name: string;
      status: "online" | "in_party" | "offline";
      activity?: string;
      avatarUrl?: string;
    }>,
  ) => void;
  sendFriendRequest: (input: {
    id: string;
    name: string;
    handle?: string;
    avatarUrl?: string;
  }) => void;
  setSentFriendRequests: (
    requests: Array<{
      id: string;
      name: string;
      handle?: string;
      avatarUrl?: string;
      sentAtIso: string;
      status?: "pending";
    }>,
  ) => void;
  upsertCharacter: (input: {
    id?: string;
    name: string;
    system: string;
    playerName: string;
    class?: string;
    race?: string;
    ancestry?: string;
    height?: string;
    weight?: string;
    edges?: number;
    conviction?: number;
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
  setCharacterModulesLayout: (
    charId: string,
    layout: Array<{
      id: string;
      column: 0 | 1 | 2;
      span: 1 | 2 | 3;
      rowSpan: 1 | 2 | 3;
    }>,
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
