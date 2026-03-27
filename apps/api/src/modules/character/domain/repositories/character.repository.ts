import type { CharacterAggregate } from "../aggregates/character.aggregate";

export interface CharacterRepository {
  findById(characterId: string): Promise<CharacterAggregate | null>;
  save(character: CharacterAggregate): Promise<void>;
}
