import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type UserProfilePreferences = {
  emailNotifications: boolean;
  obsidianTheme: boolean;
  diceSound: boolean;
};

export type UserProfileSettings = {
  displayName: string;
  bio: string;
  badge: string;
  avatarUrl?: string;
  preferences: UserProfilePreferences;
};

type ProfileRow = {
  id?: unknown;
  username?: unknown;
  display_name?: unknown;
  bio?: unknown;
  badge?: unknown;
  avatar_url?: unknown;
  email_notifications?: unknown;
  obsidian_theme?: unknown;
  dice_sound?: unknown;
};

export async function getUserProfileSettings(userIdInput: string) {
  if (!isSupabaseConfigured || !supabase) return null as UserProfileSettings | null;
  const userId = userIdInput.trim();
  if (!userId) return null as UserProfileSettings | null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, bio, badge, avatar_url, email_notifications, obsidian_theme, dice_sound",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message || "Erro ao buscar perfil do usuario.");
  if (!data) return null;

  const row = data as ProfileRow;
  return {
    displayName:
      typeof row.display_name === "string" && row.display_name.trim().length > 0
        ? row.display_name.trim()
        : "Aventureiro",
    bio: typeof row.bio === "string" ? row.bio : "",
    badge:
      typeof row.badge === "string" && row.badge.trim().length > 0
        ? row.badge.trim()
        : "Aventureiro",
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : undefined,
    preferences: {
      emailNotifications:
        typeof row.email_notifications === "boolean" ? row.email_notifications : true,
      obsidianTheme:
        typeof row.obsidian_theme === "boolean" ? row.obsidian_theme : true,
      diceSound: typeof row.dice_sound === "boolean" ? row.dice_sound : false,
    },
  };
}

function buildUsername(displayName: string, userId: string) {
  const base = displayName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  const fallback = `user_${userId.replace(/-/g, "").slice(0, 8)}`;
  const composed = base.length >= 3 ? `${base}_${userId.replace(/-/g, "").slice(0, 4)}` : fallback;
  return composed.slice(0, 30);
}

export async function upsertUserProfileSettings(input: {
  userId: string;
  profile: UserProfileSettings;
}) {
  if (!isSupabaseConfigured || !supabase) return;
  const userId = input.userId.trim();
  if (!userId) return;

  const updatePayload = {
    display_name: input.profile.displayName.trim() || "Aventureiro",
    bio: input.profile.bio || "",
    badge: input.profile.badge.trim() || "Aventureiro",
    avatar_url: input.profile.avatarUrl ?? null,
    email_notifications: input.profile.preferences.emailNotifications,
    obsidian_theme: input.profile.preferences.obsidianTheme,
    dice_sound: input.profile.preferences.diceSound,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select("id")
    .limit(1);

  if (updateError) {
    throw new Error(updateError.message || "Erro ao salvar perfil do usuario.");
  }
  if ((updatedRows ?? []).length > 0) return;

  const insertPayload = {
    id: userId,
    username: buildUsername(updatePayload.display_name, userId),
    ...updatePayload,
  };

  const { error: insertError } = await supabase.from("profiles").insert(insertPayload);
  if (insertError) throw new Error(insertError.message || "Erro ao salvar perfil do usuario.");
}
