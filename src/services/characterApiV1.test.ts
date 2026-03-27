import type { Character } from "../domain/rpg";
import {
  CharacterApiError,
  createCharacterApiV1Client,
  extractCombatStateFromCharacter,
  isRevisionConflictError,
  parseCharacterResponseV1,
} from "./characterApiV1";

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
      wounds: 2,
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
        data: { current: 6, max: 10 },
      },
    ],
    ...overrides,
  };
}

describe("characterApiV1", () => {
  it("deve extrair combatState do personagem local", () => {
    const combatState = extractCombatStateFromCharacter(buildCharacter());

    expect(combatState).toEqual({
      wounds: 2,
      fatigue: 1,
      isIncapacitated: false,
      powerPointsCurrent: 6,
      powerPointsMax: 10,
    });
  });

  it("deve validar payload do contrato character v1", () => {
    const parsed = parseCharacterResponseV1({
      id: "char-1",
      campaignId: "camp-1",
      name: "Thorg",
      system: "savage_pathfinder",
      combatState: {
        wounds: 1,
        fatigue: 0,
        isIncapacitated: false,
        powerPointsCurrent: 4,
        powerPointsMax: 10,
      },
      revision: 5,
      updatedAt: "2026-03-24T12:35:00.000Z",
    });

    expect(parsed.revision).toBe(5);
    expect(parsed.combatState.wounds).toBe(1);
  });

  it("deve rejeitar payload com invariante quebrada de savage pathfinder", () => {
    expect(() =>
      parseCharacterResponseV1({
        id: "char-1",
        campaignId: "camp-1",
        name: "Thorg",
        system: "savage_pathfinder",
        combatState: {
          wounds: 4,
          fatigue: 0,
          isIncapacitated: false,
          powerPointsCurrent: 4,
          powerPointsMax: 10,
        },
        revision: 5,
        updatedAt: "2026-03-24T12:35:00.000Z",
      }),
    ).toThrow(/wounds fora do limite/i);
  });

  it("deve mapear conflito de revision em erro tipado", async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "REVISION_CONFLICT",
            message: "Conflito",
            details: { currentRevision: 9 },
          },
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    });

    const client = createCharacterApiV1Client({
      baseUrl: "/api/v1",
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    await expect(
      client.patchCombatState("char-1", {
        wounds: 1,
        fatigue: 0,
        isIncapacitated: false,
        powerPointsCurrent: 3,
        powerPointsMax: 10,
        revision: 8,
      }),
    ).rejects.toBeInstanceOf(CharacterApiError);

    const error = await client
      .patchCombatState("char-1", {
        wounds: 1,
        fatigue: 0,
        isIncapacitated: false,
        powerPointsCurrent: 3,
        powerPointsMax: 10,
        revision: 8,
      })
      .catch((caught) => caught as unknown);

    expect(isRevisionConflictError(error)).toBe(true);
  });
});
