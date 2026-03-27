import { describe, expect, it } from "vitest";
import { CharacterAggregate } from "../../domain/aggregates/character.aggregate";
import { CharacterNotFoundError } from "../../domain/errors/character.errors";
import { PatchCombatStateUseCase } from "./patch-combat-state.use-case";
import type { CharacterRepository } from "../../domain/repositories/character.repository";

function createRepository(character: CharacterAggregate | null): CharacterRepository {
  let current = character;
  return {
    async findById() {
      return current;
    },
    async save(next) {
      current = next;
    },
  };
}

describe("PatchCombatStateUseCase", () => {
  it("deve atualizar combat state e retornar revision nova", async () => {
    const repository = createRepository(
      CharacterAggregate.create({
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
        revision: 5,
        updatedAt: "2026-03-24T00:00:00.000Z",
      }),
    );

    const useCase = new PatchCombatStateUseCase(repository);
    const result = await useCase.execute({
      characterId: "char_1",
      revision: 5,
      combatState: {
        wounds: 1,
        fatigue: 0,
        isIncapacitated: false,
        powerPointsCurrent: 8,
        powerPointsMax: 10,
      },
    });

    expect(result.revision).toBe(6);
    expect(result.combatState.wounds).toBe(1);
  });

  it("deve falhar com not found quando personagem nao existir", async () => {
    const repository = createRepository(null);
    const useCase = new PatchCombatStateUseCase(repository);

    await expect(
      useCase.execute({
        characterId: "missing",
        revision: 0,
        combatState: {
          wounds: 0,
          fatigue: 0,
          isIncapacitated: false,
          powerPointsCurrent: 0,
          powerPointsMax: 0,
        },
      }),
    ).rejects.toBeInstanceOf(CharacterNotFoundError);
  });
});
