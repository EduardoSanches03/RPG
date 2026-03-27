import type { RpgDataSnapshot } from "../../domain/aggregates/rpg-data.aggregate";

export function toRpgDataViewModel(snapshot: RpgDataSnapshot) {
  return snapshot;
}
