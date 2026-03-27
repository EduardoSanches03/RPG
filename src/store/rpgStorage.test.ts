import {
  createSeedData,
  loadRpgData,
  newId,
  newIsoNow,
  normalizeRpgDataV1,
  saveRpgData,
} from "./rpgStorage";

const STORAGE_KEY = "rpg-dashboard:data";
const STORAGE_KEY_PREFIX = "rpg-dashboard:data:";

describe("rpgStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("deve criar seed com estrutura minima esperada", () => {
    const seed = createSeedData();

    expect(seed.version).toBe(1);
    expect(seed.campaign.name).toBe("A Taverna");
    expect(seed.characters).toEqual([]);
    expect(seed.sessions).toEqual([]);
    expect(seed.notes.campaign).toBe("");
    expect(seed.campaign.locale).toBe("pt-BR");
    expect(seed.campaign.timeZone).toBe("America/Sao_Paulo");
    expect(seed.campaign.isRegistered).toBe(false);
    expect(seed.campaign.partyMemberIds).toEqual([]);
    expect(seed.social?.friends).toEqual([]);
    expect(seed.social?.groups).toEqual([]);
    expect(seed.social?.directory).toEqual([]);
    expect(seed.social?.requestsSent).toEqual([]);
  });

  it("deve normalizar entradas invalidas para estrutura v1", () => {
    const normalized = normalizeRpgDataV1({
      campaign: { name: "Campanha Teste" },
      characters: [
        { id: "a", name: "Char sem modulos", ancestry: "Ancestral", conviction: 2, edges: "4" },
      ],
      sessions: ["invalido", { id: "s1", title: "S1" }],
      notes: {},
      social: {
        friends: [{ id: "f-1", name: "Amigo", status: "online" }],
        groups: [{ id: "g-1", name: "Grupo", role: "owner", membersCount: 4, onlineCount: 2 }],
        directory: [{ id: "u-1", name: "Perfil", handle: "@perfil", status: "online" }],
        requestsSent: [{ id: "u-2", name: "Alvo", status: "pending" }],
      },
    });

    expect(normalized.version).toBe(1);
    expect(normalized.campaign.name).toBe("Campanha Teste");
    expect(normalized.campaign.role).toBe("mestre");
    expect(normalized.campaign.locale).toBe("pt-BR");
    expect(normalized.campaign.timeZone).toBe("America/Sao_Paulo");
    expect(normalized.campaign.isRegistered).toBe(false);
    expect(normalized.campaign.partyMemberIds).toEqual([]);
    expect(Array.isArray(normalized.characters[0].modules)).toBe(true);
    expect(normalized.characters[0].ancestry).toBe("Ancestral");
    expect(normalized.characters[0].conviction).toBe(2);
    expect(normalized.characters[0].edges).toBe(4);
    expect(normalized.social?.friends[0].name).toBe("Amigo");
    expect(normalized.social?.groups[0].name).toBe("Grupo");
    expect(normalized.social?.directory?.[0].handle).toBe("@perfil");
    expect(normalized.social?.requestsSent?.[0].id).toBe("u-2");
    expect(normalized.social?.requestsSent?.[0].status).toBe("pending");
    expect(normalized.sessions).toHaveLength(1);
    expect(normalized.notes.campaign).toBe("");
  });

  it("deve carregar seed quando nao ha dados no localStorage", () => {
    const data = loadRpgData();
    expect(data.version).toBe(1);
    expect(data.campaign.name).toBe("A Taverna");
  });

  it("deve limpar dataset social legado mockado automaticamente", () => {
    const normalized = normalizeRpgDataV1({
      social: {
        friends: [
          { id: "f-1", name: "SlayerOfEgirl", status: "in_party" },
          { id: "f-2", name: "Danielz", status: "online" },
          { id: "f-3", name: "Afro Samurai", status: "in_party" },
          { id: "f-4", name: "StevenStone", status: "offline" },
        ],
        groups: [
          {
            id: "g-1",
            name: "A Taverna - Mesa Principal",
            role: "owner",
            membersCount: 6,
            onlineCount: 3,
          },
          {
            id: "g-2",
            name: "Guilda dos Arcanos",
            role: "member",
            membersCount: 12,
            onlineCount: 5,
          },
        ],
        directory: [
          { id: "u-1", name: "Mestre Arcano", handle: "@mestrearcano" },
          { id: "u-2", name: "Kaelen Sombra", handle: "@kaelen" },
          { id: "u-3", name: "Elara Moonwhisper", handle: "@elara" },
        ],
      },
    });

    expect(normalized.social?.friends).toEqual([]);
    expect(normalized.social?.groups).toEqual([]);
    expect(normalized.social?.directory).toEqual([]);
  });

  it("deve persistir e recarregar dados salvos", () => {
    const seed = createSeedData();
    seed.campaign.name = "Minha Campanha";
    saveRpgData(seed, "user-1");

    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}user-1`);
    expect(raw).toBeTruthy();

    const loaded = loadRpgData("user-1");
    expect(loaded.campaign.name).toBe("Minha Campanha");
  });

  it("deve tratar quota excedida limpando caches redundantes e sem derrubar a app", () => {
    const seed = createSeedData();
    localStorage.setItem("rpg-dashboard:sqlite-db", "sqlite-cache");
    localStorage.setItem(`${STORAGE_KEY_PREFIX}user-antigo`, JSON.stringify(createSeedData()));

    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(function (key: string, value: string) {
        if (key === `${STORAGE_KEY_PREFIX}user-1` && !this.getItem("__quota_once__")) {
          originalSetItem.call(this, "__quota_once__", "1");
          throw new DOMException("quota cheia", "QuotaExceededError");
        }

        return originalSetItem.call(this, key, value);
      });

    expect(() => saveRpgData(seed, "user-1")).not.toThrow();
    expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}user-1`)).toBeTruthy();
    expect(localStorage.getItem("rpg-dashboard:sqlite-db")).toBeNull();
    expect(localStorage.getItem(`${STORAGE_KEY_PREFIX}user-antigo`)).toBeNull();

    setItemSpy.mockRestore();
    localStorage.removeItem("__quota_once__");
  });

  it("deve isolar dados por usuario no localStorage", () => {
    const first = createSeedData();
    first.campaign.name = "Campanha do Eduardo";
    saveRpgData(first, "eduardo");

    const second = createSeedData();
    second.campaign.name = "Campanha da Elara";
    saveRpgData(second, "elara");

    expect(loadRpgData("eduardo").campaign.name).toBe("Campanha do Eduardo");
    expect(loadRpgData("elara").campaign.name).toBe("Campanha da Elara");
    expect(loadRpgData("theron").campaign.name).toBe("A Taverna");
  });

  it("deve recuperar seed quando json armazenado estiver corrompido", () => {
    localStorage.setItem(STORAGE_KEY, "{ json invalido");
    const loaded = loadRpgData();
    expect(loaded.version).toBe(1);
    expect(loaded.campaign.name).toBe("A Taverna");
  });

  it("deve gerar identificador e timestamp em formato valido", () => {
    const id = newId();
    const iso = newIsoNow();

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });
});
