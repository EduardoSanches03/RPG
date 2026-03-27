import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { Character } from "../domain/rpg";
import { CharactersPage } from "./CharactersPage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

function buildCharacter(overrides?: Partial<Character>): Character {
  return {
    id: "char-1",
    name: "Thorg",
    system: "savage_pathfinder",
    playerName: "Jogador",
    class: "Druida",
    race: "Humano",
    ancestry: "Anao",
    level: "Novato",
    createdAtIso: "2026-03-24T00:00:00.000Z",
    stats: {
      ca: 10,
      hp: { current: 10, max: 10 },
      initiative: 0,
      pace: 6,
      parry: 6,
      toughness: 8,
      fatigue: 1,
      wounds: 2,
      isIncapacitated: false,
    },
    attributes: {
      agility: 6,
      smarts: 6,
      spirit: 6,
      strength: 6,
      vigor: 6,
    },
    modules: [
      {
        id: "m-pp",
        type: "power_points",
        system: "savage_pathfinder",
        data: { current: 6, max: 10 },
      },
    ],
    ...overrides,
  };
}

function renderCharactersPage({
  characters = [buildCharacter()],
  actions = createMockActions(),
}: {
  characters?: Character[];
  actions?: ReturnType<typeof createMockActions>;
} = {}) {
  const data = createBaseRpgData({ characters });
  return render(
    <RpgDataContext.Provider value={{ data, actions }}>
      <MemoryRouter>
        <CharactersPage />
      </MemoryRouter>
    </RpgDataContext.Provider>,
  );
}

describe("CharactersPage", () => {
  it("deve listar personagens em ordem alfabetica e exibir campos de savage", () => {
    const { container } = renderCharactersPage({
      characters: [
        buildCharacter({ id: "c-2", name: "Zed" }),
        buildCharacter({ id: "c-1", name: "Alar" }),
      ],
    });

    const titles = Array.from(
      container.querySelectorAll(".ledger-roster-card h2"),
    ).map((node) => node.textContent);
    expect(titles).toEqual(["Alar", "Zed"]);

    expect(screen.getAllByText("Fadiga").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ferimentos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pontos de Poder").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MOV").length).toBeGreaterThan(0);
    expect(screen.getAllByText("APARAR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("RESIST.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Energia")).not.toBeInTheDocument();
  });

  it("deve abrir modal e criar personagem savage com campos especificos", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderCharactersPage({ actions });

    await user.click(
      screen.getByRole("button", { name: /ADICIONAR PERSONAGEM/i }),
    );

    expect(
      screen.getByRole("heading", { name: /Recrutar Novo Personagem/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Sistema/i)).toHaveFocus();

    await user.type(
      screen.getByPlaceholderText(/Kaelen Passo Sombrio/i),
      "  Thorg, Olho Quebrado  ",
    );
    await user.type(screen.getByPlaceholderText(/Ex: Ana/i), "  Jogador 1  ");
    await user.type(screen.getByPlaceholderText(/Ex: Druida/i), "  Druida  ");
    await user.type(screen.getByPlaceholderText(/Ex: An.o/i), "  Anao  ");
    await user.type(screen.getByPlaceholderText(/Ex: 1,82m/i), " 1,78m ");
    await user.type(screen.getByPlaceholderText(/Ex: 86kg/i), " 82kg ");
    await user.clear(screen.getByLabelText(/Benes/i));
    await user.type(screen.getByLabelText(/Benes/i), "3");
    await user.clear(screen.getByLabelText(/Conviccao/i));
    await user.type(screen.getByLabelText(/Conviccao/i), "2");

    await user.click(screen.getByRole("button", { name: /Criar Ficha/i }));

    expect(actions.upsertCharacter).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Thorg, Olho Quebrado",
        system: "savage_pathfinder",
        playerName: "Jogador 1",
        class: "Druida",
        ancestry: "Anao",
        height: "1,78m",
        weight: "82kg",
        edges: 3,
        conviction: 2,
      }),
    );

    expect(
      screen.queryByRole("heading", { name: /Recrutar Novo Personagem/i }),
    ).not.toBeInTheDocument();
  });

  it("deve trocar campos de cadastro quando sistema nao for savage pathfinder", async () => {
    const user = userEvent.setup();
    renderCharactersPage();

    await user.click(
      screen.getByRole("button", { name: /ADICIONAR PERSONAGEM/i }),
    );

    await user.selectOptions(screen.getByLabelText(/Sistema/i), "pathfinder");

    expect(screen.getByLabelText(/Raca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nivel/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Ancestralidade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Benes/i)).not.toBeInTheDocument();
  });

  it("deve manter criacao desabilitada sem nome", async () => {
    const user = userEvent.setup();
    renderCharactersPage();

    await user.click(
      screen.getByRole("button", { name: /ADICIONAR PERSONAGEM/i }),
    );

    const createButton = screen.getByRole("button", { name: /Criar Ficha/i });
    expect(createButton).toBeDisabled();
  });

  it("deve remover personagem quando confirmacao for aceita", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderCharactersPage({ actions });

    await user.click(screen.getByTitle("Remover personagem"));

    expect(confirmSpy).toHaveBeenCalledWith("Remover Thorg?");
    expect(actions.removeCharacter).toHaveBeenCalledWith("char-1");
  });

  it("nao deve remover personagem quando confirmacao for cancelada", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    renderCharactersPage({ actions });

    await user.click(screen.getByTitle("Remover personagem"));

    expect(confirmSpy).toHaveBeenCalledWith("Remover Thorg?");
    expect(actions.removeCharacter).not.toHaveBeenCalled();
  });

  it("deve mostrar placeholder de NPC ao trocar para aba NPCS", async () => {
    const user = userEvent.setup();
    renderCharactersPage();

    const npcTab = screen.getByRole("tab", { name: "NPCS" });
    await user.click(npcTab);

    expect(npcTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Arquivo de NPCs")).toBeInTheDocument();
    expect(screen.getByText("EM BREVE")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Thorg" }),
    ).not.toBeInTheDocument();
  });

  it("deve abrir modal pelo card de recrutamento", () => {
    renderCharactersPage();

    const recruitCardButton = screen.getByRole("button", {
      name: /Recrutar Aventureiro/i,
    });
    fireEvent.click(recruitCardButton);

    const modal = screen.getByRole("heading", {
      name: /Recrutar Novo Personagem/i,
    });
    expect(modal).toBeInTheDocument();
    expect(within(recruitCardButton).getByText(/Comece uma nova jornada/i)).toBeInTheDocument();
  });
});
