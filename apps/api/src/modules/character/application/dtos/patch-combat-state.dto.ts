import { z } from "zod";

export const patchCombatStateSchema = z.object({
  wounds: z.number().int().nonnegative(),
  fatigue: z.number().int().nonnegative(),
  isIncapacitated: z.boolean(),
  powerPointsCurrent: z.number().int().nonnegative(),
  powerPointsMax: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
});

export type PatchCombatStateBodyDto = z.infer<typeof patchCombatStateSchema>;
