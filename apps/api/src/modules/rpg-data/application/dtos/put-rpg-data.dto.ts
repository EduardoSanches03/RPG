import { z } from "zod";
import { rpgDataPayloadSchema } from "../../domain/value-objects/rpg-data-payload.vo";

export const putRpgDataBodySchema = z.object({
  revision: z.number().int().nonnegative(),
  data: rpgDataPayloadSchema,
});

export type PutRpgDataBodyDto = z.infer<typeof putRpgDataBodySchema>;
