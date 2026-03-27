import type { CombatStatePrimitives } from "../value-objects/combat-state.vo";

export class CharacterCombatStatePatchedEvent {
  readonly eventName = "character.combat-state.patched";

  constructor(
    public readonly characterId: string,
    public readonly combatState: CombatStatePrimitives,
    public readonly revision: number,
    public readonly occurredAt: string,
  ) {}
}
