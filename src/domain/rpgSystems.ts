export const RPG_SYSTEM_OPTIONS = [
  { id: "dungeons_dragons", label: "Dungeons & Dragons" },
  { id: "pathfinder", label: "Pathfinder" },
  { id: "savage_worlds", label: "Savage Worlds" },
  { id: "savage_pathfinder", label: "Savage Pathfinder" },
  { id: "call_of_cthulhu", label: "Call of Cthulhu" },
  { id: "vampire_the_masquerade", label: "Vampire: The Masquerade" },
  { id: "cyberpunk_red", label: "Cyberpunk RED" },
  { id: "shadowrun", label: "Shadowrun" },
  { id: "fate_core", label: "Fate Core" },
  { id: "blades_in_the_dark", label: "Blades in the Dark" },
  { id: "powered_by_the_apocalypse", label: "Powered by the Apocalypse" },
  { id: "tormenta_20", label: "Tormenta 20" },
  { id: "gurps", label: "GURPS" },
  { id: "old_dragon", label: "Old Dragon" },
  { id: "ordem_paranormal_rpg", label: "Ordem Paranormal RPG" },
] as const;

export type RpgSystemId = (typeof RPG_SYSTEM_OPTIONS)[number]["id"];

export function getRpgSystemLabel(systemId: string | undefined) {
  const option = RPG_SYSTEM_OPTIONS.find((item) => item.id === systemId);
  return option?.label ?? "Sistema personalizado";
}
