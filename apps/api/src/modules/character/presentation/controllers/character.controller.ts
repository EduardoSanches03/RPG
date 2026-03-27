import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
} from "@nestjs/common";
import { ZodError } from "zod";
import { GetCharacterUseCase } from "../../application/use-cases/get-character.use-case";
import { PatchCombatStateUseCase } from "../../application/use-cases/patch-combat-state.use-case";
import {
  CharacterNotFoundError,
  InvariantViolationError,
  RevisionConflictError,
} from "../../domain/errors/character.errors";
import { patchCombatStateSchema } from "../../application/dtos/patch-combat-state.dto";
import {
  toCharacterViewModel,
  toPatchCombatStateViewModel,
} from "../view-models/character.view-model";

function toApiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return new HttpException(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    status,
  );
}

@Controller("api/v1/characters")
export class CharacterController {
  constructor(
    private readonly getCharacterUseCase: GetCharacterUseCase,
    private readonly patchCombatStateUseCase: PatchCombatStateUseCase,
  ) {}

  @Get(":characterId")
  async getCharacter(@Param("characterId") characterId: string) {
    try {
      const snapshot = await this.getCharacterUseCase.execute(characterId);
      return toCharacterViewModel(snapshot);
    } catch (error) {
      if (error instanceof CharacterNotFoundError) {
        throw toApiError(HttpStatus.NOT_FOUND, "NOT_FOUND", error.message);
      }
      throw error;
    }
  }

  @Patch(":characterId/combat-state")
  async patchCombatState(
    @Param("characterId") characterId: string,
    @Body() body: unknown,
  ) {
    try {
      const parsed = patchCombatStateSchema.parse(body);
      const snapshot = await this.patchCombatStateUseCase.execute({
        characterId,
        revision: parsed.revision,
        combatState: {
          wounds: parsed.wounds,
          fatigue: parsed.fatigue,
          isIncapacitated: parsed.isIncapacitated,
          powerPointsCurrent: parsed.powerPointsCurrent,
          powerPointsMax: parsed.powerPointsMax,
        },
      });
      return toPatchCombatStateViewModel(snapshot);
    } catch (error) {
      if (error instanceof ZodError) {
        throw toApiError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "VALIDATION_ERROR",
          "Payload invalido",
          { issues: error.issues },
        );
      }

      if (error instanceof CharacterNotFoundError) {
        throw toApiError(HttpStatus.NOT_FOUND, "NOT_FOUND", error.message);
      }

      if (error instanceof RevisionConflictError) {
        throw toApiError(
          HttpStatus.CONFLICT,
          "REVISION_CONFLICT",
          "A ficha foi atualizada por outro cliente.",
          { currentRevision: error.currentRevision },
        );
      }

      if (error instanceof InvariantViolationError) {
        throw toApiError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "INVARIANT_VIOLATION",
          error.message,
        );
      }

      throw error;
    }
  }
}
