export class RpgDataRevisionConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super(`Revision conflitante. Atual: ${currentRevision}`);
    this.name = "RpgDataRevisionConflictError";
  }
}

export class RpgDataInvariantViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpgDataInvariantViolationError";
  }
}
