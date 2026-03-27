import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type PublicProfile = {
  id: string;
  displayName: string;
  handle: string;
  bio?: string;
  avatarUrl?: string;
  badge?: string;
};

type ProfileRow = {
  id?: unknown;
  display_name?: unknown;
  username?: unknown;
  bio?: unknown;
  avatar_url?: unknown;
  badge?: unknown;
};

function normalizeHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "@aventureiro";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function normalizeDisplayName(value: string | undefined, fallbackHandle: string) {
  if (value && value.trim()) return value.trim();
  return fallbackHandle.replace(/^@/, "") || "Aventureiro";
}

function normalizeProfileRow(row: ProfileRow): PublicProfile | null {
  if (typeof row.id !== "string" || !row.id.trim()) return null;
  const rawHandle = typeof row.username === "string" ? row.username : "";
  const handle = normalizeHandle(rawHandle);
  const displayName = normalizeDisplayName(
    typeof row.display_name === "string" ? row.display_name : undefined,
    handle,
  );

  return {
    id: row.id,
    displayName,
    handle,
    bio: typeof row.bio === "string" ? row.bio : undefined,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : undefined,
    badge: typeof row.badge === "string" ? row.badge : undefined,
  };
}

function escapeLikePattern(input: string) {
  return input.replace(/[%_]/g, "");
}

export async function searchPublicProfiles(query: string, limit = 8) {
  if (!isSupabaseConfigured || !supabase) return [] as PublicProfile[];
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [] as PublicProfile[];

  const token = escapeLikePattern(normalizedQuery);
  const ilike = `%${token}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, bio, avatar_url, badge")
    .or(`display_name.ilike.${ilike},username.ilike.${ilike}`)
    .limit(limit);

  if (error) throw new Error(error.message || "Erro ao buscar perfis");

  return (data ?? [])
    .map((row) => normalizeProfileRow(row as ProfileRow))
    .filter((row): row is PublicProfile => Boolean(row));
}

export async function getPublicProfileById(id: string) {
  if (!isSupabaseConfigured || !supabase) return null as PublicProfile | null;
  const profileId = id.trim();
  if (!profileId) return null as PublicProfile | null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, bio, avatar_url, badge")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Erro ao carregar perfil");
  if (!data) return null;
  return normalizeProfileRow(data as ProfileRow);
}
