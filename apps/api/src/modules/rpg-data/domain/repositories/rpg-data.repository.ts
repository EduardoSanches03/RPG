import type { RpgDataAggregate } from "../aggregates/rpg-data.aggregate";

export interface RpgDataRepository {
  findByUserId(userId: string): Promise<RpgDataAggregate | null>;
  save(rpgData: RpgDataAggregate): Promise<void>;
}
