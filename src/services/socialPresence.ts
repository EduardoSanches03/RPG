import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type PresenceSnapshot = Set<string>;

export function subscribeToSocialPresence(
  userIdInput: string,
  onChange: (onlineUserIds: PresenceSnapshot) => void,
) {
  if (!isSupabaseConfigured || !supabase) {
    onChange(new Set());
    return () => undefined;
  }

  const userId = userIdInput.trim();
  if (!userId) {
    onChange(new Set());
    return () => undefined;
  }

  const channel = supabase.channel("social-presence", {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  function emitPresenceState() {
    const state = channel.presenceState<Record<string, unknown>[]>();
    const onlineUserIds = new Set<string>();

    for (const [presenceKey, entries] of Object.entries(state)) {
      if (!Array.isArray(entries) || entries.length === 0) {
        onlineUserIds.add(presenceKey);
        continue;
      }

      let added = false;
      for (const entry of entries) {
        const entryUserId =
          typeof entry?.user_id === "string" && entry.user_id.trim().length > 0
            ? entry.user_id.trim()
            : null;
        if (entryUserId) {
          onlineUserIds.add(entryUserId);
          added = true;
        }
      }

      if (!added) {
        onlineUserIds.add(presenceKey);
      }
    }

    onChange(onlineUserIds);
  }

  channel.on("presence", { event: "sync" }, emitPresenceState);

  void channel.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") return;
    await channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
    });
    emitPresenceState();
  });

  return () => {
    onChange(new Set());
    void channel.untrack();
    void supabase.removeChannel(channel);
  };
}
