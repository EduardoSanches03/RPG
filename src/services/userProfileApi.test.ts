import {
  getUserProfileSettings,
  upsertUserProfileSettings,
} from "./userProfileApi";

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

describe("userProfileApi", () => {
  beforeEach(() => {
    supabaseState.configured = false;
    supabaseState.client = null;
  });

  it("deve buscar configuracoes do perfil do usuario", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        id: "u-1",
        display_name: "Mestre Arcano",
        bio: "Narrador.",
        badge: "Grande Arquivista",
        avatar_url: "https://img.test/u-1.png",
        email_notifications: true,
        obsidian_theme: true,
        dice_sound: false,
      },
      error: null,
    }));
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    supabaseState.configured = true;
    supabaseState.client = { from };

    const profile = await getUserProfileSettings("u-1");

    expect(from).toHaveBeenCalledWith("profiles");
    expect(profile).toEqual({
      displayName: "Mestre Arcano",
      bio: "Narrador.",
      badge: "Grande Arquivista",
      avatarUrl: "https://img.test/u-1.png",
      preferences: {
        emailNotifications: true,
        obsidianTheme: true,
        diceSound: false,
      },
    });
  });

  it("deve salvar configuracoes do perfil do usuario", async () => {
    const limit = vi.fn(async () => ({ data: [{ id: "u-1" }], error: null }));
    const select = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ update, insert }));

    supabaseState.configured = true;
    supabaseState.client = { from };

    await upsertUserProfileSettings({
      userId: "u-1",
      profile: {
        displayName: "Kaelen",
        bio: "Jogador.",
        badge: "Aventureiro",
        preferences: {
          emailNotifications: false,
          obsidianTheme: true,
          diceSound: true,
        },
      },
    });

    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: "Kaelen",
        email_notifications: false,
        dice_sound: true,
      }),
    );
    expect(eq).toHaveBeenCalledWith("id", "u-1");
    expect(insert).not.toHaveBeenCalled();
  });

  it("deve inserir perfil quando nao existir registro para update", async () => {
    const limit = vi.fn(async () => ({ data: [], error: null }));
    const select = vi.fn(() => ({ limit }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const insert = vi.fn(async () => ({ error: null }));
    const from = vi.fn(() => ({ update, insert }));

    supabaseState.configured = true;
    supabaseState.client = { from };

    await upsertUserProfileSettings({
      userId: "user-1234",
      profile: {
        displayName: "Nome Novo",
        bio: "",
        badge: "Aventureiro",
        preferences: {
          emailNotifications: true,
          obsidianTheme: true,
          diceSound: false,
        },
      },
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1234",
        username: expect.any(String),
        display_name: "Nome Novo",
      }),
    );
  });
});
