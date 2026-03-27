export class CharacterNotFoundError extends Error {
  constructor(characterId: string) {
    super(`Character ${characterId} not found`);
    this.name = "CharacterNotFoundError";
  }
}

export class RevisionConflictError extends Error {
  currentRevision: number;

  constructor(currentRevision: number) {
    super("Character revision conflict");
    this.name = "RevisionConflictError";
    this.currentRevision = currentRevision;
  }
}

export class InvariantViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvariantViolationError";
  }
}
