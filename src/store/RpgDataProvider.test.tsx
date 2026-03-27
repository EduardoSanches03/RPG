import { act, render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import type { Character, RpgDataV1 } from "../domain/rpg";
import type { RpgDataContextValue } from "./RpgDataContext";
import { useRpgData } from "./RpgDataContext";
import { RpgDataProvider } from "./RpgDataProvider";
import { createBaseRpgData } from "../test/rpgDataTestUtils";

const STORAGE_KEY = "rpg-dashboard:data";
const STORAGE_KEY_PREFIX = "rpg-dashboard:data:";

const sqliteStorageMocks = vi.hoisted(() => ({
  loadRpgDataFromSqlite: vi.fn(async () => null),
  saveRpgDataToSqlite: vi.fn(async () => {}),
}));

const authMockState = vi.hoisted(() => ({
  value: {
    user: null as null | { id: string },
    isLoading: false,
    isConfigured: false,
  },
}));

const cloudApiMocks = vi.hoisted(() => ({
  loadCloudRpgData: vi.fn(async () => null),
  saveCloudRpgData: vi.fn(async () => undefined),
}));

vi.mock("./sqliteStorage", () => sqliteStorageMocks);

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => authMockState.value,
}));

vi.mock("../services/cloudRpgDataApi", () => ({
  loadCloudRpgData: cloudApiMocks.loadCloudRpgData,
  saveCloudRpgData: cloudApiMocks.saveCloudRpgData,
}));

function buildCharacter(overrides?: Partial<Character>): Character {
  return {
    id: "char-1",
    name: "Thorg",
    system: "savage_pathfinder",
    playerName: "Jogador",
    class: "Druida",
    race: "Humano",
    level: "Novato",
    createdAtIso: "2026-03-24T00:00:00.000Z",
    stats: {
      ca: 10,
      hp: { current: 10, max: 10 },
      initiative: 0,
      pace: 6,
      parry: 6,
      toughness: 8,
      fatigue: 0,
      wounds: 0,
      isIncapacitated: false,
    },
    attributes: {
      agility: 6,
      smarts: 6,
      spirit: 6,
      strength: 6,
      vigor: 6,
    },
    modules: [],
    ...overrides,
  };
}

function Probe(props: { onChange: (value: RpgDataContextValue) => void }) {
  const value = useRpgData();

  useEffect(() => {
    props.onChange(value);
  }, [value, props]);

  return null;
}

async function renderProvider() {
  let current: RpgDataContextValue | null = null;

  render(
    <RpgDataProvider>
      <Probe onChange={(value) => (current = value)} />
    </RpgDataProvider>,
  );

  await waitFor(() => {
    expect(current).not.toBeNull();
  });

  return () => {
    if (!current) throw new Error("Contexto do provider nao inicializado");
    return current;
  };
}

function writeSeed(data: RpgDataV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

describe("RpgDataProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    writeSeed(createBaseRpgData());

    sqliteStorageMocks.loadRpgDataFromSqlite.mockResolvedValue(null);
    sqliteStorageMocks.saveRpgDataToSqlite.mockResolvedValue(undefined);

    authMockState.value = {
      user: null,
      isLoading: false,
      isConfigured: false,
    };

    cloudApiMocks.loadCloudRpgData.mockResolvedValue(null);
    cloudApiMocks.saveCloudRpgData.mockResolvedValue(undefined);
  });

  it("deve aplicar trim e metadados minimos ao criar sessao", async () => {
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.addSession({
        title: "  Sessao com trim  ",
        scheduledAtIso: "2026-03-24T20:00:00.000Z",
        address: "  Discord  ",
        campaignName: "  Campanha X  ",
        notes: "  Planejamento  ",
      });
    });

    await waitFor(() => {
      expect(getCtx().data.sessions).toHaveLength(1);
    });

    const created = getCtx().data.sessions[0];
    expect(created.title).toBe("Sessao com trim");
    expect(created.address).toBe("Discord");
    expect(created.campaignName).toBe("Campanha X");
    expect(created.notes).toBe("Planejamento");
    expect(created.id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(created.createdAtIso))).toBe(false);
    expect(Number.isNaN(Date.parse(created.scheduledAtIso))).toBe(false);
  });

  it("deve permitir nova criacao depois de remover sessao", async () => {
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.addSession({
        title: "Sessao removivel",
        scheduledAtIso: "2026-03-24T20:00:00.000Z",
      });
    });

    await waitFor(() => {
      expect(getCtx().data.sessions).toHaveLength(1);
    });

    const firstSessionId = getCtx().data.sessions[0].id;

    await act(async () => {
      getCtx().actions.removeSession(firstSessionId);
    });

    await waitFor(() => {
      expect(getCtx().data.sessions).toHaveLength(0);
    });

    await act(async () => {
      getCtx().actions.addSession({
        title: "Sessao nova",
        scheduledAtIso: "2026-03-25T20:00:00.000Z",
      });
    });

    await waitFor(() => {
      expect(getCtx().data.sessions).toHaveLength(1);
    });

    expect(getCtx().data.sessions[0].title).toBe("Sessao nova");
  });

  it("deve normalizar layout ao adicionar modulo de personagem", async () => {
    writeSeed(
      createBaseRpgData({
        characters: [buildCharacter()],
      }),
    );
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.addCharacterModule("char-1", {
        type: "skills",
        system: "savage_pathfinder",
        column: 2,
        span: 3,
        rowSpan: 3,
      });
    });

    const char = getCtx().data.characters.find((item) => item.id === "char-1");
    expect(char).toBeTruthy();
    expect(char?.modules).toHaveLength(1);

    const created = char?.modules[0];
    expect(created?.column).toBe(2);
    expect(created?.span).toBe(1);
    expect(created?.rowSpan).toBe(3);
    expect(created?.id.length).toBeGreaterThan(0);
  });

  it("deve normalizar layout ao atualizar modulo existente", async () => {
    writeSeed(
      createBaseRpgData({
        characters: [
          buildCharacter({
            modules: [
              {
                id: "m-1",
                type: "skills",
                system: "savage_pathfinder",
                column: 0,
                span: 1,
                rowSpan: 1,
              },
            ],
          }),
        ],
      }),
    );

    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.updateCharacterModule("char-1", "m-1", {
        column: 2,
        span: 3,
        rowSpan: 99 as any,
      });
    });

    const char = getCtx().data.characters.find((item) => item.id === "char-1");
    expect(char).toBeTruthy();
    const updated = char?.modules.find((module) => module.id === "m-1");

    expect(updated?.column).toBe(2);
    expect(updated?.span).toBe(1);
    expect(updated?.rowSpan).toBe(3);
  });

  it("deve manter persistencia local quando nuvem estiver indisponivel", async () => {
    cloudApiMocks.loadCloudRpgData.mockRejectedValue(new Error("offline"));

    authMockState.value = {
      user: { id: "user-1" },
      isLoading: false,
      isConfigured: true,
    };

    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.setCampaignName("Campanha Offline");
    });

    await waitFor(() => {
      expect(getCtx().data.campaign.name).toBe("Campanha Offline");
    });

    const persistedRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}user-1`);
    expect(persistedRaw).toBeTruthy();
    const persisted = JSON.parse(persistedRaw as string) as RpgDataV1;
    expect(persisted.campaign.name).toBe("Campanha Offline");

    expect(sqliteStorageMocks.saveRpgDataToSqlite).toHaveBeenCalledWith(
      expect.objectContaining({
        campaign: expect.objectContaining({
          name: "Campanha Offline",
        }),
      }),
      "user-1",
    );

    expect(cloudApiMocks.saveCloudRpgData).not.toHaveBeenCalled();
  });

  it("deve registrar campanha com metadados e persistir localmente", async () => {
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.registerCampaign({
        name: "  Sombras sobre Eldoria  ",
        system: "  savage_pathfinder  ",
        role: "mestre",
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
      });
    });

    await waitFor(() => {
      expect(getCtx().data.campaign.name).toBe("Sombras sobre Eldoria");
    });

    expect(getCtx().data.campaign.system).toBe("savage_pathfinder");
    expect(getCtx().data.campaign.role).toBe("mestre");
    expect(getCtx().data.campaign.locale).toBe("pt-BR");
    expect(getCtx().data.campaign.timeZone).toBe("America/Sao_Paulo");
    expect(getCtx().data.campaign.isRegistered).toBe(true);

    const persistedRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}local-user`);
    expect(persistedRaw).toBeTruthy();
    const persisted = JSON.parse(persistedRaw as string) as RpgDataV1;
    expect(persisted.campaign.isRegistered).toBe(true);
    expect(persisted.campaign.name).toBe("Sombras sobre Eldoria");
  });

  it("nao deve reaproveitar dados de outro usuario ao inicializar conta nova", async () => {
    const previousUserData = createBaseRpgData({
      characters: [buildCharacter({ id: "char-thorg", name: "Thorg" })],
    });
    localStorage.setItem(`${STORAGE_KEY_PREFIX}user-old`, JSON.stringify(previousUserData));

    authMockState.value = {
      user: { id: "user-new" },
      isLoading: false,
      isConfigured: true,
    };
    cloudApiMocks.loadCloudRpgData.mockResolvedValue({
      characters: [],
      sessions: [],
      notes: { campaign: "" },
    });

    const getCtx = await renderProvider();

    await waitFor(() => {
      expect(cloudApiMocks.loadCloudRpgData).toHaveBeenCalledWith("user-new");
    });

    expect(getCtx().data.characters.some((character) => character.name === "Thorg")).toBe(false);
  });

  it("deve sincronizar campanha em tabelas separadas quando nuvem estiver pronta", async () => {
    authMockState.value = {
      user: { id: "user-cloud" },
      isLoading: false,
      isConfigured: true,
    };
    cloudApiMocks.loadCloudRpgData.mockResolvedValue({
      characters: [],
      sessions: [],
      notes: { campaign: "" },
    });

    const getCtx = await renderProvider();

    await waitFor(() => {
      expect(cloudApiMocks.loadCloudRpgData).toHaveBeenCalledWith("user-cloud");
    });

    await act(async () => {
      getCtx().actions.setCampaignName("Sombras de Teste");
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
    });

    await waitFor(() => {
      expect(cloudApiMocks.saveCloudRpgData).toHaveBeenCalledWith(
        "user-cloud",
        expect.objectContaining({
          campaign: expect.objectContaining({
            name: "Sombras de Teste",
          }),
        }),
      );
    });
  });

  it("deve vincular membros da party apenas com ids existentes", async () => {
    writeSeed(
      createBaseRpgData({
        characters: [buildCharacter({ id: "c-1" }), buildCharacter({ id: "c-2" })],
      }),
    );
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.setCampaignPartyMembers(["c-2", "x-invalido", "c-1"]);
    });

    expect(getCtx().data.campaign.partyMemberIds).toEqual(["c-2", "c-1"]);
  });

  it("deve registrar solicitacao de amizade e persistir no estado social", async () => {
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.sendFriendRequest({
        id: "user-10",
        name: "Theron",
        handle: "@theron",
      });
    });

    const requests = getCtx().data.social?.requestsSent ?? [];
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      id: "user-10",
      name: "Theron",
      handle: "@theron",
      status: "pending",
    });
    expect(Number.isNaN(Date.parse(requests[0].sentAtIso))).toBe(false);

    const persistedRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}local-user`);
    expect(persistedRaw).toBeTruthy();
    const persisted = JSON.parse(persistedRaw as string) as RpgDataV1;
    expect(persisted.social?.requestsSent?.[0]?.id).toBe("user-10");
  });

  it("deve sincronizar lista de amigos vindos da nuvem", async () => {
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.setSocialFriends([
        {
          id: "friend-20",
          name: "Danielz",
          status: "offline",
          activity: "Offline",
        },
      ]);
    });

    expect(getCtx().data.social?.friends).toEqual([
      {
        id: "friend-20",
        name: "Danielz",
        status: "offline",
        activity: "Offline",
        avatarUrl: undefined,
      },
    ]);
  });

  it("nao deve duplicar solicitacao para usuario ja solicitado ou ja amigo", async () => {
    writeSeed(
      createBaseRpgData({
        social: {
          friends: [{ id: "friend-1", name: "Danielz", status: "online" }],
          groups: [],
          requestsSent: [
            {
              id: "user-20",
              name: "Elara",
              handle: "@elara",
              sentAtIso: "2026-03-25T00:00:00.000Z",
              status: "pending",
            },
          ],
        },
      }),
    );

    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.sendFriendRequest({
        id: "user-20",
        name: "Elara",
      });
      getCtx().actions.sendFriendRequest({
        id: "friend-1",
        name: "Danielz",
      });
    });

    expect(getCtx().data.social?.requestsSent).toHaveLength(1);
    expect(getCtx().data.social?.requestsSent?.[0]?.id).toBe("user-20");
  });

  it("deve sincronizar solicitacoes enviadas vindas da nuvem", async () => {
    const getCtx = await renderProvider();

    await act(async () => {
      getCtx().actions.setSentFriendRequests([
        {
          id: "user-30",
          name: "Theron",
          handle: "@theron",
          sentAtIso: "2026-03-25T00:00:00.000Z",
        },
      ]);
    });

    expect(getCtx().data.social?.requestsSent).toEqual([
      {
        id: "user-30",
        name: "Theron",
        handle: "@theron",
        avatarUrl: undefined,
        sentAtIso: "2026-03-25T00:00:00.000Z",
        status: "pending",
      },
    ]);
  });
});
