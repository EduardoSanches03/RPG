import type { Character } from "../domain/rpg";

export type CharacterCombatStateV1 = {
  wounds: number;
  fatigue: number;
  isIncapacitated: boolean;
  powerPointsCurrent: number;
  powerPointsMax: number;
};

export type CharacterResponseV1 = {
  id: string;
  campaignId: string;
  name: string;
  system: string;
  combatState: CharacterCombatStateV1;
  revision: number;
  updatedAt: string;
};

export type PatchCombatStateRequestV1 = CharacterCombatStateV1 & {
  revision: number;
};

export type PatchCombatStateResponseV1 = {
  id: string;
  combatState: CharacterCombatStateV1;
  revision: number;
  updatedAt: string;
};

export type CharacterApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

export class CharacterApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(input: {
    message: string;
    status: number;
    code?: string;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "CharacterApiError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }
}

export function isRevisionConflictError(error: unknown) {
  if (!(error instanceof CharacterApiError)) return false;
  return error.status === 409 || error.code === "REVISION_CONFLICT";
}

export type CharacterApiV1Client = {
  getCharacter: (characterId: string) => Promise<CharacterResponseV1>;
  patchCombatState: (
    characterId: string,
    input: PatchCombatStateRequestV1,
  ) => Promise<PatchCombatStateResponseV1>;
};

function asRecord(value: unknown, message: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} invalido`);
  }
  return value;
}

function asInteger(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} invalido`);
  }
  return value;
}

function assertIsoDate(value: unknown, field: string) {
  const raw = asString(value, field);
  if (Number.isNaN(Date.parse(raw))) {
    throw new Error(`${field} invalido`);
  }
  return raw;
}

function clampMinZero(value: number) {
  return Math.max(0, value);
}

function readPowerPoints(character: Pick<Character, "modules">) {
  const module = character.modules.find((item) => item.type === "power_points");
  const rawCurrent = typeof module?.data?.current === "number" ? module.data.current : 0;
  const rawMax = typeof module?.data?.max === "number" ? module.data.max : 0;
  const max = clampMinZero(rawMax);
  const current = Math.min(clampMinZero(rawCurrent), max);
  return { current, max };
}

export function extractCombatStateFromCharacter(
  character: Pick<Character, "stats" | "modules">,
): CharacterCombatStateV1 {
  const wounds = clampMinZero(character.stats?.wounds ?? 0);
  const fatigue = clampMinZero(character.stats?.fatigue ?? 0);
  const isIncapacitated = Boolean(character.stats?.isIncapacitated ?? false);
  const pp = readPowerPoints(character);

  return {
    wounds,
    fatigue,
    isIncapacitated,
    powerPointsCurrent: pp.current,
    powerPointsMax: pp.max,
  };
}

function validateCombatStateV1(value: unknown) {
  const record = asRecord(value, "combatState invalido");
  const wounds = asInteger(record.wounds, "combatState.wounds");
  const fatigue = asInteger(record.fatigue, "combatState.fatigue");
  const isIncapacitated = Boolean(record.isIncapacitated);
  const powerPointsCurrent = asInteger(
    record.powerPointsCurrent,
    "combatState.powerPointsCurrent",
  );
  const powerPointsMax = asInteger(record.powerPointsMax, "combatState.powerPointsMax");

  if (powerPointsCurrent > powerPointsMax) {
    throw new Error("combatState.powerPointsCurrent acima do maximo");
  }

  return {
    wounds,
    fatigue,
    isIncapacitated,
    powerPointsCurrent,
    powerPointsMax,
  } satisfies CharacterCombatStateV1;
}

function assertSavagePathfinderInvariants(
  system: string,
  combatState: CharacterCombatStateV1,
) {
  if (system.trim().toLowerCase() !== "savage_pathfinder") return;
  if (combatState.wounds > 3) throw new Error("wounds fora do limite de savage pathfinder");
  if (combatState.fatigue > 2) throw new Error("fatigue fora do limite de savage pathfinder");
}

export function parseCharacterResponseV1(payload: unknown): CharacterResponseV1 {
  const record = asRecord(payload, "payload de character v1 invalido");
  const system = asString(record.system, "system");
  const combatState = validateCombatStateV1(record.combatState);
  assertSavagePathfinderInvariants(system, combatState);

  return {
    id: asString(record.id, "id"),
    campaignId: asString(record.campaignId, "campaignId"),
    name: asString(record.name, "name"),
    system,
    combatState,
    revision: asInteger(record.revision, "revision"),
    updatedAt: assertIsoDate(record.updatedAt, "updatedAt"),
  };
}

export function parsePatchCombatStateResponseV1(
  payload: unknown,
): PatchCombatStateResponseV1 {
  const record = asRecord(payload, "payload de patch combatState v1 invalido");
  return {
    id: asString(record.id, "id"),
    combatState: validateCombatStateV1(record.combatState),
    revision: asInteger(record.revision, "revision"),
    updatedAt: assertIsoDate(record.updatedAt, "updatedAt"),
  };
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function parseErrorResponse(response: Response) {
  let payload: CharacterApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as CharacterApiErrorPayload;
  } catch {
    payload = null;
  }

  const code = payload?.error?.code;
  const details =
    payload?.error?.details && typeof payload.error.details === "object"
      ? payload.error.details
      : undefined;
  const message =
    payload?.error?.message ||
    `Erro na API de personagem (${response.status})`;

  throw new CharacterApiError({
    message,
    status: response.status,
    code,
    details,
  });
}

export function createCharacterApiV1Client(input?: {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  getAccessToken?: () => Promise<string | null> | string | null;
}): CharacterApiV1Client {
  const baseUrl = normalizeBaseUrl(input?.baseUrl ?? "/api/v1");
  const fetchFn = input?.fetchFn ?? fetch;
  const getAccessToken = input?.getAccessToken;

  async function requestJson(path: string, init?: RequestInit) {
    const token = getAccessToken ? await getAccessToken() : null;
    const response = await fetchFn(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      await parseErrorResponse(response);
    }

    return response.json();
  }

  return {
    async getCharacter(characterId) {
      const payload = await requestJson(`/characters/${characterId}`, {
        method: "GET",
      });
      return parseCharacterResponseV1(payload);
    },
    async patchCombatState(characterId, request) {
      const payload = await requestJson(
        `/characters/${characterId}/combat-state`,
        {
          method: "PATCH",
          body: JSON.stringify(request),
        },
      );
      return parsePatchCombatStateResponseV1(payload);
    },
  };
}
