import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicProfilePage } from "./PublicProfilePage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

const profileApiMock = vi.hoisted(() => ({
  getPublicProfileById: vi.fn(),
}));
const friendRequestApiMock = vi.hoisted(() => ({
  createFriendRequest: vi.fn(),
  listReceivedFriendRequests: vi.fn(),
  updateFriendRequestStatus: vi.fn(),
}));
const authMockState = vi.hoisted(() => ({
  value: {
    user: { id: "viewer-1" } as null | { id: string },
  },
}));

vi.mock("../services/profileApi", () => ({
  getPublicProfileById: profileApiMock.getPublicProfileById,
}));
vi.mock("../services/friendRequestApi", () => ({
  createFriendRequest: friendRequestApiMock.createFriendRequest,
  listReceivedFriendRequests: friendRequestApiMock.listReceivedFriendRequests,
  updateFriendRequestStatus: friendRequestApiMock.updateFriendRequestStatus,
}));
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => authMockState.value,
}));

function renderPage(options?: {
  profileId?: string;
  data?: ReturnType<typeof createBaseRpgData>;
  actions?: ReturnType<typeof createMockActions>;
}) {
  const data = options?.data ?? createBaseRpgData();
  const actions = options?.actions ?? createMockActions();
  const profileId = options?.profileId ?? "u-1";

  return render(
    <RpgDataContext.Provider value={{ data, actions }}>
      <MemoryRouter initialEntries={[`/profiles/${profileId}`]}>
        <Routes>
          <Route path="/profiles/:id" element={<PublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    </RpgDataContext.Provider>,
  );
}

describe("PublicProfilePage", () => {
  beforeEach(() => {
    profileApiMock.getPublicProfileById.mockReset();
    friendRequestApiMock.createFriendRequest.mockReset();
    friendRequestApiMock.listReceivedFriendRequests.mockReset();
    friendRequestApiMock.updateFriendRequestStatus.mockReset();
    friendRequestApiMock.listReceivedFriendRequests.mockResolvedValue([]);
    authMockState.value = {
      user: { id: "viewer-1" },
    };
  });

  it("deve carregar e exibir perfil publico vindo do banco", async () => {
    profileApiMock.getPublicProfileById.mockResolvedValue({
      id: "u-1",
      displayName: "Mestre Arcano",
      handle: "@mestrearcano",
      bio: "Narrador veterano.",
      badge: "Grande Arquivista",
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Mestre Arcano" })).toBeInTheDocument();
    });

    expect(screen.getByText("@mestrearcano")).toBeInTheDocument();
    expect(screen.getByText("Narrador veterano.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar solicitacao/i })).toBeInTheDocument();
  });

  it("deve enviar solicitacao de amizade no perfil publico", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    profileApiMock.getPublicProfileById.mockResolvedValue({
      id: "u-2",
      displayName: "Elara",
      handle: "@elara",
    });

    renderPage({ profileId: "u-2", actions });

    const button = await screen.findByRole("button", { name: /Enviar solicitacao/i });
    await user.click(button);

    expect(friendRequestApiMock.createFriendRequest).toHaveBeenCalledWith({
      requesterId: "viewer-1",
      addresseeId: "u-2",
    });
    expect(actions.sendFriendRequest).toHaveBeenCalledWith({
      id: "u-2",
      name: "Elara",
      handle: "@elara",
      avatarUrl: undefined,
    });
  });

  it("deve exibir aceitar e recusar quando houver solicitacao recebida desse perfil", async () => {
    profileApiMock.getPublicProfileById.mockResolvedValue({
      id: "u-3",
      displayName: "Eduardo Madlito",
      handle: "@edu",
    });
    friendRequestApiMock.listReceivedFriendRequests.mockResolvedValue([
      {
        requesterId: "u-3",
        displayName: "Eduardo Madlito",
        handle: "@edu",
        sentAtIso: "2026-03-25T00:00:00.000Z",
        status: "pending",
      },
    ]);

    renderPage({ profileId: "u-3" });

    expect(await screen.findByRole("button", { name: "Aceitar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recusar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar solicitacao/i })).not.toBeInTheDocument();
  });

  it("deve aceitar solicitacao recebida no perfil publico", async () => {
    const user = userEvent.setup();
    profileApiMock.getPublicProfileById.mockResolvedValue({
      id: "u-4",
      displayName: "Theron",
      handle: "@theron",
    });
    friendRequestApiMock.listReceivedFriendRequests.mockResolvedValue([
      {
        requesterId: "u-4",
        displayName: "Theron",
        handle: "@theron",
        sentAtIso: "2026-03-25T00:00:00.000Z",
        status: "pending",
      },
    ]);
    friendRequestApiMock.updateFriendRequestStatus.mockResolvedValue(undefined);

    renderPage({ profileId: "u-4" });

    await user.click(await screen.findByRole("button", { name: "Aceitar" }));

    expect(friendRequestApiMock.updateFriendRequestStatus).toHaveBeenCalledWith({
      requesterId: "u-4",
      addresseeId: "viewer-1",
      status: "accepted",
    });
  });
});
