import { CharacterId } from "../value-objects/character-id.vo";
import { InvariantViolationError } from "../errors/character.errors";

export type CharacterProfileSnapshot = {
  id: string;
  campaignId: string;
  name: string;
  system: string;
};

export class CharacterProfile {
  private constructor(
    private readonly id: CharacterId,
    private readonly campaignId: string,
    private readonly name: string,
    private readonly system: string,
  ) {}

  static create(input: CharacterProfileSnapshot) {
    const campaignId = input.campaignId.trim();
    const name = input.name.trim();
    const system = input.system.trim();

    if (!campaignId) {
      throw new InvariantViolationError("campaignId must not be empty");
    }
    if (!name) {
      throw new InvariantViolationError("name must not be empty");
    }
    if (!system) {
      throw new InvariantViolationError("system must not be empty");
    }

    return new CharacterProfile(
      CharacterId.create(input.id),
      campaignId,
      name,
      system,
    );
  }

  getId() {
    return this.id;
  }

  getSystem() {
    return this.system;
  }

  toSnapshot(): CharacterProfileSnapshot {
    return {
      id: this.id.toString(),
      campaignId: this.campaignId,
      name: this.name,
      system: this.system,
    };
  }
}
