import { Injectable } from "@nestjs/common";
import { RpgDataAggregate } from "../../domain/aggregates/rpg-data.aggregate";
import type { RpgDataRepository } from "../../domain/repositories/rpg-data.repository";
import type { RpgDataSnapshot } from "../../domain/aggregates/rpg-data.aggregate";

@Injectable()
export class InMemoryRpgDataRepository implements RpgDataRepository {
  private readonly storage = new Map<string, RpgDataSnapshot>();

  async findByUserId(userId: string) {
    const snapshot = this.storage.get(userId);
    if (!snapshot) return null;
    return RpgDataAggregate.reconstitute(snapshot);
  }

  async save(rpgData: RpgDataAggregate) {
    const snapshot = rpgData.toSnapshot();
    this.storage.set(snapshot.userId, snapshot);
  }
}
