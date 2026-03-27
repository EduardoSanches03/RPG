import { Inject, Injectable } from "@nestjs/common";
import { RPG_DATA_REPOSITORY } from "../ports/rpg-data-repository.token";
import { RpgDataAggregate } from "../../domain/aggregates/rpg-data.aggregate";
import { createSeedRpgDataSnapshot } from "../../domain/factories/rpg-data-seed.factory";
import type { RpgDataRepository } from "../../domain/repositories/rpg-data.repository";

@Injectable()
export class GetRpgDataUseCase {
  constructor(
    @Inject(RPG_DATA_REPOSITORY)
    private readonly repository: RpgDataRepository,
  ) {}

  async execute(userId: string) {
    const existing = await this.repository.findByUserId(userId);
    if (existing) return existing.toSnapshot();

    const created = RpgDataAggregate.create(createSeedRpgDataSnapshot(userId));
    await this.repository.save(created);
    return created.toSnapshot();
  }
}
