import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Put,
  Query,
} from "@nestjs/common";
import { ZodError } from "zod";
import { GetRpgDataUseCase } from "../../application/use-cases/get-rpg-data.use-case";
import { PutRpgDataUseCase } from "../../application/use-cases/put-rpg-data.use-case";
import { putRpgDataBodySchema } from "../../application/dtos/put-rpg-data.dto";
import {
  RpgDataInvariantViolationError,
  RpgDataRevisionConflictError,
} from "../../domain/errors/rpg-data.errors";
import { toRpgDataViewModel } from "../view-models/rpg-data.view-model";

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

function resolveUserId(input: { queryUserId?: string; headerUserId?: string }) {
  const raw = input.queryUserId ?? input.headerUserId ?? "local-user";
  const userId = raw.trim();
  return userId.length ? userId : "local-user";
}

@Controller("api/v1/rpg-data")
export class RpgDataController {
  constructor(
    private readonly getRpgDataUseCase: GetRpgDataUseCase,
    private readonly putRpgDataUseCase: PutRpgDataUseCase,
  ) {}

  @Get()
  async getRpgData(
    @Query("userId") queryUserId?: string,
    @Headers("x-user-id") headerUserId?: string,
  ) {
    const userId = resolveUserId({ queryUserId, headerUserId });
    const snapshot = await this.getRpgDataUseCase.execute(userId);
    return toRpgDataViewModel(snapshot);
  }

  @Put()
  async putRpgData(
    @Body() body: unknown,
    @Query("userId") queryUserId?: string,
    @Headers("x-user-id") headerUserId?: string,
  ) {
    const userId = resolveUserId({ queryUserId, headerUserId });

    try {
      const parsed = putRpgDataBodySchema.parse(body);
      const snapshot = await this.putRpgDataUseCase.execute({
        userId,
        revision: parsed.revision,
        data: parsed.data,
      });
      return toRpgDataViewModel(snapshot);
    } catch (error) {
      if (error instanceof ZodError) {
        throw toApiError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "VALIDATION_ERROR",
          "Payload invalido",
          { issues: error.issues },
        );
      }

      if (error instanceof RpgDataRevisionConflictError) {
        throw toApiError(
          HttpStatus.CONFLICT,
          "REVISION_CONFLICT",
          "RPG data foi atualizado por outro cliente.",
          { currentRevision: error.currentRevision },
        );
      }

      if (error instanceof RpgDataInvariantViolationError) {
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
