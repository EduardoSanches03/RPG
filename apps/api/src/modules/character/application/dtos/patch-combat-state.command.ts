import type { CombatStatePrimitives } from "../../domain/value-objects/combat-state.vo";

export type PatchCombatStateCommand = {
  characterId: string;
  revision: number;
  combatState: CombatStatePrimitives;
};
