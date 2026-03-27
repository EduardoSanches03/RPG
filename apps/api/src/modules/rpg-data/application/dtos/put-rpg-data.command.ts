import type { RpgDataPayloadV1 } from "../../domain/value-objects/rpg-data-payload.vo";

export type PutRpgDataCommand = {
  userId: string;
  revision: number;
  data: RpgDataPayloadV1;
};
