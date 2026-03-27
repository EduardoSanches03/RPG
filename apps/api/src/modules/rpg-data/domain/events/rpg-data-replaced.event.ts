import type { RpgDataPayloadV1 } from "../value-objects/rpg-data-payload.vo";

export class RpgDataReplacedEvent {
  constructor(
    readonly userId: string,
    readonly data: RpgDataPayloadV1,
    readonly revision: number,
    readonly updatedAt: string,
  ) {}
}
