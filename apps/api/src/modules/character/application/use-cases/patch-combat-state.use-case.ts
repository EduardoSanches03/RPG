import { Inject, Injectable } from "@nestjs/common";
import {
  CHARACTER_REPOSITORY,
} from "../ports/character-repository.token";
import { CharacterNotFoundError } from "../../domain/errors/character.errors";
import type { CharacterRepository } from "../../domain/repositories/character.repository";
import type { PatchCombatStateCommand } from "../dtos/patch-combat-state.command";

@Injectable()
export class PatchCombatStateUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly repository: CharacterRepository,
  ) {}

  async execute(command: PatchCombatStateCommand) {
    const character = await this.repository.findById(command.characterId);
    if (!character) throw new CharacterNotFoundError(command.characterId);

    character.patchCombatState({
      revision: command.revision,
      combatState: command.combatState,
    });
    await this.repository.save(character);

    const snapshot = character.toSnapshot();
    return {
      id: snapshot.id,
      combatState: snapshot.combatState,
      revision: snapshot.revision,
      updatedAt: snapshot.updatedAt,
    };
  }
}
