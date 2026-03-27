import { render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("heading", { name: "Mestre Arcano" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "User Settings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByText("Sessoes Jogadas")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const emailSwitch = screen.getByRole("switch", { name: /Notificacoes por e-mail/i });
    expect(emailSwitch).toHaveAttribute("aria-checked", "true");
    await user.click(emailSwitch);
    expect(emailSwitch).toHaveAttribute("aria-checked", "false");
  });

  it("deve usar identidade real do usuario logado quando metadata nao tiver nome", () => {
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

    expect(screen.getByRole("heading", { name: "jogador" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("jogador@taverna.rpg")).toBeInTheDocument();
  });

  it("deve ignorar placeholders legados e manter dados do usuario autenticado", () => {
    const storageKey = "a-taverna:profile:v1:user-legacy";
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        displayName: "Mestre Arcano",
        email: "arcanista@taverna.rpg",
        bio: "Bio antiga",
      }),
    );

    authMockState.value = {
      user: {
        id: "user-legacy",
        email: "kaelen@taverna.rpg",
        user_metadata: { name: "Kaelen" },
      },
      isLoading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
    };

    renderSettings();

    expect(screen.getByRole("heading", { name: "Kaelen" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("kaelen@taverna.rpg")).toBeInTheDocument();
  });
});
