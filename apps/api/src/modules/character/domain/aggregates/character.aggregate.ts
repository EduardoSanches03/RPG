import { CombatStatePolicy } from "../domain-services/combat-state-policy.service";
import { RevisionConflictError } from "../errors/character.errors";
import { CharacterCombatStatePatchedEvent } from "../events/character-combat-state-patched.event";
import {
  CombatState,
  type CombatStatePrimitives,
} from "../value-objects/combat-state.vo";
import { Revision } from "../value-objects/revision.vo";
import {
  CharacterProfile,
  type CharacterProfileSnapshot,
} from "../entities/character-profile.entity";

export type CharacterSnapshot = {
  id: string;
  campaignId: string;
  name: string;
  system: string;
  combatState: CombatStatePrimitives;
  revision: number;
  updatedAt: string;
};

export class CharacterAggregate {
  private readonly pendingEvents: CharacterCombatStatePatchedEvent[] = [];

  private constructor(
    private profile: CharacterProfile,
    private combatState: CombatState,
    private revision: Revision,
    private updatedAt: string,
  ) {}

  static create(snapshot: CharacterSnapshot) {
    const profile = CharacterProfile.create({
      id: snapshot.id,
      campaignId: snapshot.campaignId,
      name: snapshot.name,
      system: snapshot.system,
    });
    const combatState = CombatState.create(snapshot.combatState);
    CombatStatePolicy.validate(profile.getSystem(), combatState);
    const revision = Revision.create(snapshot.revision);
    return new CharacterAggregate(profile, combatState, revision, snapshot.updatedAt);
  }

  static reconstitute(snapshot: CharacterSnapshot) {
    return CharacterAggregate.create(snapshot);
  }

  patchCombatState(input: {
    revision: number;
    combatState: CombatStatePrimitives;
    nowIso?: string;
  }) {
    const requestedRevision = Revision.create(input.revision);
    if (!requestedRevision.equals(this.revision)) {
      throw new RevisionConflictError(this.revision.toNumber());
    }

    const nextCombatState = CombatState.create(input.combatState);
    CombatStatePolicy.validate(this.profile.getSystem(), nextCombatState);

    this.combatState = nextCombatState;
    this.revision = this.revision.next();
    this.updatedAt = input.nowIso ?? new Date().toISOString();

    this.pendingEvents.push(
      new CharacterCombatStatePatchedEvent(
        this.profile.getId().toString(),
        this.combatState.toPrimitives(),
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

  toSnapshot(): CharacterSnapshot {
    const profile = this.profile.toSnapshot();
    return {
      id: profile.id,
      campaignId: profile.campaignId,
      name: profile.name,
      system: profile.system,
      combatState: this.combatState.toPrimitives(),
      revision: this.revision.toNumber(),
      updatedAt: this.updatedAt,
    };
  }
}
