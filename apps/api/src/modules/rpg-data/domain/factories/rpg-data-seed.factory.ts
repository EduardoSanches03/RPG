import type { RpgDataSnapshot } from "../aggregates/rpg-data.aggregate";
import type { RpgDataPayloadV1 } from "../value-objects/rpg-data-payload.vo";

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSeedRpgDataPayload(): RpgDataPayloadV1 {
  const createdAtIso = nowIso();
  return {
    version: 1,
    campaign: {
      id: newId(),
      name: "A Taverna",
      system: "savage_pathfinder",
      createdAtIso,
    },
    characters: [],
    sessions: [],
    notes: {
      campaign: "",
    },
  };
}

export function createSeedRpgDataSnapshot(userId: string): RpgDataSnapshot {
  return {
    userId,
    data: createSeedRpgDataPayload(),
    revision: 0,
    updatedAt: nowIso(),
  };
}
