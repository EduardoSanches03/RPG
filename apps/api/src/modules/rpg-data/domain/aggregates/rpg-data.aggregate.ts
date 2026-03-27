import { RpgDataRevisionConflictError } from "../errors/rpg-data.errors";
import { RpgDataReplacedEvent } from "../events/rpg-data-replaced.event";
import { RpgDataPayload, type RpgDataPayloadV1 } from "../value-objects/rpg-data-payload.vo";
import { Revision } from "../value-objects/revision.vo";
import { UserId } from "../value-objects/user-id.vo";

export type RpgDataSnapshot = {
  userId: string;
  data: RpgDataPayloadV1;
  revision: number;
  updatedAt: string;
};

export class RpgDataAggregate {
  private readonly pendingEvents: RpgDataReplacedEvent[] = [];

  private constructor(
    private readonly userId: UserId,
    private payload: RpgDataPayload,
    private revision: Revision,
    private updatedAt: string,
  ) {}

  static create(snapshot: RpgDataSnapshot) {
    return new RpgDataAggregate(
      UserId.create(snapshot.userId),
      RpgDataPayload.create(snapshot.data),
      Revision.create(snapshot.revision),
      snapshot.updatedAt,
    );
  }

  static reconstitute(snapshot: RpgDataSnapshot) {
    return RpgDataAggregate.create(snapshot);
  }

  replaceData(input: { revision: number; data: RpgDataPayloadV1; nowIso?: string }) {
    const requestedRevision = Revision.create(input.revision);
    if (!requestedRevision.equals(this.revision)) {
      throw new RpgDataRevisionConflictError(this.revision.toNumber());
    }

    this.payload = RpgDataPayload.create(input.data);
    this.revision = this.revision.next();
    this.updatedAt = input.nowIso ?? new Date().toISOString();

    this.pendingEvents.push(
      new RpgDataReplacedEvent(
        this.userId.toString(),
        this.payload.toPrimitives(),
        this.revision.toNumber(),
        this.updatedAt,
      ),
    );
  }

  pullDomainEvents() {
    const events = [...this.pendingEvents];
    this.pendingEvents.length = 0;
    return events;
  }

  toSnapshot(): RpgDataSnapshot {
    return {
      userId: this.userId.toString(),
      data: this.payload.toPrimitives(),
      revision: this.revision.toNumber(),
      updatedAt: this.updatedAt,
    };
  }
}
