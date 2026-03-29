import type { RpgDataV1 } from "../domain/rpg";
import type { RpgDataActions } from "../store/RpgDataContext";

export function createBaseRpgData(overrides?: Partial<RpgDataV1>): RpgDataV1 {
  const baseCampaign = {
    id: "camp-1",
    name: "Minha Campanha",
    system: "savage_pathfinder",
    createdAtIso: "2026-03-24T00:00:00.000Z",
    role: "mestre" as const,
    locale: "pt-BR",
    timeZone: "America/Sao_Paulo",
    isRegistered: true,
    partyMemberIds: [],
  };

  return {
    version: 1,
    campaign: baseCampaign,
    campaigns: [baseCampaign],
    activeCampaignId: baseCampaign.id,
    characters: [],
    sessions: [],
    notes: {
      campaign: "",
      byCampaign: {
        [baseCampaign.id]: "",
      },
    },
    social: {
      friends: [
        {
          id: "friend-1",
          name: "Danielz",
          status: "online",
          activity: "Online",
        },
      ],
      groups: [
        {
          id: "group-1",
          name: "A Taverna - Mesa Principal",
          role: "owner",
          membersCount: 5,
          onlineCount: 2,
          system: "savage_pathfinder",
        },
      ],
      directory: [
        {
          id: "user-1",
          name: "Mestre Arcano",
          handle: "@mestrearcano",
          status: "online",
        },
        {
          id: "user-2",
          name: "Elara Moonwhisper",
          handle: "@elara",
          status: "in_party",
        },
      ],
      requestsSent: [],
    },
    ...overrides,
  };
}

export function createMockActions(
  overrides?: Partial<RpgDataActions>,
): RpgDataActions {
  const base: RpgDataActions = {
    createCampaign: vi.fn(),
    removeCampaign: vi.fn(),
    setActiveCampaign: vi.fn(),
    setCampaignName: vi.fn(),
    setCampaignSystem: vi.fn(),
    registerCampaign: vi.fn(),
    setCampaignPartyMembers: vi.fn(),
    setSocialFriends: vi.fn(),
    sendFriendRequest: vi.fn(),
    setSentFriendRequests: vi.fn(),
    upsertCharacter: vi.fn(),
    removeCharacter: vi.fn(),
    addSession: vi.fn(),
    removeSession: vi.fn(),
    setCampaignNotes: vi.fn(),
    resetToSeed: vi.fn(),
    updateCharacter: vi.fn(),
    updateCharacterStats: vi.fn(),
    updateCharacterAttributes: vi.fn(),
    addCharacterModule: vi.fn(),
    updateCharacterModule: vi.fn(),
    reorderCharacterModule: vi.fn(),
    moveCharacterModuleColumn: vi.fn(),
    setCharacterModulesLayout: vi.fn(),
    removeCharacterModule: vi.fn(),
  };

  return { ...base, ...overrides };
}
