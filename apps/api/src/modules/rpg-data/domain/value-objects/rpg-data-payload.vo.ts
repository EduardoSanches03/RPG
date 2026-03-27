import { z } from "zod";
import { RpgDataInvariantViolationError } from "../errors/rpg-data.errors";

const campaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  system: z.string().min(1),
  createdAtIso: z.string().datetime(),
  role: z.enum(["mestre", "jogador"]).optional(),
  locale: z.string().min(2).optional(),
  timeZone: z.string().min(1).optional(),
  isRegistered: z.boolean().optional(),
  partyMemberIds: z.array(z.string().min(1)).optional(),
});

const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  system: z.string().min(1),
  playerName: z.string().min(1),
  createdAtIso: z.string().datetime(),
  class: z.string().optional(),
  race: z.string().optional(),
  level: z.union([z.number(), z.string()]).optional(),
  ancestry: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  edges: z.number().int().nonnegative().optional(),
  conviction: z.number().int().nonnegative().optional(),
  modules: z.array(z.record(z.string(), z.unknown())),
  stats: z.record(z.string(), z.unknown()).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  avatarUrl: z.string().optional(),
  background: z.string().optional(),
});

const sessionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  scheduledAtIso: z.string().datetime(),
  createdAtIso: z.string().datetime(),
  address: z.string().optional(),
  campaignName: z.string().optional(),
  notes: z.string().optional(),
});

const socialFriendSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["online", "in_party", "offline"]),
  activity: z.string().optional(),
  avatarUrl: z.string().optional(),
});

const socialGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["owner", "member"]),
  membersCount: z.number().int().nonnegative(),
  onlineCount: z.number().int().nonnegative(),
  system: z.string().optional(),
});

export const rpgDataPayloadSchema = z.object({
  version: z.literal(1),
  campaign: campaignSchema,
  characters: z.array(characterSchema),
  sessions: z.array(sessionSchema),
  notes: z.object({
    campaign: z.string(),
  }),
  social: z
    .object({
      friends: z.array(socialFriendSchema),
      groups: z.array(socialGroupSchema),
    })
    .optional(),
});

export type RpgDataPayloadV1 = z.infer<typeof rpgDataPayloadSchema>;

function clonePayload(payload: RpgDataPayloadV1): RpgDataPayloadV1 {
  return {
    ...payload,
    campaign: { ...payload.campaign },
    characters: payload.characters.map((character) => ({
      ...character,
      modules: character.modules.map((entry) => ({ ...entry })),
      stats: character.stats ? { ...character.stats } : undefined,
      attributes: character.attributes ? { ...character.attributes } : undefined,
    })),
    sessions: payload.sessions.map((session) => ({ ...session })),
    notes: { ...payload.notes },
    social: payload.social
      ? {
          friends: payload.social.friends.map((friend) => ({ ...friend })),
          groups: payload.social.groups.map((group) => ({ ...group })),
        }
      : undefined,
  };
}

export class RpgDataPayload {
  private constructor(private readonly value: RpgDataPayloadV1) {}

  static create(payload: RpgDataPayloadV1) {
    const parsed = rpgDataPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RpgDataInvariantViolationError("Payload de RPG data invalido");
    }
    return new RpgDataPayload(clonePayload(parsed.data));
  }

  toPrimitives(): RpgDataPayloadV1 {
    return clonePayload(this.value);
  }
}
