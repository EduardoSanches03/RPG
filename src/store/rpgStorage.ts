import type { RpgDataV1 } from "../domain/rpg";

const STORAGE_KEY = "rpg-dashboard:data";

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createSeedData(): RpgDataV1 {
  const createdAtIso = nowIso();

  return {
    version: 1,
    campaign: {
      id: createId(),
      name: "Minha Campanha",
      system: "RPG",
      createdAtIso,
    },
    characters: [
      {
        id: createId(),
        name: "Artheon",
        system: "savage_pathfinder",
        playerName: "Jogador 1",
        createdAtIso,
        modules: [
          { id: createId(), type: "combat_stats", system: "savage_pathfinder" },
          { id: createId(), type: "attributes", system: "savage_pathfinder" },
        ],
      },
      {
        id: createId(),
        name: "Lys",
        system: "savage_pathfinder",
        playerName: "Jogador 2",
        createdAtIso,
        modules: [
          { id: createId(), type: "combat_stats", system: "savage_pathfinder" },
          { id: createId(), type: "attributes", system: "savage_pathfinder" },
        ],
      },
    ],
    sessions: [
      {
        id: createId(),
        title: "Sessão 1",
        scheduledAtIso: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        createdAtIso,
      },
    ],
    notes: {
      campaign: "Resumo da campanha, ganchos, NPCs importantes...",
    },
  };
}

export function normalizeRpgDataV1(input: unknown): RpgDataV1 {
  const seed = createSeedData();
  const obj = (
    typeof input === "object" && input !== null ? input : {}
  ) as Record<string, unknown>;

  const campaign = (
    typeof obj.campaign === "object" && obj.campaign !== null
      ? obj.campaign
      : {}
  ) as Record<string, unknown>;

  const charactersRaw = Array.isArray(obj.characters)
    ? (obj.characters as unknown[])
    : [];
  const sessionsRaw = Array.isArray(obj.sessions)
    ? (obj.sessions as unknown[])
    : [];
  const notesRaw = (
    typeof obj.notes === "object" && obj.notes !== null ? obj.notes : {}
  ) as Record<string, unknown>;

  return {
    version: 1,
    campaign: {
      ...seed.campaign,
      ...campaign,
      id: typeof campaign.id === "string" ? campaign.id : seed.campaign.id,
      name:
        typeof campaign.name === "string" ? campaign.name : seed.campaign.name,
      system:
        typeof campaign.system === "string"
          ? campaign.system
          : seed.campaign.system,
      createdAtIso:
        typeof campaign.createdAtIso === "string"
          ? campaign.createdAtIso
          : seed.campaign.createdAtIso,
    },
    characters: charactersRaw
      .filter((c) => typeof c === "object" && c !== null)
      .map((c) => {
        const cc = c as Record<string, unknown>;
        const modules = Array.isArray(cc.modules) ? (cc.modules as any[]) : [];
        return {
          ...(cc as any),
          modules,
        } as any;
      }),
    sessions: sessionsRaw.filter(
      (s) => typeof s === "object" && s !== null,
    ) as any,
    notes: {
      campaign:
        typeof notesRaw.campaign === "string"
          ? (notesRaw.campaign as string)
          : seed.notes.campaign,
    },
  };
}

export function loadRpgData(): RpgDataV1 {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeedData();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "version" in parsed &&
      (parsed as { version?: unknown }).version === 1
    ) {
      return normalizeRpgDataV1(parsed);
    }
    return createSeedData();
  } catch {
    return createSeedData();
  }
}

export function saveRpgData(next: RpgDataV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function newId() {
  return createId();
}

export function newIsoNow() {
  return nowIso();
}
