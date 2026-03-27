import { InvariantViolationError } from "../errors/character.errors";
import type { CombatState } from "../value-objects/combat-state.vo";

export class CombatStatePolicy {
  static validate(system: string, combatState: CombatState) {
    if (system.trim().toLowerCase() !== "savage_pathfinder") return;
    const state = combatState.toPrimitives();

    if (state.wounds > 3) {
      throw new InvariantViolationError("wounds must be in range 0..3");
    }
    if (state.fatigue > 2) {
      throw new InvariantViolationError("fatigue must be in range 0..2");
    }
  }
}
