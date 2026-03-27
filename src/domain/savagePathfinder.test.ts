import {
  SAVAGE_PATHFINDER_SYSTEM,
  defaultLevelForSystem,
  formatLevel,
  isSavagePathfinder,
  savagePathfinderRanks,
} from "./savagePathfinder";

describe("savagePathfinder domain helpers", () => {
  it("deve identificar sistema savage pathfinder ignorando espacos e caixa", () => {
    expect(isSavagePathfinder("  SAVAGE_PATHFINDER  ")).toBe(true);
    expect(isSavagePathfinder(SAVAGE_PATHFINDER_SYSTEM)).toBe(true);
    expect(isSavagePathfinder("generic")).toBe(false);
    expect(isSavagePathfinder(undefined)).toBe(false);
  });

  it("deve retornar nivel inicial correto por sistema", () => {
    expect(defaultLevelForSystem("savage_pathfinder")).toBe("Novato");
    expect(defaultLevelForSystem("generic")).toBe(1);
  });

  it("deve formatar nivel para savage pathfinder", () => {
    expect(formatLevel("savage_pathfinder", "Veterano")).toBe("Veterano");
    expect(formatLevel("savage_pathfinder", 2)).toBe("Experiente");
    expect(formatLevel("savage_pathfinder", 99)).toBe("Novato");
    expect(formatLevel("savage_pathfinder", undefined)).toBe("Novato");
  });

  it("deve formatar nivel numerico para sistemas genericos", () => {
    expect(formatLevel("generic", 7)).toBe("7");
    expect(formatLevel("generic", undefined)).toBe("1");
    expect(savagePathfinderRanks).toContain("Heroico");
  });
});

