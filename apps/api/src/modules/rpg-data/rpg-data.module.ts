import { Module } from "@nestjs/common";
import { RpgDataController } from "./presentation/controllers/rpg-data.controller";
import { GetRpgDataUseCase } from "./application/use-cases/get-rpg-data.use-case";
import { PutRpgDataUseCase } from "./application/use-cases/put-rpg-data.use-case";
import { RPG_DATA_REPOSITORY } from "./application/ports/rpg-data-repository.token";
import { InMemoryRpgDataRepository } from "./infrastructure/repositories/in-memory-rpg-data.repository";

@Module({
  controllers: [RpgDataController],
  providers: [
    {
      provide: RPG_DATA_REPOSITORY,
      useClass: InMemoryRpgDataRepository,
    },
    GetRpgDataUseCase,
    PutRpgDataUseCase,
  ],
})
export class RpgDataModule {}
