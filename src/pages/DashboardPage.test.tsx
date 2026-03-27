import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Character, Session } from "../domain/rpg";
import { ROUTES } from "../app/routes";
import { DashboardPage } from "./DashboardPage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

function buildCharacter(id: string, name: string): Character {
  return {
    id,
    name,
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
  };
}

function buildSession(id: string, scheduledAtIso: string): Session {
  return {
    id,
    title: `Sessao ${id}`,
    scheduledAtIso,
    createdAtIso: "2026-03-24T00:00:00.000Z",
  };
}

function renderDashboard(
  data = createBaseRpgData(),
  actions = createMockActions(),
) {
  return render(
    <RpgDataContext.Provider value={{ data, actions }}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </RpgDataContext.Provider>,
  );
}

describe("DashboardPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve exibir estados vazios quando nao ha personagens sessoes e resumo", () => {
    renderDashboard(createBaseRpgData({ characters: [], sessions: [], notes: { campaign: "" } }));

    expect(
      screen.getByText(/Nenhum personagem ainda\. Crie o primeiro/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhum resumo registrado\. Abra Notas/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("--")).toHaveLength(2);
  });

  it("deve escolher a proxima sessao futura e exibir data hora e countdown", () => {
    vi.useFakeTimers();
    const now = new Date("2026-03-24T18:00:00.000Z");
    vi.setSystemTime(now);

    const nextSessionIso = "2026-03-25T20:30:00.000Z";
    const data = createBaseRpgData({
      sessions: [
        buildSession("past", "2026-03-20T20:30:00.000Z"),
        buildSession("future-2", "2026-03-29T20:30:00.000Z"),
        buildSession("future-1", nextSessionIso),
      ],
    });

    const { container } = renderDashboard(data);

    const expectedDate = new Date(nextSessionIso).toLocaleDateString("pt-BR", {
      weekday: "short",
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
    const expectedTime = new Date(nextSessionIso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.getByText(expectedTime)).toBeInTheDocument();

    const distanceMs = new Date(nextSessionIso).getTime() - now.getTime();
    const totalSeconds = Math.floor(distanceMs / 1000);
    const expectedDays = String(Math.floor(totalSeconds / 86400)).padStart(2, "0");
    const expectedHours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
    const expectedMinutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");

    const countdownNode = container.querySelector(".ledger-countdown");
    expect(countdownNode).toBeTruthy();
    const strongValues = within(countdownNode as HTMLElement)
      .getAllByText(/\d{2}/)
      .map((node) => node.textContent);

    expect(strongValues).toEqual([expectedDays, expectedHours, expectedMinutes]);
  });

  it("deve limitar roster a quatro personagens truncar resumo e manter links", () => {
    const summary = "A".repeat(350);
    const data = createBaseRpgData({
      characters: [
        buildCharacter("c1", "Alar"),
        buildCharacter("c2", "Kaelen"),
        buildCharacter("c3", "Nyx"),
        buildCharacter("c4", "Thrain"),
        buildCharacter("c5", "Elara"),
      ],
      notes: { campaign: summary },
    });

    renderDashboard(data);

    expect(screen.getByRole("heading", { level: 3, name: "Alar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Kaelen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Nyx" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Thrain" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Elara" }),
    ).not.toBeInTheDocument();

    const truncated = `${summary.slice(0, 320)}...`;
    expect(screen.getByText(truncated)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /GERENCIAR GRUPO/i })).toHaveAttribute(
      "href",
      ROUTES.characters,
    );
    expect(screen.getByRole("link", { name: /EDITAR NOTAS/i })).toHaveAttribute(
      "href",
      ROUTES.notes,
    );
    expect(
      screen.getByRole("link", { name: /Abrir agenda de sessoes/i }),
    ).toHaveAttribute("href", ROUTES.sessions);
  });

  it("deve priorizar membros vinculados na party da campanha", () => {
    const data = createBaseRpgData({
      campaign: {
        id: "camp-1",
        name: "Minha Campanha",
        system: "savage_pathfinder",
        createdAtIso: "2026-03-24T00:00:00.000Z",
        role: "mestre",
        locale: "pt-BR",
        timeZone: "America/Sao_Paulo",
        isRegistered: true,
        partyMemberIds: ["c3", "c1"],
      },
      characters: [
        buildCharacter("c1", "Alar"),
        buildCharacter("c2", "Kaelen"),
        buildCharacter("c3", "Nyx"),
      ],
    });

    renderDashboard(data);

    expect(screen.getByRole("heading", { level: 3, name: "Alar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Nyx" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Kaelen" }),
    ).not.toBeInTheDocument();
  });
});
