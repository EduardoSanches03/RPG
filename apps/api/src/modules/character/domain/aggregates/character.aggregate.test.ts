import { describe, expect, it } from "vitest";
import { CharacterAggregate } from "./character.aggregate";
import {
  InvariantViolationError,
  RevisionConflictError,
} from "../errors/character.errors";

function createAggregate() {
  return CharacterAggregate.create({
    id: "char_1",
    campaignId: "camp_1",
    name: "Thorg",
    system: "savage_pathfinder",
    combatState: {
      wounds: 0,
      fatigue: 0,
      isIncapacitated: false,
      powerPointsCurrent: 10,
      powerPointsMax: 10,
    },
    revision: 3,
    updatedAt: "2026-03-24T00:00:00.000Z",
  });
}

describe("CharacterAggregate", () => {
  it("deve aplicar patch de combat state e incrementar revision", () => {
    const character = createAggregate();
    character.patchCombatState({
      revision: 3,
      combatState: {
        wounds: 1,
        fatigue: 0,
        isIncapacitated: false,
        powerPointsCurrent: 8,
        powerPointsMax: 10,
      },
      nowIso: "2026-03-24T01:00:00.000Z",
    });

    const snapshot = character.toSnapshot();
    expect(snapshot.revision).toBe(4);
    expect(snapshot.combatState.wounds).toBe(1);
    expect(snapshot.updatedAt).toBe("2026-03-24T01:00:00.000Z");
  });

  it("deve lancar conflito quando revision nao confere", () => {
    const character = createAggregate();

    expect(() =>
      character.patchCombatState({
        revision: 2,
        combatState: {
          wounds: 1,
          fatigue: 0,
          isIncapacitated: false,
          powerPointsCurrent: 8,
          powerPointsMax: 10,
        },
      }),
    ).toThrow(RevisionConflictError);
  });

  it("deve rejeitar violacao de invariante de savage pathfinder", () => {
    const character = createAggregate();

    expect(() =>
      character.patchCombatState({
        revision: 3,
        combatState: {
          wounds: 4,
          fatigue: 0,
          isIncapacitated: false,
          powerPointsCurrent: 8,
          powerPointsMax: 10,
        },
      }),
    ).toThrow(InvariantViolationError);
  });
});
