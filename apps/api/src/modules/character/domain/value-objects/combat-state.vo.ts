import { InvariantViolationError } from "../errors/character.errors";

export type CombatStatePrimitives = {
  wounds: number;
  fatigue: number;
  isIncapacitated: boolean;
  powerPointsCurrent: number;
  powerPointsMax: number;
};

function asNonNegativeInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvariantViolationError(`${field} must be a non-negative integer`);
  }
}

export class CombatState {
  private constructor(private readonly props: CombatStatePrimitives) {}

  static create(props: CombatStatePrimitives) {
    asNonNegativeInteger(props.wounds, "wounds");
    asNonNegativeInteger(props.fatigue, "fatigue");
    asNonNegativeInteger(props.powerPointsCurrent, "powerPointsCurrent");
    asNonNegativeInteger(props.powerPointsMax, "powerPointsMax");

    if (props.powerPointsCurrent > props.powerPointsMax) {
      throw new InvariantViolationError(
        "powerPointsCurrent must be less than or equal to powerPointsMax",
      );
    }

    return new CombatState({ ...props });
  }

  toPrimitives() {
    return { ...this.props };
  }
}
