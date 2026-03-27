import { Inject, Injectable } from "@nestjs/common";
import { RpgDataAggregate } from "../../domain/aggregates/rpg-data.aggregate";
import { createSeedRpgDataSnapshot } from "../../domain/factories/rpg-data-seed.factory";
import { RPG_DATA_REPOSITORY } from "../ports/rpg-data-repository.token";
import type { PutRpgDataCommand } from "../dtos/put-rpg-data.command";
import type { RpgDataRepository } from "../../domain/repositories/rpg-data.repository";

@Injectable()
export class PutRpgDataUseCase {
  constructor(
    @Inject(RPG_DATA_REPOSITORY)
    private readonly repository: RpgDataRepository,
  ) {}

  async execute(command: PutRpgDataCommand) {
    const existing = await this.repository.findByUserId(command.userId);
    const aggregate =
      existing ?? RpgDataAggregate.create(createSeedRpgDataSnapshot(command.userId));

    aggregate.replaceData({
      revision: command.revision,
      data: command.data,
    });
    await this.repository.save(aggregate);

    return aggregate.toSnapshot();
  }
}
