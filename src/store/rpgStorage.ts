import type { RpgDataV1 } from "../domain/rpg";

const STORAGE_KEY = "rpg-dashboard:data";
const STORAGE_KEY_PREFIX = "rpg-dashboard:data:";
const SQLITE_DB_STORAGE_KEY = "rpg-dashboard:sqlite-db";
const LEGACY_SOCIAL_FRIEND_NAMES = [
  "slayerofegirl",
  "danielz",
  "afro samurai",
  "stevenstone",
];
const LEGACY_SOCIAL_GROUP_NAMES = [
  "a taverna - mesa principal",
  "guilda dos arcanos",
];
const LEGACY_SOCIAL_DIRECTORY_HANDLES = [
  "@mestrearcano",
  "@kaelen",
  "@elara",
];

function nowIso() {
  return new Date().toISOString();
}

function normalizeStorageOwnerId(userIdInput?: string) {
  const userId = userIdInput?.trim();
  return userId && userId.length > 0 ? userId : "local-user";
}

function getStorageKey(userIdInput?: string) {
  return `${STORAGE_KEY_PREFIX}${normalizeStorageOwnerId(userIdInput)}`;
}

function isQuotaExceededError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String((error as { name?: unknown }).name ?? "") : "";
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}

function cleanupStorageForRetry(activeStorageKey: string) {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  try {
    localStorage.removeItem(SQLITE_DB_STORAGE_KEY);
  } catch {}

  try {
    const staleKeys = Array.from({ length: localStorage.length })
      .map((_, index) => localStorage.key(index))
      .filter(
        (key): key is string =>
          Boolean(key) &&
          key.startsWith(STORAGE_KEY_PREFIX) &&
          key !== activeStorageKey,
      );

    staleKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
  } catch {}
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLegacyText(value: string) {
  return value.trim().toLowerCase();
}

function hasEveryLegacyEntry(values: string[], legacyEntries: string[]) {
  const normalizedSet = new Set(values.map((value) => normalizeLegacyText(value)));
  return legacyEntries.every((entry) => normalizedSet.has(normalizeLegacyText(entry)));
}

function shouldCleanLegacySocial(input: {
  friends: Array<{ name: string }>;
  groups: Array<{ name: string }>;
  directory: Array<{ handle: string }>;
}) {
  if (input.friends.length !== LEGACY_SOCIAL_FRIEND_NAMES.length) return false;
  if (input.groups.length !== LEGACY_SOCIAL_GROUP_NAMES.length) return false;
  if (input.directory.length !== LEGACY_SOCIAL_DIRECTORY_HANDLES.length) return false;

  return (
    hasEveryLegacyEntry(
      input.friends.map((friend) => friend.name),
      LEGACY_SOCIAL_FRIEND_NAMES,
    ) &&
    hasEveryLegacyEntry(
      input.groups.map((group) => group.name),
      LEGACY_SOCIAL_GROUP_NAMES,
    ) &&
    hasEveryLegacyEntry(
      input.directory.map((directory) => directory.handle),
      LEGACY_SOCIAL_DIRECTORY_HANDLES,
    )
  );
}

export function createSeedData(): RpgDataV1 {
  const createdAtIso = nowIso();

  return {
    version: 1,
    campaign: {
      id: createId(),
      name: "A Taverna",
      system: "savage_pathfinder",
      createdAtIso,
      role: "mestre",
      locale: "pt-BR",
      timeZone: "America/Sao_Paulo",
      isRegistered: false,
      partyMemberIds: [],
    },
    characters: [],
    sessions: [],
    notes: {
      campaign: "",
    },
    social: {
      friends: [],
      groups: [],
      directory: [],
      requestsSent: [],
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
  const socialRaw = (
    typeof obj.social === "object" && obj.social !== null ? obj.social : {}
  ) as Record<string, unknown>;
  const friendsRaw = Array.isArray(socialRaw.friends)
    ? (socialRaw.friends as unknown[])
    : [];
  const groupsRaw = Array.isArray(socialRaw.groups)
    ? (socialRaw.groups as unknown[])
    : [];
  const directoryRaw = Array.isArray(socialRaw.directory)
    ? (socialRaw.directory as unknown[])
    : [];
  const requestsSentRaw = Array.isArray(socialRaw.requestsSent)
    ? (socialRaw.requestsSent as unknown[])
    : [];

  const normalizeCharacter = (input: unknown) => {
    if (typeof input !== "object" || input === null) return null;
    const cc = input as Record<string, unknown>;
    const modules = Array.isArray(cc.modules) ? (cc.modules as unknown[]) : [];

    const normalized = {
      ...(cc as any),
      modules: modules.filter((entry) => typeof entry === "object" && entry !== null),
      ancestry: typeof cc.ancestry === "string" ? cc.ancestry : undefined,
      height: typeof cc.height === "string" ? cc.height : undefined,
      weight: typeof cc.weight === "string" ? cc.weight : undefined,
      edges:
        typeof cc.edges === "number" && Number.isFinite(cc.edges)
          ? Math.max(0, Math.floor(cc.edges))
          : typeof cc.edges === "string" &&
              cc.edges.trim().length > 0 &&
              Number.isFinite(Number(cc.edges))
            ? Math.max(0, Math.floor(Number(cc.edges)))
            : undefined,
      conviction:
        typeof cc.conviction === "number" && Number.isFinite(cc.conviction)
          ? cc.conviction
          : undefined,
    } as any;

    return normalized;
  };

  const normalizedSocial = {
    friends:
      friendsRaw.length > 0
        ? friendsRaw
            .filter((friend) => typeof friend === "object" && friend !== null)
            .map((friend) => {
              const source = friend as Record<string, unknown>;
              const status = source.status;
              const normalizedStatus =
                status === "online" || status === "in_party" || status === "offline"
                  ? status
                  : "offline";
              return {
                id: typeof source.id === "string" ? source.id : createId(),
                name:
                  typeof source.name === "string" && source.name.trim().length > 0
                    ? source.name
                    : "Sem nome",
                status: normalizedStatus,
                activity: typeof source.activity === "string" ? source.activity : undefined,
                avatarUrl: typeof source.avatarUrl === "string" ? source.avatarUrl : undefined,
              };
            })
        : seed.social?.friends ?? [],
    groups:
      groupsRaw.length > 0
        ? groupsRaw
            .filter((group) => typeof group === "object" && group !== null)
            .map((group) => {
              const source = group as Record<string, unknown>;
              const role =
                source.role === "owner" || source.role === "member"
                  ? source.role
                  : "member";
              const membersCount =
                typeof source.membersCount === "number" && Number.isFinite(source.membersCount)
                  ? Math.max(0, Math.floor(source.membersCount))
                  : 0;
              const onlineCount =
                typeof source.onlineCount === "number" && Number.isFinite(source.onlineCount)
                  ? Math.max(0, Math.floor(source.onlineCount))
                  : 0;
              return {
                id: typeof source.id === "string" ? source.id : createId(),
                name:
                  typeof source.name === "string" && source.name.trim().length > 0
                    ? source.name
                    : "Grupo sem nome",
                role,
                membersCount,
                onlineCount,
                system: typeof source.system === "string" ? source.system : undefined,
              };
            })
        : seed.social?.groups ?? [],
    directory:
      directoryRaw.length > 0
        ? directoryRaw
            .filter((entry) => typeof entry === "object" && entry !== null)
            .map((entry) => {
              const source = entry as Record<string, unknown>;
              const status = source.status;
              const normalizedStatus =
                status === "online" || status === "in_party" || status === "offline"
                  ? status
                  : undefined;
              return {
                id: typeof source.id === "string" ? source.id : createId(),
                name:
                  typeof source.name === "string" && source.name.trim().length > 0
                    ? source.name
                    : "Aventureiro",
                handle:
                  typeof source.handle === "string" && source.handle.trim().length > 0
                    ? source.handle
                    : "@aventureiro",
                status: normalizedStatus,
                bio: typeof source.bio === "string" ? source.bio : undefined,
                avatarUrl: typeof source.avatarUrl === "string" ? source.avatarUrl : undefined,
              };
            })
        : seed.social?.directory ?? [],
    requestsSent:
      requestsSentRaw.length > 0
        ? requestsSentRaw
            .filter((entry) => typeof entry === "object" && entry !== null)
            .map((entry) => {
              const source = entry as Record<string, unknown>;
              return {
                id: typeof source.id === "string" ? source.id : createId(),
                name:
                  typeof source.name === "string" && source.name.trim().length > 0
                    ? source.name
                    : "Aventureiro",
                handle: typeof source.handle === "string" ? source.handle : undefined,
                avatarUrl: typeof source.avatarUrl === "string" ? source.avatarUrl : undefined,
                sentAtIso:
                  typeof source.sentAtIso === "string"
                    ? source.sentAtIso
                    : nowIso(),
                status: "pending" as const,
              };
            })
        : seed.social?.requestsSent ?? [],
  };

  const social = shouldCleanLegacySocial({
    friends: normalizedSocial.friends,
    groups: normalizedSocial.groups,
    directory: normalizedSocial.directory ?? [],
  })
    ? {
        ...normalizedSocial,
        friends: [],
        groups: [],
        directory: [],
      }
    : normalizedSocial;

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
      role:
        campaign.role === "mestre" || campaign.role === "jogador"
          ? campaign.role
          : seed.campaign.role,
      locale:
        typeof campaign.locale === "string" && campaign.locale.trim().length > 0
          ? campaign.locale
          : seed.campaign.locale,
      timeZone:
        typeof campaign.timeZone === "string" && campaign.timeZone.trim().length > 0
          ? campaign.timeZone
          : seed.campaign.timeZone,
      isRegistered:
        typeof campaign.isRegistered === "boolean"
          ? campaign.isRegistered
          : seed.campaign.isRegistered,
      partyMemberIds: Array.isArray(campaign.partyMemberIds)
        ? (campaign.partyMemberIds as unknown[]).filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0,
          )
        : seed.campaign.partyMemberIds,
    },
    characters: charactersRaw
      .map((character) => normalizeCharacter(character))
      .filter((character): character is any => Boolean(character)),
    sessions: sessionsRaw.filter(
      (s) => typeof s === "object" && s !== null,
    ) as any,
    notes: {
      campaign:
        typeof notesRaw.campaign === "string"
          ? (notesRaw.campaign as string)
          : seed.notes.campaign,
    },
    social,
  };
}

export function loadRpgData(userIdInput?: string): RpgDataV1 {
  const storageKey = getStorageKey(userIdInput);
  const raw =
    localStorage.getItem(storageKey) ??
    (normalizeStorageOwnerId(userIdInput) === "local-user"
      ? localStorage.getItem(STORAGE_KEY)
      : null);
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

export function saveRpgData(next: RpgDataV1, userIdInput?: string) {
  const storageKey = getStorageKey(userIdInput);
  const payload = JSON.stringify(next);

  try {
    localStorage.setItem(storageKey, payload);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  cleanupStorageForRetry(storageKey);

  try {
    localStorage.setItem(storageKey, payload);
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }

    console.warn(
      "[rpgStorage] Limite do localStorage excedido. Persistencia local reduzida para evitar quebra da UI.",
    );
  }
}

export function newId() {
  return createId();
}

export function newIsoNow() {
  return nowIso();
}
