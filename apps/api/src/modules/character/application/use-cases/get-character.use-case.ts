import { Inject, Injectable } from "@nestjs/common";
import {
  CHARACTER_REPOSITORY,
} from "../ports/character-repository.token";
import { CharacterNotFoundError } from "../../domain/errors/character.errors";
import type { CharacterRepository } from "../../domain/repositories/character.repository";

@Injectable()
export class GetCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly repository: CharacterRepository,
  ) {}

  async execute(characterId: string) {
    const character = await this.repository.findById(characterId);
    if (!character) throw new CharacterNotFoundError(characterId);
    return character.toSnapshot();
  }
}
