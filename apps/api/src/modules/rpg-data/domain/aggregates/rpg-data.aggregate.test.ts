import { describe, expect, it } from "vitest";
import { createSeedRpgDataPayload } from "../factories/rpg-data-seed.factory";
import { RpgDataRevisionConflictError } from "../errors/rpg-data.errors";
import { RpgDataAggregate } from "./rpg-data.aggregate";

describe("RpgDataAggregate", () => {
  it("deve substituir dados e incrementar revision", () => {
    const aggregate = RpgDataAggregate.create({
      userId: "u-1",
      data: createSeedRpgDataPayload(),
      revision: 3,
      updatedAt: "2026-03-24T00:00:00.000Z",
    });

    const payload = createSeedRpgDataPayload();
    payload.notes.campaign = "Resumo novo";

    aggregate.replaceData({
      revision: 3,
      data: payload,
      nowIso: "2026-03-24T01:00:00.000Z",
    });

    const snapshot = aggregate.toSnapshot();
    expect(snapshot.revision).toBe(4);
    expect(snapshot.data.notes.campaign).toBe("Resumo novo");
    expect(snapshot.updatedAt).toBe("2026-03-24T01:00:00.000Z");
  });

  it("deve falhar quando revision nao confere", () => {
    const aggregate = RpgDataAggregate.create({
      userId: "u-1",
      data: createSeedRpgDataPayload(),
      revision: 2,
      updatedAt: "2026-03-24T00:00:00.000Z",
    });

    expect(() =>
      aggregate.replaceData({
        revision: 1,
        data: createSeedRpgDataPayload(),
      }),
    ).toThrow(RpgDataRevisionConflictError);
  });
});
