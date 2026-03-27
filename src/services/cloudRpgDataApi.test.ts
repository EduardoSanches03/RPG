import { loadCloudRpgData, saveCloudRpgData } from "./cloudRpgDataApi";

const supabaseMockState = vi.hoisted(() => ({
  isConfigured: true,
  client: null as null | { from: (table: string) => unknown },
}));

vi.mock("./supabaseClient", () => ({
  get isSupabaseConfigured() {
    return supabaseMockState.isConfigured;
  },
  get supabase() {
    return supabaseMockState.client;
  },
}));

function createLoadClient() {
  return {
    from(table: string) {
      if (table === "campaigns") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      order() {
                        return {
                          limit() {
                            return {
                              maybeSingle: async () => ({
                                data: {
                                  id: "camp-uuid",
                                  owner_id: "user-1",
                                  name: "Eldoria",
                                  system: "savage_pathfinder",
                                  role: "mestre",
                                  locale: "pt-BR",
                                  time_zone: "America/Sao_Paulo",
                                  is_registered: true,
                                  notes: "Notas do mestre",
                                  created_at: "2026-03-25T00:00:00.000Z",
                                },
                                error: null,
                              }),
                            };
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "campaign_members") {
        return {
          select() {
            return {
              eq: async () => ({
                data: [{ character_id: "char-1" }],
                error: null,
              }),
            };
          },
        };
      }

      if (table === "characters") {
        return {
          select() {
            return {
              eq() {
                return {
                  order: async () => ({
                    data: [
                      {
                        id: "char-1",
                        name: "Thorg",
                        system: "savage_pathfinder",
                        player_name: "Eduardo",
                        avatar_url: null,
                        background: null,
                        created_at: "2026-03-25T00:00:00.000Z",
                        is_npc: false,
                      },
                    ],
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === "character_savage_pathfinder") {
        return {
          select() {
            return {
              in: async () => ({
                data: [
                  {
                    character_id: "char-1",
                    class_name: "Druida",
                    ancestry: "Anao",
                    edges: 3,
                    conviction: 2,
                    rank: "Novato",
                    stats: { wounds: 1, fatigue: 0 },
                    attributes: { spirit: 8 },
                    modules: [{ id: "m-1", type: "power_points", system: "savage_pathfinder" }],
                  },
                ],
                error: null,
              }),
            };
          },
        };
      }

      if (table === "character_generic") {
        return {
          select() {
            return {
              in: async () => ({
                data: [],
                error: null,
              }),
            };
          },
        };
      }

      if (table === "sessions") {
        return {
          select() {
            return {
              eq() {
                return {
                  order: async () => ({
                    data: [
                      {
                        id: "sess-1",
                        title: "Sessao 42",
                        scheduled_at: "2026-03-26T20:00:00.000Z",
                        address: "Discord",
                        notes: "Resumo",
                        created_at: "2026-03-25T12:00:00.000Z",
                        campaign_id: "camp-uuid",
                      },
                    ],
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      throw new Error(`Tabela inesperada: ${table}`);
    },
  };
}

function createSaveClient(log: Array<{ table: string; action: string; payload?: unknown }>) {
  return {
    from(table: string) {
      if (table === "campaigns") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      order() {
                        return {
                          limit() {
                            return {
                              maybeSingle: async () => ({ data: null, error: null }),
                            };
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
          insert(payload: unknown) {
            log.push({ table, action: "insert", payload });
            return {
              select() {
                return {
                  limit() {
                    return {
                      maybeSingle: async () => ({
                        data: { id: "camp-new" },
                        error: null,
                      }),
                    };
                  },
                };
              },
            };
          },
          update(payload: unknown) {
            log.push({ table, action: "update", payload });
            return {
              eq() {
                return {
                  eq: async () => ({ error: null }),
                };
              },
            };
          },
        };
      }

      if (table === "characters" || table === "character_savage_pathfinder" || table === "sessions") {
        return {
          select() {
            return {
              eq: async () => ({ data: [], error: null }),
            };
          },
          upsert(payload: unknown) {
            log.push({ table, action: "upsert", payload });
            return Promise.resolve({ error: null });
          },
          delete() {
            return {
              eq() {
                return {
                  in: async () => ({ error: null }),
                };
              },
            };
          },
        };
      }

      if (table === "character_generic") {
        return {
          upsert(payload: unknown) {
            log.push({ table, action: "upsert", payload });
            return Promise.resolve({ error: null });
          },
          delete() {
            return {
              in: async () => ({ error: null }),
            };
          },
        };
      }

      if (table === "campaign_members") {
        return {
          delete() {
            return {
              eq: async () => ({ error: null }),
            };
          },
          insert(payload: unknown) {
            log.push({ table, action: "insert", payload });
            return Promise.resolve({ error: null });
          },
        };
      }

      throw new Error(`Tabela inesperada: ${table}`);
    },
  };
}

describe("cloudRpgDataApi", () => {
  beforeEach(() => {
    supabaseMockState.isConfigured = true;
    supabaseMockState.client = null;
  });

  it("deve carregar campanha, sessoes e personagens a partir das tabelas separadas", async () => {
    supabaseMockState.client = createLoadClient();

    const snapshot = await loadCloudRpgData("user-1");

    expect(snapshot?.campaign).toMatchObject({
      id: "camp-uuid",
      name: "Eldoria",
      system: "savage_pathfinder",
      partyMemberIds: ["char-1"],
    });
    expect(snapshot?.notes.campaign).toBe("Notas do mestre");
    expect(snapshot?.characters).toEqual([
      expect.objectContaining({
        id: "char-1",
        name: "Thorg",
        class: "Druida",
        ancestry: "Anao",
        edges: 3,
        conviction: 2,
      }),
    ]);
    expect(snapshot?.sessions).toEqual([
      expect.objectContaining({
        id: "sess-1",
        title: "Sessao 42",
        campaignName: "Eldoria",
      }),
    ]);
  });

  it("deve salvar campanha, party, personagens e sessoes nas tabelas separadas", async () => {
    const log: Array<{ table: string; action: string; payload?: unknown }> = [];
    supabaseMockState.client = createSaveClient(log);

    await saveCloudRpgData("user-1", {
      version: 1,
      campaign: {
        id: "7e1b0f02-52a0-4f49-9f29-b6ee26c8bc91",
        name: "Eldoria",
        system: "savage_pathfinder",
        createdAtIso: "2026-03-25T00:00:00.000Z",
        role: "mestre",
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
        isRegistered: true,
        partyMemberIds: ["char-1"],
      },
      characters: [
        {
          id: "char-1",
          name: "Thorg",
          system: "savage_pathfinder",
          playerName: "Eduardo",
          class: "Druida",
          ancestry: "Anao",
          edges: 3,
          conviction: 2,
          level: "Novato",
          createdAtIso: "2026-03-25T00:00:00.000Z",
          modules: [],
          stats: { ca: 10, hp: { current: 10, max: 10 }, initiative: 0 },
          attributes: { agility: 6, smarts: 6, spirit: 8, strength: 6, vigor: 6 },
        },
      ],
      sessions: [
        {
          id: "sess-1",
          title: "Sessao 42",
          scheduledAtIso: "2026-03-26T20:00:00.000Z",
          createdAtIso: "2026-03-25T12:00:00.000Z",
          address: "Discord",
          notes: "Resumo",
          campaignName: "Eldoria",
        },
      ],
      notes: {
        campaign: "Notas do mestre",
      },
      social: {
        friends: [],
        groups: [],
      },
    });

    expect(log).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "campaigns", action: "insert" }),
        expect.objectContaining({ table: "characters", action: "upsert" }),
        expect.objectContaining({ table: "character_savage_pathfinder", action: "upsert" }),
        expect.objectContaining({ table: "campaign_members", action: "insert" }),
        expect.objectContaining({ table: "sessions", action: "upsert" }),
      ]),
    );
  });
});
