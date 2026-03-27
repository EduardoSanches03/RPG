import { InvariantViolationError } from "../errors/character.errors";

export class CharacterId {
  private constructor(private readonly value: string) {}

  static create(raw: string) {
    const value = raw.trim();
    if (!value) {
      throw new InvariantViolationError("characterId must not be empty");
    }
    return new CharacterId(value);
  }

  toString() {
    return this.value;
  }
}
