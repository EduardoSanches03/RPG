import { RpgDataInvariantViolationError } from "../errors/rpg-data.errors";

export class UserId {
  private constructor(private readonly value: string) {}

  static create(raw: string) {
    const value = raw.trim();
    if (!value.length) {
      throw new RpgDataInvariantViolationError("userId nao pode ser vazio");
    }
    return new UserId(value);
  }

  toString() {
    return this.value;
  }
}
