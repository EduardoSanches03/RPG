import {
  createFriendRequest,
  listAcceptedFriends,
  listReceivedFriendRequests,
  listSentFriendRequests,
  updateFriendRequestStatus,
} from "./friendRequestApi";

const supabaseState = vi.hoisted(() => ({
  configured: false,
  client: null as null | { from: (table: string) => any },
}));

vi.mock("./supabaseClient", () => ({
  get isSupabaseConfigured() {
    return supabaseState.configured;
  },
  get supabase() {
    return supabaseState.client;
  },
}));

describe("friendRequestApi", () => {
  beforeEach(() => {
    supabaseState.configured = false;
    supabaseState.client = null;
  });

  it("deve criar solicitacao na tabela friend_requests", async () => {
    const limit = vi.fn(async () => ({ data: [], error: null }));
    const inFn = vi.fn(() => ({ limit }));
    const or = vi.fn(() => ({ in: inFn }));
    const insert = vi.fn(async () => ({ error: null }));
    const select = vi.fn(() => ({ or }));
    const from = vi.fn(() => ({ select, insert }));
    supabaseState.configured = true;
    supabaseState.client = { from };

    await createFriendRequest({
      requesterId: "user-1",
      addresseeId: "user-2",
    });

    expect(from).toHaveBeenCalledWith("friend_requests");
    expect(insert).toHaveBeenCalledWith({
      requester_id: "user-1",
      addressee_id: "user-2",
      status: "pending",
    });
  });

  it("deve impedir solicitacao duplicada quando ja houver pendente recebida", async () => {
    const limit = vi.fn(async () => ({
      data: [
        {
          requester_id: "user-2",
          addressee_id: "user-1",
          status: "pending",
        },
      ],
      error: null,
    }));
    const inFn = vi.fn(() => ({ limit }));
    const or = vi.fn(() => ({ in: inFn }));
    const insert = vi.fn(async () => ({ error: null }));
    const select = vi.fn(() => ({ or }));
    const from = vi.fn(() => ({ select, insert }));
    supabaseState.configured = true;
    supabaseState.client = { from };

    await expect(
      createFriendRequest({
        requesterId: "user-1",
        addresseeId: "user-2",
      }),
    ).rejects.toThrow("Voce ja recebeu uma solicitacao pendente deste usuario.");

    expect(insert).not.toHaveBeenCalled();
  });

  it("deve impedir nova solicitacao quando usuarios ja forem amigos", async () => {
    const limit = vi.fn(async () => ({
      data: [
        {
          requester_id: "user-2",
          addressee_id: "user-1",
          status: "accepted",
        },
      ],
      error: null,
    }));
    const inFn = vi.fn(() => ({ limit }));
    const or = vi.fn(() => ({ in: inFn }));
    const insert = vi.fn(async () => ({ error: null }));
    const select = vi.fn(() => ({ or }));
    const from = vi.fn(() => ({ select, insert }));
    supabaseState.configured = true;
    supabaseState.client = { from };

    await expect(
      createFriendRequest({
        requesterId: "user-1",
        addresseeId: "user-2",
      }),
    ).rejects.toThrow("Usuarios ja sao amigos.");

    expect(insert).not.toHaveBeenCalled();
  });

  it("deve listar solicitacoes enviadas com dados de perfil", async () => {
    const inFn = vi.fn(async () => ({
      data: [
        {
          id: "user-2",
          display_name: "Elara",
          username: "elara",
          avatar_url: "https://img.test/elara.png",
        },
      ],
      error: null,
    }));
    const profileSelect = vi.fn(() => ({ in: inFn }));

    const order = vi.fn(async () => ({
      data: [
        {
          addressee_id: "user-2",
          created_at: "2026-03-25T00:00:00.000Z",
          status: "pending",
        },
      ],
      error: null,
    }));
    const eqStatus = vi.fn(() => ({ order }));
    const eqRequester = vi.fn(() => ({ eq: eqStatus }));
    const requestSelect = vi.fn(() => ({ eq: eqRequester }));

    const from = vi.fn((table: string) => {
      if (table === "friend_requests") return { select: requestSelect };
      return { select: profileSelect };
    });

    supabaseState.configured = true;
    supabaseState.client = { from };

    const result = await listSentFriendRequests("user-1");

    expect(result).toEqual([
      {
        addresseeId: "user-2",
        displayName: "Elara",
        handle: "@elara",
        avatarUrl: "https://img.test/elara.png",
        sentAtIso: "2026-03-25T00:00:00.000Z",
        status: "pending",
      },
    ]);
  });

  it("deve listar amizades aceitas do usuario", async () => {
    const inFn = vi.fn(async () => ({
      data: [
        {
          id: "user-2",
          display_name: "Danielz",
          username: "danielz",
          avatar_url: "https://img.test/danielz.png",
        },
      ],
      error: null,
    }));
    const profileSelect = vi.fn(() => ({ in: inFn }));

    const order = vi.fn(async () => ({
      data: [
        {
          requester_id: "user-1",
          addressee_id: "user-2",
          status: "accepted",
          updated_at: "2026-03-25T01:00:00.000Z",
        },
      ],
      error: null,
    }));
    const or = vi.fn(() => ({ order }));
    const eqStatus = vi.fn(() => ({ or }));
    const requestSelect = vi.fn(() => ({ eq: eqStatus }));

    const from = vi.fn((table: string) => {
      if (table === "friend_requests") return { select: requestSelect };
      return { select: profileSelect };
    });

    supabaseState.configured = true;
    supabaseState.client = { from };

    const result = await listAcceptedFriends("user-1");

    expect(result).toEqual([
      {
        id: "user-2",
        displayName: "Danielz",
        handle: "@danielz",
        avatarUrl: "https://img.test/danielz.png",
        status: "offline",
      },
    ]);
    expect(from).toHaveBeenCalledWith("friend_requests");
    expect(from).toHaveBeenCalledWith("profiles");
  });

  it("deve listar solicitacoes recebidas com dados de perfil", async () => {
    const inFn = vi.fn(async () => ({
      data: [
        {
          id: "user-9",
          display_name: "Mestre Arcano",
          username: "mestrearcano",
          avatar_url: "https://img.test/mestre.png",
        },
      ],
      error: null,
    }));
    const profileSelect = vi.fn(() => ({ in: inFn }));

    const order = vi.fn(async () => ({
      data: [
        {
          requester_id: "user-9",
          created_at: "2026-03-25T02:00:00.000Z",
          status: "pending",
        },
      ],
      error: null,
    }));
    const eqStatus = vi.fn(() => ({ order }));
    const eqAddressee = vi.fn(() => ({ eq: eqStatus }));
    const requestSelect = vi.fn(() => ({ eq: eqAddressee }));

    const from = vi.fn((table: string) => {
      if (table === "friend_requests") return { select: requestSelect };
      return { select: profileSelect };
    });

    supabaseState.configured = true;
    supabaseState.client = { from };

    const result = await listReceivedFriendRequests("user-1");

    expect(result).toEqual([
      {
        requesterId: "user-9",
        displayName: "Mestre Arcano",
        handle: "@mestrearcano",
        avatarUrl: "https://img.test/mestre.png",
        sentAtIso: "2026-03-25T02:00:00.000Z",
        status: "pending",
      },
    ]);
  });

  it("deve atualizar status de solicitacao pendente", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: { requester_id: "user-2" },
      error: null,
    }));
    const select = vi.fn(() => ({ maybeSingle }));
    const eqPending = vi.fn(() => ({ select }));
    const eqAddressee = vi.fn(() => ({ eq: eqPending }));
    const eqRequester = vi.fn(() => ({ eq: eqAddressee }));
    const update = vi.fn(() => ({ eq: eqRequester }));
    const from = vi.fn(() => ({ update }));

    supabaseState.configured = true;
    supabaseState.client = { from };

    await updateFriendRequestStatus({
      requesterId: "user-2",
      addresseeId: "user-1",
      status: "accepted",
    });

    expect(from).toHaveBeenCalledWith("friend_requests");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "accepted",
      }),
    );
  });
});
