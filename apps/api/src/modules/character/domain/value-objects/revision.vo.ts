import { InvariantViolationError } from "../errors/character.errors";

export class Revision {
  private constructor(private readonly value: number) {}

  static create(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvariantViolationError("revision must be a non-negative integer");
    }
    return new Revision(value);
  }

  toNumber() {
    return this.value;
  }

  equals(other: Revision) {
    return this.value === other.value;
  }

  next() {
    return Revision.create(this.value + 1);
  }
}
