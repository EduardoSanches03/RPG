import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { Character, CharacterModule } from "../domain/rpg";
import { CharacterSheetPage } from "./CharacterSheetPage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

vi.mock("../components/ReferenceSidebar", () => ({
  ReferenceSidebar: () => null,
}));

function moduleOf(
  id: string,
  type: CharacterModule["type"],
  data?: Record<string, unknown>,
): CharacterModule {
  return { id, type, system: "savage_pathfinder", data };
}

function buildCharacter(overrides?: Partial<Character>): Character {
  return {
    id: "char-1",
    name: "Thorg",
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
    modules: [
      moduleOf("m-combat", "combat_stats"),
      moduleOf("m-attr", "attributes"),
      moduleOf("m-skills", "skills", { skills: [] }),
      moduleOf("m-hind", "hindrances", { hindrances: [] }),
      moduleOf("m-ancestral", "ancestral_abilities", { ancestral_abilities: [] }),
      moduleOf("m-edges", "edges_advancements", { edges: [], advancements: {} }),
      moduleOf("m-equip", "equipment", { baseGold: 0, items: [] }),
      moduleOf("m-pp", "power_points", { current: 5, max: 10 }),
      moduleOf("m-powers", "powers", {
        powers: [
          {
            id: "p-1",
            name: "Raio",
            powerPoints: 2,
            range: "12",
            duration: "Instantaneo",
            effect: "Teste",
          },
        ],
      }),
      moduleOf("m-weapons", "weapons", { weapons: [] }),
    ],
    ...overrides,
  };
}

function renderSheet({
  route = "/characters/char-1",
  characters = [buildCharacter()],
  actions = createMockActions(),
}: {
  route?: string;
  characters?: Character[];
  actions?: ReturnType<typeof createMockActions>;
} = {}) {
  const data = createBaseRpgData({ characters });
  return render(
    <RpgDataContext.Provider value={{ data, actions }}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/characters/:id" element={<CharacterSheetPage />} />
          <Route path="/characters" element={<div>LISTA PERSONAGENS</div>} />
        </Routes>
      </MemoryRouter>
    </RpgDataContext.Provider>,
  );
}

describe("CharacterSheetPage", () => {
  it("deve redirecionar para lista quando personagem nao existe", async () => {
    renderSheet({ route: "/characters/inexistente", characters: [] });
    await waitFor(() => {
      expect(screen.getByText("LISTA PERSONAGENS")).toBeInTheDocument();
    });
  });

  it("deve renderizar secoes dos modulos principais", () => {
    renderSheet();

    expect(screen.getByText("COMBATE")).toBeInTheDocument();
    expect(screen.getByText("ATRIBUTOS")).toBeInTheDocument();
    expect(screen.getByText("PERÍCIAS")).toBeInTheDocument();
    expect(screen.getByText("COMPLICAÇÕES")).toBeInTheDocument();
    expect(screen.getByText("HABILIDADES ANCESTRAIS")).toBeInTheDocument();
    expect(screen.getByText("VANTAGENS E PROGRESSOS")).toBeInTheDocument();
    expect(screen.getByText("EQUIPAMENTO")).toBeInTheDocument();
    expect(screen.getByText("PONTOS DE PODER")).toBeInTheDocument();
    expect(screen.getByText("PODERES")).toBeInTheDocument();
    expect(screen.getByText("ARMAS")).toBeInTheDocument();
  });

  it("deve adicionar modulo pelo menu flutuante", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    await user.click(screen.getByRole("button", { name: /Adicionar Módulo/i }));
    await user.click(screen.getByRole("button", { name: /Armas/i }));

    expect(actions.addCharacterModule).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({
        type: "weapons",
        system: "savage_pathfinder",
      }),
    );
  });

  it("deve remover modulo pela acao de modulo", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    const removeButtons = screen.getAllByTitle(/Remover m/i);
    await user.click(removeButtons[0]);

    expect(actions.removeCharacterModule).toHaveBeenCalledWith("char-1", "m-combat");
  });

  it("deve atualizar estado incapacitado no modulo de combate", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    await user.click(screen.getByText("INC"));

    expect(actions.updateCharacterStats).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({
        isIncapacitated: true,
      }),
    );
  });

  it("deve exibir atributos de combate para savage pathfinder", () => {
    renderSheet();

    expect(screen.getByText("MOVIMENTO")).toBeInTheDocument();
    expect(screen.getByText("APARAR")).toBeInTheDocument();
    expect(screen.getByText(/RESIST/i)).toBeInTheDocument();
  });

  it("deve atualizar fadiga e ferimentos pelas trilhas de dano", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    const fatigueTrack = screen.getByText("FADIGA").closest(".damage-track");
    const woundsTrack = screen.getByText("FERIMENTOS").closest(".damage-track");
    expect(fatigueTrack).toBeTruthy();
    expect(woundsTrack).toBeTruthy();

    await user.click(within(fatigueTrack as HTMLElement).getByText("-1"));
    await user.click(within(woundsTrack as HTMLElement).getByText("-2"));

    expect(actions.updateCharacterStats).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({
        fatigue: 1,
      }),
    );

    expect(actions.updateCharacterStats).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({
        wounds: 2,
      }),
    );
  });

  it("deve atualizar movimento aparar e resistencia em modo edicao", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    const combatCard = screen.getByText("COMBATE").closest(".card");
    expect(combatCard).toBeTruthy();

    await user.click(within(combatCard as HTMLElement).getByTitle("Editar"));

    const editPanel = (combatCard as HTMLElement).querySelector(".edit-panel");
    expect(editPanel).toBeTruthy();

    const [paceInput, parryInput, toughnessInput] = within(
      editPanel as HTMLElement,
    ).getAllByRole("spinbutton");
    expect(paceInput).toBeTruthy();
    expect(parryInput).toBeTruthy();
    expect(toughnessInput).toBeTruthy();

    fireEvent.change(paceInput as HTMLInputElement, {
      target: { value: "8" },
    });
    fireEvent.change(parryInput as HTMLInputElement, {
      target: { value: "7" },
    });
    fireEvent.change(toughnessInput as HTMLInputElement, {
      target: { value: "10" },
    });

    expect(actions.updateCharacterStats).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({ pace: 8 }),
    );
    expect(actions.updateCharacterStats).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({ parry: 7 }),
    );
    expect(actions.updateCharacterStats).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({ toughness: 10 }),
    );
  });

  it("deve salvar notas de modulo via updateCharacterModule", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    const combatCard = screen.getByText("COMBATE").closest(".card");
    expect(combatCard).toBeTruthy();

    await user.click(within(combatCard as HTMLElement).getByTitle("Notas"));
    fireEvent.change(screen.getByPlaceholderText(/Observa/i), {
      target: { value: "Anotacao importante" },
    });

    expect(actions.updateCharacterModule).toHaveBeenCalledWith(
      "char-1",
      "m-combat",
      expect.objectContaining({
        notes: "Anotacao importante",
      }),
    );
  });

  it("deve atualizar atributo ao clicar no dado no modulo atributos", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    const attributesCard = screen.getByText("ATRIBUTOS").closest(".card");
    expect(attributesCard).toBeTruthy();

    const d12Buttons = within(attributesCard as HTMLElement).getAllByTitle("d12");
    await user.click(d12Buttons[0]);

    expect(actions.updateCharacterAttributes).toHaveBeenCalledWith(
      "char-1",
      expect.objectContaining({
        agility: 12,
      }),
    );
  });

  it("deve gastar pontos de poder no modulo poderes", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    renderSheet({ actions });

    const powersCard = screen.getByText("PODERES").closest(".card");
    expect(powersCard).toBeTruthy();

    const spendButton = within(powersCard as HTMLElement).getByTitle(/Gastar 2 PP/i);
    await user.click(spendButton);

    expect(actions.updateCharacterModule).toHaveBeenCalledWith(
      "char-1",
      "m-pp",
      expect.objectContaining({
        data: expect.objectContaining({
          current: 3,
          max: 10,
        }),
      }),
    );
  });

  it(
    "deve exibir tag adicionado no menu e manter bloco de texto desabilitado",
    () => {
    renderSheet();

    fireEvent.click(screen.getByRole("button", { name: /Adicionar M.dulo/i }));

    expect(screen.getAllByText("Adicionado").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Bloco de Texto/i }),
    ).toBeDisabled();
    },
    15000,
  );

  it("deve desabilitar gasto de poder quando nao existe modulo de pontos de poder", () => {
    const base = buildCharacter();
    const characterWithoutPowerPoints = buildCharacter({
      modules: base.modules.filter((module) => module.type !== "power_points"),
    });

    renderSheet({ characters: [characterWithoutPowerPoints] });

    const powersCard = screen.getByText("PODERES").closest(".card");
    expect(powersCard).toBeTruthy();

    const spendButton = within(powersCard as HTMLElement).getByTitle(/PP.*encontrado/i);
    expect(spendButton).toBeDisabled();
  });
});
