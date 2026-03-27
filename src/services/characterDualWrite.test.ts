import { CharacterApiError, type CharacterApiV1Client } from "./characterApiV1";
import {
  createCharacterRevisionStore,
  dualWriteCharacterCombatState,
} from "./characterDualWrite";
import type { Character } from "../domain/rpg";

function buildCharacter(overrides?: Partial<Character>): Character {
  return {
    id: "char-1",
    name: "Thorg",
    system: "savage_pathfinder",
    playerName: "Jogador",
    class: "Druida",
    race: "Humano",
    level: "Novato",
    createdAtIso: "2026-03-24T00:00:00.000Z",
    stats: {
      ca: 10,
      hp: { current: 10, max: 10 },
      initiative: 0,
      pace: 6,
      parry: 6,
      toughness: 8,
      fatigue: 1,
      wounds: 1,
      isIncapacitated: false,
    },
    attributes: {
      agility: 6,
      smarts: 6,
      spirit: 6,
      strength: 6,
      vigor: 6,
    },
    modules: [
      {
        id: "m-pp",
        type: "power_points",
        system: "savage_pathfinder",
        data: { current: 5, max: 10 },
      },
    ],
    ...overrides,
  };
}

describe("characterDualWrite", () => {
  it("deve ignorar dual-write quando feature flag estiver desabilitada", async () => {
    const patchCombatState = vi.fn();
    const client = { patchCombatState } as unknown as CharacterApiV1Client;
    const revisions = createCharacterRevisionStore();

    const result = await dualWriteCharacterCombatState({
      enabled: false,
      client,
      character: buildCharacter(),
      revisions,
    });

    expect(result).toEqual({ status: "skipped" });
    expect(patchCombatState).not.toHaveBeenCalled();
  });

  it("deve enviar patch de combatState e atualizar revision no sucesso", async () => {
    const patchCombatState = vi.fn(async () => ({
      id: "char-1",
      combatState: {
        wounds: 1,
        fatigue: 1,
        isIncapacitated: false,
        powerPointsCurrent: 5,
        powerPointsMax: 10,
      },
      revision: 12,
      updatedAt: "2026-03-24T12:30:00.000Z",
    }));

    const client = { patchCombatState } as unknown as CharacterApiV1Client;
    const revisions = createCharacterRevisionStore({ "char-1": 11 });

    const result = await dualWriteCharacterCombatState({
      enabled: true,
      client,
      character: buildCharacter(),
      revisions,
    });

    expect(result).toEqual({ status: "synced", revision: 12 });
    expect(patchCombatState).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({ revision: 11 }),
    );
    expect(revisions.get("char-1")).toBe(12);
  });

  it("deve tratar conflito de revision e atualizar revision local", async () => {
    const patchCombatState = vi.fn(async () => {
      throw new CharacterApiError({
        message: "Conflito",
        status: 409,
        code: "REVISION_CONFLICT",
        details: { currentRevision: 19 },
      });
    });

    const client = { patchCombatState } as unknown as CharacterApiV1Client;
    const revisions = createCharacterRevisionStore({ "char-1": 18 });

    const result = await dualWriteCharacterCombatState({
      enabled: true,
      client,
      character: buildCharacter(),
      revisions,
    });

    expect(result).toEqual({ status: "conflict", currentRevision: 19 });
    expect(revisions.get("char-1")).toBe(19);
  });
});
