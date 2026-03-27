import { getPublicProfileById, searchPublicProfiles } from "./profileApi";

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

function buildSearchClient(result: { data: unknown[] | null; error: { message: string } | null }) {
  const limit = vi.fn(async () => result);
  const or = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ or }));
  const from = vi.fn(() => ({ select }));
  return {
    client: { from },
    spies: { from, select, or, limit },
  };
}

function buildGetByIdClient(result: {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
}) {
  const maybeSingle = vi.fn(async () => result);
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return {
    client: { from },
    spies: { from, select, eq, maybeSingle },
  };
}

describe("profileApi", () => {
  beforeEach(() => {
    supabaseState.configured = false;
    supabaseState.client = null;
  });

  it("deve buscar perfis publicos no banco e normalizar os campos", async () => {
    const supabase = buildSearchClient({
      data: [
        {
          id: "u-1",
          display_name: "Mestre Arcano",
          username: "mestrearcano",
          bio: "Narrador",
          avatar_url: "https://img.test/u-1.png",
          badge: "Grande Arquivista",
        },
      ],
      error: null,
    });

    supabaseState.configured = true;
    supabaseState.client = supabase.client;

    const result = await searchPublicProfiles("arc", 5);

    expect(supabase.spies.from).toHaveBeenCalledWith("profiles");
    expect(result).toEqual([
      {
        id: "u-1",
        displayName: "Mestre Arcano",
        handle: "@mestrearcano",
        bio: "Narrador",
        avatarUrl: "https://img.test/u-1.png",
        badge: "Grande Arquivista",
      },
    ]);
  });

  it("deve carregar perfil publico por id", async () => {
    const supabase = buildGetByIdClient({
      data: {
        id: "u-2",
        display_name: "Elara",
        username: "@elara",
      },
      error: null,
    });
    supabaseState.configured = true;
    supabaseState.client = supabase.client;

    const profile = await getPublicProfileById("u-2");

    expect(supabase.spies.from).toHaveBeenCalledWith("profiles");
    expect(profile).toEqual({
      id: "u-2",
      displayName: "Elara",
      handle: "@elara",
      bio: undefined,
      avatarUrl: undefined,
      badge: undefined,
    });
  });

  it("deve retornar vazio quando supabase nao estiver configurado", async () => {
    const result = await searchPublicProfiles("arc");
    const profile = await getPublicProfileById("u-1");

    expect(result).toEqual([]);
    expect(profile).toBeNull();
  });
});
