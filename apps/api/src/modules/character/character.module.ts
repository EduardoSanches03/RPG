import { Module } from "@nestjs/common";
import { CharacterController } from "./presentation/controllers/character.controller";
import { GetCharacterUseCase } from "./application/use-cases/get-character.use-case";
import { PatchCombatStateUseCase } from "./application/use-cases/patch-combat-state.use-case";
import { InMemoryCharacterRepository } from "./infrastructure/repositories/in-memory-character.repository";
import { CHARACTER_REPOSITORY } from "./application/ports/character-repository.token";

@Module({
  controllers: [CharacterController],
  providers: [
    {
      provide: CHARACTER_REPOSITORY,
      useClass: InMemoryCharacterRepository,
    },
    GetCharacterUseCase,
    PatchCombatStateUseCase,
  ],
})
export class CharacterModule {}
