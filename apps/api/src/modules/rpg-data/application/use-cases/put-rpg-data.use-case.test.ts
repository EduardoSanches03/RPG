import { describe, expect, it } from "vitest";
import { RpgDataAggregate } from "../../domain/aggregates/rpg-data.aggregate";
import { createSeedRpgDataPayload } from "../../domain/factories/rpg-data-seed.factory";
import { PutRpgDataUseCase } from "./put-rpg-data.use-case";
import { RpgDataRevisionConflictError } from "../../domain/errors/rpg-data.errors";
import type { RpgDataRepository } from "../../domain/repositories/rpg-data.repository";

function createRepository(seed?: RpgDataAggregate): RpgDataRepository {
  const map = new Map<string, RpgDataAggregate>();
  if (seed) {
    const snapshot = seed.toSnapshot();
    map.set(snapshot.userId, seed);
  }

  return {
    async findByUserId(userId) {
      return map.get(userId) ?? null;
    },
    async save(rpgData) {
      map.set(rpgData.toSnapshot().userId, rpgData);
    },
  };
}

describe("PutRpgDataUseCase", () => {
  it("deve salvar dados novos com revision correta", async () => {
    const repository = createRepository(
      RpgDataAggregate.create({
        userId: "u-1",
        data: createSeedRpgDataPayload(),
        revision: 1,
        updatedAt: "2026-03-24T00:00:00.000Z",
      }),
    );
    const useCase = new PutRpgDataUseCase(repository);
    const payload = createSeedRpgDataPayload();
    payload.notes.campaign = "Nova nota";

    const result = await useCase.execute({
      userId: "u-1",
      revision: 1,
      data: payload,
    });

    expect(result.revision).toBe(2);
    expect(result.data.notes.campaign).toBe("Nova nota");
  });

  it("deve falhar em conflito de revision", async () => {
    const repository = createRepository(
      RpgDataAggregate.create({
        userId: "u-1",
        data: createSeedRpgDataPayload(),
        revision: 3,
        updatedAt: "2026-03-24T00:00:00.000Z",
      }),
    );
    const useCase = new PutRpgDataUseCase(repository);

    await expect(
      useCase.execute({
        userId: "u-1",
        revision: 2,
        data: createSeedRpgDataPayload(),
      }),
    ).rejects.toBeInstanceOf(RpgDataRevisionConflictError);
  });
});
