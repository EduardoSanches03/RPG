import { isSupabaseConfigured, supabase } from "./supabaseClient";

export type SentFriendRequest = {
  addresseeId: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
  sentAtIso: string;
  status: "pending";
};

export type FriendProfile = {
  id: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
  status: "offline";
};

export type ReceivedFriendRequest = {
  requesterId: string;
  displayName: string;
  handle?: string;
  avatarUrl?: string;
  sentAtIso: string;
  status: "pending";
};

export type FriendRequestStatusUpdate = "accepted" | "rejected" | "cancelled";

function normalizeHandle(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export async function createFriendRequest(input: {
  requesterId: string;
  addresseeId: string;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const requesterId = input.requesterId.trim();
  const addresseeId = input.addresseeId.trim();
  if (!requesterId || !addresseeId) {
    throw new Error("requesterId e addresseeId sao obrigatorios.");
  }
  if (requesterId === addresseeId) {
    throw new Error("Nao e permitido enviar solicitacao para si mesmo.");
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("friend_requests")
    .select("requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`,
    )
    .in("status", ["pending", "accepted"])
    .limit(10);

  if (existingError) {
    throw new Error(existingError.message || "Erro ao validar solicitacao existente.");
  }

  const existingEntries = (existingRows ?? []) as Array<{
    requester_id?: string;
    addressee_id?: string;
    status?: "pending" | "accepted";
  }>;

  const acceptedEntry = existingEntries.find((entry) => entry.status === "accepted");
  if (acceptedEntry) {
    throw new Error("Usuarios ja sao amigos.");
  }

  const outgoingPendingEntry = existingEntries.find(
    (entry) =>
      entry.status === "pending" &&
      entry.requester_id === requesterId &&
      entry.addressee_id === addresseeId,
  );
  if (outgoingPendingEntry) {
    throw new Error("Solicitacao ja enviada.");
  }

  const incomingPendingEntry = existingEntries.find(
    (entry) =>
      entry.status === "pending" &&
      entry.requester_id === addresseeId &&
      entry.addressee_id === requesterId,
  );
  if (incomingPendingEntry) {
    throw new Error("Voce ja recebeu uma solicitacao pendente deste usuario.");
  }

  const { error } = await supabase.from("friend_requests").insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (!error) return;

  if ((error as { code?: string }).code === "23505") {
    throw new Error("Solicitacao ja enviada.");
  }

  throw new Error(error.message || "Erro ao enviar solicitacao.");
}

export async function listSentFriendRequests(requesterIdInput: string) {
  if (!isSupabaseConfigured || !supabase) return [] as SentFriendRequest[];
  const requesterId = requesterIdInput.trim();
  if (!requesterId) return [] as SentFriendRequest[];

  const { data: rows, error } = await supabase
    .from("friend_requests")
    .select("addressee_id, created_at, status")
    .eq("requester_id", requesterId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Erro ao listar solicitacoes.");
  }

  const entries = (rows ?? []) as Array<{
    addressee_id?: string;
    created_at?: string;
    status?: "pending";
  }>;
  const addresseeIds = entries
    .map((entry) => entry.addressee_id)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (addresseeIds.length === 0) return [] as SentFriendRequest[];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", addresseeIds);

  if (profileError) {
    throw new Error(profileError.message || "Erro ao carregar perfis das solicitacoes.");
  }

  const profileMap = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((profile) => [
      String(profile.id),
      {
        displayName:
          typeof profile.display_name === "string" && profile.display_name.trim().length > 0
            ? profile.display_name.trim()
            : "Aventureiro",
        handle:
          typeof profile.username === "string" ? normalizeHandle(profile.username) : undefined,
        avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
      },
    ]),
  );

  return entries
    .map((entry) => {
      const addresseeId = entry.addressee_id;
      if (!addresseeId) return null;
      const profile = profileMap.get(addresseeId);
      return {
        addresseeId,
        displayName: profile?.displayName ?? "Aventureiro",
        handle: profile?.handle,
        avatarUrl: profile?.avatarUrl,
        sentAtIso: entry.created_at ?? new Date().toISOString(),
        status: "pending" as const,
      };
    })
    .filter((entry): entry is SentFriendRequest => Boolean(entry));
}

export async function listAcceptedFriends(userIdInput: string) {
  if (!isSupabaseConfigured || !supabase) return [] as FriendProfile[];

  const userId = userIdInput.trim();
  if (!userId) return [] as FriendProfile[];

  const { data: rows, error } = await supabase
    .from("friend_requests")
    .select("requester_id, addressee_id, status, updated_at")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Erro ao listar amizades.");
  }

  const relatedRows = (rows ?? []) as Array<{
    requester_id?: string;
    addressee_id?: string;
    status?: "accepted";
  }>;

  const uniqueIds = new Set<string>();
  for (const row of relatedRows) {
    const requesterId = row.requester_id;
    const addresseeId = row.addressee_id;
    if (!requesterId || !addresseeId) continue;
    if (requesterId === userId && addresseeId !== userId) uniqueIds.add(addresseeId);
    if (addresseeId === userId && requesterId !== userId) uniqueIds.add(requesterId);
  }

  const friendIds = Array.from(uniqueIds);
  if (friendIds.length === 0) return [] as FriendProfile[];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", friendIds);

  if (profileError) {
    throw new Error(profileError.message || "Erro ao carregar perfis de amigos.");
  }

  const profileMap = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((profile) => {
      const id = typeof profile.id === "string" ? profile.id : "";
      const displayName =
        typeof profile.display_name === "string" && profile.display_name.trim().length > 0
          ? profile.display_name.trim()
          : "Aventureiro";
      const handle =
        typeof profile.username === "string" ? normalizeHandle(profile.username) : undefined;
      const avatarUrl = typeof profile.avatar_url === "string" ? profile.avatar_url : undefined;
      return [id, { id, displayName, handle, avatarUrl, status: "offline" as const }];
    }),
  );

  return friendIds
    .map((id) => profileMap.get(id))
    .filter((friend): friend is FriendProfile => Boolean(friend));
}

export async function listReceivedFriendRequests(addresseeIdInput: string) {
  if (!isSupabaseConfigured || !supabase) return [] as ReceivedFriendRequest[];
  const addresseeId = addresseeIdInput.trim();
  if (!addresseeId) return [] as ReceivedFriendRequest[];

  const { data: rows, error } = await supabase
    .from("friend_requests")
    .select("requester_id, created_at, status")
    .eq("addressee_id", addresseeId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Erro ao listar solicitacoes recebidas.");
  }

  const entries = (rows ?? []) as Array<{
    requester_id?: string;
    created_at?: string;
    status?: "pending";
  }>;
  const requesterIds = entries
    .map((entry) => entry.requester_id)
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (requesterIds.length === 0) return [] as ReceivedFriendRequest[];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", requesterIds);

  if (profileError) {
    throw new Error(profileError.message || "Erro ao carregar perfis das solicitacoes recebidas.");
  }

  const profileMap = new Map(
    ((profiles ?? []) as Array<Record<string, unknown>>).map((profile) => [
      String(profile.id),
      {
        displayName:
          typeof profile.display_name === "string" && profile.display_name.trim().length > 0
            ? profile.display_name.trim()
            : "Aventureiro",
        handle:
          typeof profile.username === "string" ? normalizeHandle(profile.username) : undefined,
        avatarUrl: typeof profile.avatar_url === "string" ? profile.avatar_url : undefined,
      },
    ]),
  );

  return entries
    .map((entry) => {
      const requesterId = entry.requester_id;
      if (!requesterId) return null;
      const profile = profileMap.get(requesterId);
      return {
        requesterId,
        displayName: profile?.displayName ?? "Aventureiro",
        handle: profile?.handle,
        avatarUrl: profile?.avatarUrl,
        sentAtIso: entry.created_at ?? new Date().toISOString(),
        status: "pending" as const,
      };
    })
    .filter((entry): entry is ReceivedFriendRequest => Boolean(entry));
}

export async function updateFriendRequestStatus(input: {
  requesterId: string;
  addresseeId: string;
  status: FriendRequestStatusUpdate;
}) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const requesterId = input.requesterId.trim();
  const addresseeId = input.addresseeId.trim();
  if (!requesterId || !addresseeId) {
    throw new Error("requesterId e addresseeId sao obrigatorios.");
  }

  const status = input.status;
  if (status !== "accepted" && status !== "rejected" && status !== "cancelled") {
    throw new Error("Status de solicitacao invalido.");
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("requester_id", requesterId)
    .eq("addressee_id", addresseeId)
    .eq("status", "pending")
    .select("requester_id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Erro ao atualizar solicitacao.");
  }

  if (!data) {
    throw new Error("Solicitacao nao encontrada ou ja respondida.");
  }
}
