import type { Campaign, Character, CharacterModule, RpgDataV1, Session } from "../domain/rpg";
import { isSavagePathfinder } from "../domain/savagePathfinder";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

type CampaignRow = {
  id?: unknown;
  owner_id?: unknown;
  name?: unknown;
  system?: unknown;
  role?: unknown;
  locale?: unknown;
  time_zone?: unknown;
  is_registered?: unknown;
  notes?: unknown;
  created_at?: unknown;
};

type CampaignMemberRow = {
  character_id?: unknown;
};

type SessionRow = {
  id?: unknown;
  title?: unknown;
  scheduled_at?: unknown;
  address?: unknown;
  notes?: unknown;
  created_at?: unknown;
  campaign_id?: unknown;
};

type CharacterRow = {
  id?: unknown;
  name?: unknown;
  system?: unknown;
  player_name?: unknown;
  avatar_url?: unknown;
  background?: unknown;
  created_at?: unknown;
  is_npc?: unknown;
};

type SavagePathfinderRow = {
  character_id?: unknown;
  class_name?: unknown;
  race?: unknown;
  ancestry?: unknown;
  height?: unknown;
  weight?: unknown;
  edges?: unknown;
  conviction?: unknown;
  rank?: unknown;
  stats?: unknown;
  attributes?: unknown;
  modules?: unknown;
};

type GenericCharacterRow = {
  character_id?: unknown;
  payload?: unknown;
};

export type CloudRpgDataSnapshot = {
  campaign?: Campaign;
  sessions: Session[];
  characters: Character[];
  notes: {
    campaign: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: unknown) {
  const normalized = asTrimmedString(value);
  return normalized.length > 0 ? normalized : undefined;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : undefined;
}

function asObjectRecord(value: unknown) {
  return isRecord(value) ? value : undefined;
}

function asModuleList(value: unknown): CharacterModule[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is CharacterModule => isRecord(entry)) as CharacterModule[];
}

function isUuid(value: string | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeCampaignRow(
  row: CampaignRow | null,
  partyMemberIds: string[],
): Campaign | undefined {
  if (!row) return undefined;

  const id = asTrimmedString(row.id);
  const name = asTrimmedString(row.name);
  const system = asTrimmedString(row.system);
  const createdAtIso = asTrimmedString(row.created_at);

  if (!id || !name || !system || !createdAtIso) return undefined;

  return {
    id,
    name,
    system,
    createdAtIso,
    role: row.role === "mestre" || row.role === "jogador" ? row.role : "mestre",
    locale: asOptionalString(row.locale) ?? "pt-BR",
    timeZone: asOptionalString(row.time_zone) ?? "America/Sao_Paulo",
    isRegistered: asBoolean(row.is_registered, false),
    partyMemberIds,
  };
}

function normalizeCharacterRow(
  row: CharacterRow,
  savageData?: SavagePathfinderRow,
  genericData?: GenericCharacterRow,
): Character | null {
  const id = asTrimmedString(row.id);
  const name = asTrimmedString(row.name);
  const system = asTrimmedString(row.system);
  const playerName = asOptionalString(row.player_name) ?? "";
  const createdAtIso = asTrimmedString(row.created_at);

  if (!id || !name || !system || !createdAtIso) return null;

  if (isSavagePathfinder(system)) {
    return {
      id,
      name,
      system,
      playerName,
      class: asOptionalString(savageData?.class_name),
      race: asOptionalString(savageData?.race),
      ancestry: asOptionalString(savageData?.ancestry),
      height: asOptionalString(savageData?.height),
      weight: asOptionalString(savageData?.weight),
      edges: asNonNegativeInteger(savageData?.edges),
      conviction: asNonNegativeInteger(savageData?.conviction),
      level: asOptionalString(savageData?.rank),
      stats: asObjectRecord(savageData?.stats) as Character["stats"],
      attributes: asObjectRecord(savageData?.attributes) as Character["attributes"],
      modules: asModuleList(savageData?.modules),
      createdAtIso,
      avatarUrl: asOptionalString(row.avatar_url),
      background: asOptionalString(row.background),
    };
  }

  const payload = asObjectRecord(genericData?.payload) ?? {};
  return {
    id,
    name,
    system,
    playerName,
    class: asOptionalString(payload.class_name),
    race: asOptionalString(payload.race),
    ancestry: asOptionalString(payload.ancestry),
    height: asOptionalString(payload.height),
    weight: asOptionalString(payload.weight),
    edges: asNonNegativeInteger(payload.edges),
    conviction: asNonNegativeInteger(payload.conviction),
    level:
      typeof payload.level === "number" || typeof payload.level === "string"
        ? payload.level
        : undefined,
    stats: asObjectRecord(payload.stats) as Character["stats"],
    attributes: asObjectRecord(payload.attributes) as Character["attributes"],
    modules: asModuleList(payload.modules),
    createdAtIso,
    avatarUrl: asOptionalString(row.avatar_url),
    background: asOptionalString(row.background),
  };
}

function normalizeSessionRow(row: SessionRow, campaignName?: string): Session | null {
  const id = asTrimmedString(row.id);
  const title = asTrimmedString(row.title);
  const scheduledAtIso = asTrimmedString(row.scheduled_at);
  const createdAtIso = asTrimmedString(row.created_at);

  if (!id || !title || !scheduledAtIso || !createdAtIso) return null;

  return {
    id,
    title,
    scheduledAtIso,
    createdAtIso,
    address: asOptionalString(row.address),
    notes: asOptionalString(row.notes),
    campaignName,
  };
}

async function loadCampaign(userId: string) {
  const { data, error } = await supabase!
    .from("campaigns")
    .select("id, owner_id, name, system, role, locale, time_zone, is_registered, notes, created_at")
    .eq("owner_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message || "Erro ao buscar campanha");
  return (data ?? null) as CampaignRow | null;
}

async function loadCampaignMemberIds(campaignId: string) {
  const { data, error } = await supabase!
    .from("campaign_members")
    .select("character_id")
    .eq("campaign_id", campaignId);

  if (error) throw new Error(error.message || "Erro ao buscar party da campanha");

  return (data ?? [])
    .map((row) => asTrimmedString((row as CampaignMemberRow).character_id))
    .filter((id) => id.length > 0);
}

async function loadCharacters(userId: string) {
  const { data, error } = await supabase!
    .from("characters")
    .select("id, name, system, player_name, avatar_url, background, created_at, is_npc")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "Erro ao buscar personagens");
  return (data ?? []) as CharacterRow[];
}

async function loadSavagePathfinderCharacters(characterIds: string[]) {
  if (!characterIds.length) return [] as SavagePathfinderRow[];

  const { data, error } = await supabase!
    .from("character_savage_pathfinder")
    .select(
      "character_id, class_name, race, ancestry, height, weight, edges, conviction, rank, stats, attributes, modules",
    )
    .in("character_id", characterIds);

  if (error) throw new Error(error.message || "Erro ao buscar dados de Savage Pathfinder");
  return (data ?? []) as SavagePathfinderRow[];
}

async function loadGenericCharacters(characterIds: string[]) {
  if (!characterIds.length) return [] as GenericCharacterRow[];

  const { data, error } = await supabase!
    .from("character_generic")
    .select("character_id, payload")
    .in("character_id", characterIds);

  if (error) throw new Error(error.message || "Erro ao buscar dados genericos de personagem");
  return (data ?? []) as GenericCharacterRow[];
}

async function loadSessions(userId: string) {
  const { data, error } = await supabase!
    .from("sessions")
    .select("id, title, scheduled_at, address, notes, created_at, campaign_id")
    .eq("owner_id", userId)
    .order("scheduled_at", { ascending: false });

  if (error) throw new Error(error.message || "Erro ao buscar sessoes");
  return (data ?? []) as SessionRow[];
}

export async function loadCloudRpgData(userIdInput: string): Promise<CloudRpgDataSnapshot | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const userId = userIdInput.trim();
  if (!userId) return null;

  const campaignRow = await loadCampaign(userId);
  const partyMemberIds =
    campaignRow?.id && typeof campaignRow.id === "string"
      ? await loadCampaignMemberIds(campaignRow.id)
      : [];
  const [characterRows, sessionRows] = await Promise.all([
    loadCharacters(userId),
    loadSessions(userId),
  ]);

  const savageCharacterIds = characterRows
    .filter((row) => isSavagePathfinder(asTrimmedString(row.system)))
    .map((row) => asTrimmedString(row.id))
    .filter((id) => id.length > 0);
  const genericCharacterIds = characterRows
    .filter((row) => !isSavagePathfinder(asTrimmedString(row.system)))
    .map((row) => asTrimmedString(row.id))
    .filter((id) => id.length > 0);

  const [savageRows, genericRows] = await Promise.all([
    loadSavagePathfinderCharacters(savageCharacterIds),
    loadGenericCharacters(genericCharacterIds),
  ]);

  const savageById = new Map(
    savageRows.map((row) => [asTrimmedString(row.character_id), row] as const),
  );
  const genericById = new Map(
    genericRows.map((row) => [asTrimmedString(row.character_id), row] as const),
  );

  const campaign = normalizeCampaignRow(campaignRow, partyMemberIds);
  const campaignName = campaign?.name;

  return {
    campaign,
    characters: characterRows
      .map((row) =>
        normalizeCharacterRow(
          row,
          savageById.get(asTrimmedString(row.id)),
          genericById.get(asTrimmedString(row.id)),
        ),
      )
      .filter((character): character is Character => Boolean(character)),
    sessions: sessionRows
      .map((row) => normalizeSessionRow(row, campaignName))
      .filter((session): session is Session => Boolean(session)),
    notes: {
      campaign: asOptionalString(campaignRow?.notes) ?? "",
    },
  };
}

async function upsertCampaign(userId: string, data: RpgDataV1) {
  const existing = await loadCampaign(userId);
  const payload = {
    owner_id: userId,
    name: data.campaign.name.trim() || "A Taverna",
    system: data.campaign.system.trim() || "savage_pathfinder",
    role: data.campaign.role ?? "mestre",
    locale: data.campaign.locale?.trim() || "pt-BR",
    time_zone: data.campaign.timeZone?.trim() || "America/Sao_Paulo",
    is_registered: Boolean(data.campaign.isRegistered),
    notes: data.notes.campaign ?? "",
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id && typeof existing.id === "string") {
    const { error } = await supabase!
      .from("campaigns")
      .update(payload)
      .eq("id", existing.id)
      .eq("owner_id", userId);

    if (error) throw new Error(error.message || "Erro ao salvar campanha");
    return existing.id;
  }

  const insertPayload = {
    ...payload,
    ...(isUuid(data.campaign.id) ? { id: data.campaign.id } : {}),
  };

  const { data: inserted, error } = await supabase!
    .from("campaigns")
    .insert(insertPayload)
    .select("id")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message || "Erro ao criar campanha");

  const campaignId = asTrimmedString(inserted?.id);
  if (!campaignId) throw new Error("Campanha criada sem identificador");
  return campaignId;
}

async function syncCharacters(userId: string, characters: Character[]) {
  const { data: existingRows, error: existingError } = await supabase!
    .from("characters")
    .select("id")
    .eq("owner_id", userId);

  if (existingError) throw new Error(existingError.message || "Erro ao listar personagens");

  const nextIds = new Set(characters.map((character) => character.id).filter(Boolean));
  const existingIds = (existingRows ?? [])
    .map((row) => asTrimmedString((row as CharacterRow).id))
    .filter((id) => id.length > 0);
  const idsToDelete = existingIds.filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error } = await supabase!
      .from("characters")
      .delete()
      .eq("owner_id", userId)
      .in("id", idsToDelete);

    if (error) throw new Error(error.message || "Erro ao remover personagens");
  }

  if (!characters.length) return;

  const baseRows = characters.map((character) => ({
    id: character.id,
    owner_id: userId,
    name: character.name.trim(),
    system: character.system.trim(),
    player_name: character.playerName.trim(),
    avatar_url: character.avatarUrl ?? null,
    background: character.background ?? null,
    is_npc: false,
    created_at: character.createdAtIso,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertBaseError } = await supabase!
    .from("characters")
    .upsert(baseRows, { onConflict: "id" });

  if (upsertBaseError) {
    throw new Error(upsertBaseError.message || "Erro ao salvar personagens");
  }

  const savageRows = characters
    .filter((character) => isSavagePathfinder(character.system))
    .map((character) => ({
      character_id: character.id,
      class_name: character.class ?? null,
      race: character.race ?? null,
      ancestry: character.ancestry ?? null,
      height: character.height ?? null,
      weight: character.weight ?? null,
      edges: character.edges ?? null,
      conviction: character.conviction ?? null,
      rank: character.level ?? null,
      stats: character.stats ?? {},
      attributes: character.attributes ?? {},
      modules: character.modules ?? [],
      updated_at: new Date().toISOString(),
    }));

  if (savageRows.length > 0) {
    const { error } = await supabase!
      .from("character_savage_pathfinder")
      .upsert(savageRows, { onConflict: "character_id" });

    if (error) throw new Error(error.message || "Erro ao salvar dados de Savage Pathfinder");
  }

  const genericRows = characters
    .filter((character) => !isSavagePathfinder(character.system))
    .map((character) => ({
      character_id: character.id,
      payload: {
        class_name: character.class ?? null,
        race: character.race ?? null,
        ancestry: character.ancestry ?? null,
        height: character.height ?? null,
        weight: character.weight ?? null,
        edges: character.edges ?? null,
        conviction: character.conviction ?? null,
        level: character.level ?? null,
        stats: character.stats ?? {},
        attributes: character.attributes ?? {},
        modules: character.modules ?? [],
      },
      updated_at: new Date().toISOString(),
    }));

  if (genericRows.length > 0) {
    const { error } = await supabase!
      .from("character_generic")
      .upsert(genericRows, { onConflict: "character_id" });

    if (error) throw new Error(error.message || "Erro ao salvar dados genericos de personagem");
  }

  const genericIds = genericRows.map((row) => row.character_id);
  if (genericIds.length > 0) {
    await supabase!.from("character_savage_pathfinder").delete().in("character_id", genericIds);
  }

  const savageIds = savageRows.map((row) => row.character_id);
  if (savageIds.length > 0) {
    await supabase!.from("character_generic").delete().in("character_id", savageIds);
  }
}

async function syncCampaignMembers(campaignId: string, characterIds: string[]) {
  const normalizedIds = Array.from(
    new Set(characterIds.map((id) => id.trim()).filter((id) => id.length > 0)),
  );

  const { error: deleteError } = await supabase!
    .from("campaign_members")
    .delete()
    .eq("campaign_id", campaignId);

  if (deleteError) throw new Error(deleteError.message || "Erro ao atualizar party da campanha");

  if (!normalizedIds.length) return;

  const rows = normalizedIds.map((characterId) => ({
    campaign_id: campaignId,
    character_id: characterId,
  }));

  const { error: insertError } = await supabase!.from("campaign_members").insert(rows);
  if (insertError) throw new Error(insertError.message || "Erro ao salvar party da campanha");
}

async function syncSessions(userId: string, campaignId: string, sessions: Session[]) {
  const { data: existingRows, error: existingError } = await supabase!
    .from("sessions")
    .select("id")
    .eq("owner_id", userId);

  if (existingError) throw new Error(existingError.message || "Erro ao listar sessoes");

  const nextIds = new Set(sessions.map((session) => session.id).filter(Boolean));
  const existingIds = (existingRows ?? [])
    .map((row) => asTrimmedString((row as SessionRow).id))
    .filter((id) => id.length > 0);
  const idsToDelete = existingIds.filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error } = await supabase!
      .from("sessions")
      .delete()
      .eq("owner_id", userId)
      .in("id", idsToDelete);

    if (error) throw new Error(error.message || "Erro ao remover sessoes");
  }

  if (!sessions.length) return;

  const rows = sessions.map((session) => ({
    id: session.id,
    owner_id: userId,
    campaign_id: campaignId,
    title: session.title.trim(),
    scheduled_at: session.scheduledAtIso,
    address: session.address ?? null,
    notes: session.notes ?? null,
    created_at: session.createdAtIso,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase!.from("sessions").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message || "Erro ao salvar sessoes");
}

export async function saveCloudRpgData(userIdInput: string, data: RpgDataV1) {
  if (!isSupabaseConfigured || !supabase) return;
  const userId = userIdInput.trim();
  if (!userId) return;

  const campaignId = await upsertCampaign(userId, data);
  await syncCharacters(userId, data.characters);
  await syncCampaignMembers(campaignId, data.campaign.partyMemberIds ?? []);
  await syncSessions(userId, campaignId, data.sessions);
}
