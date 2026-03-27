import { Injectable } from "@nestjs/common";
import { CharacterAggregate } from "../../domain/aggregates/character.aggregate";
import type { CharacterRepository } from "../../domain/repositories/character.repository";
import type { CharacterSnapshot } from "../../domain/aggregates/character.aggregate";

const seedCharacter: CharacterSnapshot = {
  id: "char_1",
  campaignId: "camp_1",
  name: "Thorg, Olho Quebrado",
  system: "savage_pathfinder",
  combatState: {
    wounds: 0,
    fatigue: 0,
    isIncapacitated: false,
    powerPointsCurrent: 10,
    powerPointsMax: 10,
  },
  revision: 1,
  updatedAt: new Date("2026-03-24T00:00:00.000Z").toISOString(),
};

@Injectable()
export class InMemoryCharacterRepository implements CharacterRepository {
  private readonly storage = new Map<string, CharacterSnapshot>([
    [seedCharacter.id, seedCharacter],
  ]);

  async findById(characterId: string) {
    const snapshot = this.storage.get(characterId);
    if (!snapshot) return null;
    return CharacterAggregate.reconstitute({
      ...snapshot,
      combatState: { ...snapshot.combatState },
    });
  }

  async save(character: CharacterAggregate) {
    const snapshot = character.toSnapshot();
    this.storage.set(snapshot.id, snapshot);
  }
}
