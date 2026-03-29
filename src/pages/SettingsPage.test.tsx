import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { SettingsPage } from "./SettingsPage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

const authMockState = vi.hoisted(() => ({
  value: {
    user: null as any,
    isLoading: false,
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => authMockState.value,
}));

vi.mock("../services/supabaseClient", () => ({
  isSupabaseConfigured: true,
}));

const userProfileApiMock = vi.hoisted(() => ({
  getUserProfileSettings: vi.fn(async () => null),
  upsertUserProfileSettings: vi.fn(async () => undefined),
}));

vi.mock("../services/userProfileApi", () => ({
  getUserProfileSettings: userProfileApiMock.getUserProfileSettings,
  upsertUserProfileSettings: userProfileApiMock.upsertUserProfileSettings,
}));

function renderSettings(options?: { data?: ReturnType<typeof createBaseRpgData> }) {
  const data = options?.data ?? createBaseRpgData();
  return render(
    <RpgDataContext.Provider value={{ data, actions: createMockActions() }}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </RpgDataContext.Provider>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    authMockState.value = {
      user: null,
      isLoading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
    };
    localStorage.clear();
    userProfileApiMock.getUserProfileSettings.mockClear();
    userProfileApiMock.upsertUserProfileSettings.mockClear();
  });

  it("deve renderizar fluxo de autenticacao quando usuario nao estiver logado", () => {
    renderSettings();

    expect(screen.getByRole("heading", { name: "Bem-vindo" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Entrar" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Registrar" })).toBeInTheDocument();
  });

  it("deve renderizar perfil completo para usuario logado e alternar preferencias", async () => {
    const user = userEvent.setup();

    authMockState.value = {
      user: {
        id: "user-1",
        email: "arcano@taverna.rpg",
        user_metadata: { name: "Mestre Arcano" },
      },
      isLoading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
    };

    renderSettings(
      {
        data: createBaseRpgData({
          sessions: [
            {
              id: "s-1",
              title: "Sessao 1",
              scheduledAtIso: "2026-03-24T20:00:00.000Z",
              createdAtIso: "2026-03-23T20:00:00.000Z",
            },
            {
              id: "s-2",
              title: "Sessao 2",
              scheduledAtIso: "2026-03-25T20:00:00.000Z",
              createdAtIso: "2026-03-24T20:00:00.000Z",
            },
          ],
        }),
      },
    );

    expect(await screen.findByRole("heading", { name: "Mestre Arcano" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "User Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Sessoes Jogadas")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const emailSwitch = screen.getByRole("switch", { name: /Notificacoes por e-mail/i });
    expect(emailSwitch).toHaveAttribute("aria-checked", "true");
    await user.click(emailSwitch);
    expect(emailSwitch).toHaveAttribute("aria-checked", "false");
  });

  it("deve usar identidade real do usuario logado quando metadata nao tiver nome", async () => {
    authMockState.value = {
      user: {
        id: "user-real",
        email: "jogador@taverna.rpg",
        user_metadata: {},
      },
      isLoading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
    };

    renderSettings();

    expect(await screen.findByRole("heading", { name: "jogador" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("jogador@taverna.rpg")).toBeInTheDocument();
  });

  it("deve consultar perfil direto no banco e refletir dados remotos", async () => {
    userProfileApiMock.getUserProfileSettings.mockResolvedValueOnce({
      displayName: "Kaelen Banco",
      bio: "Bio vinda da nuvem",
      badge: "Aventureiro",
      preferences: {
        emailNotifications: true,
        obsidianTheme: true,
        diceSound: false,
      },
    });

    authMockState.value = {
      user: {
        id: "user-legacy",
        email: "kaelen@taverna.rpg",
        user_metadata: { name: "Nome Local" },
      },
      isLoading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
    };

    renderSettings();

    await waitFor(() => {
      expect(userProfileApiMock.getUserProfileSettings).toHaveBeenCalledWith("user-legacy");
    });
    expect(await screen.findByRole("heading", { name: "Kaelen Banco" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("kaelen@taverna.rpg")).toBeInTheDocument();
  });

  it("deve salvar edicao do perfil no banco ao confirmar alteracoes", async () => {
    const user = userEvent.setup();
    userProfileApiMock.getUserProfileSettings
      .mockResolvedValueOnce({
        displayName: "Mestre Arcano",
        bio: "Narrador inicial",
        badge: "Grande Arquivista",
        preferences: {
          emailNotifications: true,
          obsidianTheme: true,
          diceSound: false,
        },
      })
      .mockResolvedValueOnce({
        displayName: "Kaelen",
        bio: "Narrador inicial",
        badge: "Grande Arquivista",
        preferences: {
          emailNotifications: true,
          obsidianTheme: true,
          diceSound: false,
        },
      });

    authMockState.value = {
      user: {
        id: "user-1",
        email: "arcano@taverna.rpg",
        user_metadata: { name: "Mestre Arcano" },
      },
      isLoading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
    };

    renderSettings();

    const editButton = await screen.findByRole("button", { name: "Editar Perfil" });
    await user.click(editButton);

    const displayNameInput = screen.getByDisplayValue("Mestre Arcano");
    await user.clear(displayNameInput);
    await user.type(displayNameInput, "Kaelen");

    await user.click(screen.getByRole("button", { name: "Salvar Perfil" }));

    await waitFor(() => {
      expect(userProfileApiMock.upsertUserProfileSettings).toHaveBeenCalledWith({
        userId: "user-1",
        profile: expect.objectContaining({
          displayName: "Kaelen",
        }),
      });
    });
  });
});
