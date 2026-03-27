import type { Character } from "../domain/rpg";
import {
  CharacterApiError,
  extractCombatStateFromCharacter,
  type CharacterApiV1Client,
  isRevisionConflictError,
} from "./characterApiV1";

export type CharacterRevisionStore = {
  get: (characterId: string) => number | undefined;
  set: (characterId: string, revision: number) => void;
};

export function createCharacterRevisionStore(
  seed?: Record<string, number>,
): CharacterRevisionStore {
  const map = new Map<string, number>(Object.entries(seed ?? {}));
  return {
    get(characterId) {
      return map.get(characterId);
    },
    set(characterId, revision) {
      map.set(characterId, revision);
    },
  };
}

export type DualWriteResult =
  | { status: "skipped" }
  | { status: "synced"; revision: number }
  | { status: "conflict"; currentRevision?: number }
  | { status: "failed"; error: unknown };

export async function dualWriteCharacterCombatState(input: {
  enabled: boolean;
  client: CharacterApiV1Client | null;
  character: Character;
  revisions: CharacterRevisionStore;
}): Promise<DualWriteResult> {
  if (!input.enabled || !input.client) return { status: "skipped" };

  const revision = input.revisions.get(input.character.id) ?? 0;
  const combatState = extractCombatStateFromCharacter(input.character);

  try {
    const response = await input.client.patchCombatState(input.character.id, {
      ...combatState,
      revision,
    });
    input.revisions.set(input.character.id, response.revision);
    return { status: "synced", revision: response.revision };
  } catch (error) {
    if (isRevisionConflictError(error)) {
      const currentRevision =
        error instanceof CharacterApiError &&
        typeof error.details?.currentRevision === "number"
          ? error.details.currentRevision
          : undefined;
      if (typeof currentRevision === "number") {
        input.revisions.set(input.character.id, currentRevision);
      }
      return { status: "conflict", currentRevision };
    }
    return { status: "failed", error };
  }
}
