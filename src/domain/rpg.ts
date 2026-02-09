import type { SavagePathfinderRank } from "./savagePathfinder";

export type RpgId = string;

export type Campaign = {
  id: RpgId;
  name: string;
  system: string;
  createdAtIso: string;
};

export type CharacterStats = {
  ca: number;
  hp: { current: number; max: number };
  initiative: number;
  pace?: number;
  parry?: number;
  toughness?: number;
  wounds?: number;
  fatigue?: number;
  isIncapacitated?: boolean;
};

export type CharacterAttributes = {
  agility: number;
  smarts: number;
  spirit: number;
  strength: number;
  vigor: number;
};

export type CharacterModule = {
  id: string;
  type:
    | "combat_stats"
    | "attributes"
    | "skills"
    | "text_block"
    | "hindrances"
    | "ancestral_abilities"
    | "edges_advancements"
    | "equipment"
    | "power_points"
    | "powers"
    | "weapons";
  system: "savage_pathfinder" | "generic";
  column?: 0 | 1 | 2;
  span?: 1 | 2 | 3;
  rowSpan?: 1 | 2 | 3;
  title?: string;
  notes?: string;
  data?: Record<string, unknown>;
};

export type Skill = {
  id: string;
  name: string;
  die: 4 | 6 | 8 | 10 | 12;
  modifier?: number;
  notes?: string;
};

export type Hindrance = {
  id: string;
  name: string;
  type?: "major" | "minor";
  notes?: string;
};

export type AncestralAbility = {
  id: string;
  name: string;
  notes?: string;
};

export type Edge = {
  id: string;
  name: string;
  notes?: string;
};

export type Advancement = {
  id: string; // N1, N2, E0, E1...
  value: string;
  notes?: string;
};

export type EquipmentItem = {
  id: string;
  name: string;
  cost: number;
  weight: number;
  notes?: string;
};

export type Power = {
  id: string;
  name: string;
  powerPoints: number;
  range: string;
  duration: string;
  effect: string;
};

export type Weapon = {
  id: string;
  name: string;
  range: string;
  damage: string;
  ap: number;
  rof: number;
  weight: number;
  notes: string;
};

export type Character = {
  id: RpgId;
  name: string;
  system: string;
  playerName: string;
  class?: string;
  race?: string;
  level?: number | SavagePathfinderRank;
  stats?: CharacterStats;
  attributes?: CharacterAttributes;
  modules: CharacterModule[];
  createdAtIso: string;
  avatarUrl?: string;
  background?: string;
};

export type Session = {
  id: RpgId;
  title: string;
  scheduledAtIso: string;
  createdAtIso: string;
  address?: string;
  campaignName?: string;
  notes?: string;
};

export type RpgDataV1 = {
  version: 1;
  campaign: Campaign;
  characters: Character[];
  sessions: Session[];
  notes: {
    campaign: string;
  };
};
