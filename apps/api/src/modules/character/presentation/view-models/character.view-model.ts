import type { CharacterSnapshot } from "../../domain/aggregates/character.aggregate";

export type CharacterViewModel = CharacterSnapshot;

export type PatchCombatStateViewModel = Pick<
  CharacterSnapshot,
  "id" | "combatState" | "revision" | "updatedAt"
>;

export function toCharacterViewModel(snapshot: CharacterSnapshot): CharacterViewModel {
  return snapshot;
}

export function toPatchCombatStateViewModel(
  snapshot: PatchCombatStateViewModel,
): PatchCombatStateViewModel {
  return snapshot;
}
