import { RpgDataInvariantViolationError } from "../errors/rpg-data.errors";

export class Revision {
  private constructor(private readonly value: number) {}

  static create(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new RpgDataInvariantViolationError(
        "revision deve ser um inteiro nao negativo",
      );
    }
    return new Revision(value);
  }

  equals(other: Revision) {
    return this.value === other.value;
  }

  next() {
    return new Revision(this.value + 1);
  }

  toNumber() {
    return this.value;
  }
}
