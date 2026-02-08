export const SAVAGE_PATHFINDER_SYSTEM = "savage_pathfinder" as const;

export const savagePathfinderRanks = [
  "Novato",
  "Experiente",
  "Veterano",
  "Heroico",
  "Lendário",
] as const;

export type SavagePathfinderRank = (typeof savagePathfinderRanks)[number];

export function isSavagePathfinder(system: string | undefined) {
  return (system ?? "").trim().toLowerCase() === SAVAGE_PATHFINDER_SYSTEM;
}

export function defaultLevelForSystem(system: string) {
  return isSavagePathfinder(system) ? "Novato" : 1;
}

export function formatLevel(system: string, level: number | SavagePathfinderRank | undefined) {
  if (isSavagePathfinder(system)) {
    if (typeof level === "string") return level;
    if (typeof level === "number") return savagePathfinderRanks[level - 1] ?? "Novato";
    return "Novato";
  }

  return String(level ?? 1);
}

