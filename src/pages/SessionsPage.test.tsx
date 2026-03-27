import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionsPage } from "./SessionsPage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

function renderSessionsPage({
  data = createBaseRpgData(),
  actions = createMockActions(),
}: {
  data?: ReturnType<typeof createBaseRpgData>;
  actions?: ReturnType<typeof createMockActions>;
} = {}) {
  return render(
    <RpgDataContext.Provider value={{ data, actions }}>
      <SessionsPage />
    </RpgDataContext.Provider>,
  );
}

describe("SessionsPage", () => {
  it("deve iniciar com botao de criacao desabilitado e habilitar ao preencher titulo", async () => {
    const user = userEvent.setup();
    renderSessionsPage();

    const createButton = screen.getByRole("button", { name: /Criar Sessao/i });
    expect(createButton).toBeDisabled();

    const titleInput = screen.getByPlaceholderText(/Ex: O Resgate do Rei/i);
    await user.type(titleInput, "Sessao 42");

    expect(createButton).toBeEnabled();
  });

  it("deve manter botao desabilitado quando titulo tiver apenas espacos", async () => {
    const user = userEvent.setup();
    renderSessionsPage();

    const createButton = screen.getByRole("button", { name: /Criar Sessao/i });
    const titleInput = screen.getByPlaceholderText(/Ex: O Resgate do Rei/i);

    await user.type(titleInput, "   ");

    expect(createButton).toBeDisabled();
  });

  it("deve chamar addSession com payload completo e limpar campos apos criar", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    const data = createBaseRpgData({
      campaign: {
        id: "camp-1",
        name: "A Taverna",
        system: "savage_pathfinder",
        createdAtIso: "2026-03-24T00:00:00.000Z",
      },
    });
    const { container } = renderSessionsPage({ data, actions });

    const titleInput = screen.getByPlaceholderText(/Ex: O Resgate do Rei/i);
    const campaignInput = screen.getByPlaceholderText(/Nome da campanha/i);
    const addressInput = screen.getByPlaceholderText(/Discord\/Roll20/i);
    const notesInput = screen.getByPlaceholderText(/O que aconteceu na ultima sessao/i);
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;

    await user.clear(titleInput);
    await user.type(titleInput, "Sessao de Teste");
    await user.clear(campaignInput);
    await user.type(campaignInput, "Campanha de Teste");
    await user.type(addressInput, "Discord");
    await user.type(notesInput, "Planejamento");

    fireEvent.change(dateInput, { target: { value: "2026-03-24" } });
    fireEvent.change(timeInput, { target: { value: "20:15" } });

    await user.click(screen.getByRole("button", { name: /Criar Sessao/i }));

    expect(actions.addSession).toHaveBeenCalledTimes(1);
    expect(actions.addSession).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sessao de Teste",
        address: "Discord",
        campaignName: "Campanha de Teste",
        notes: "Planejamento",
      }),
    );

    const payload = vi.mocked(actions.addSession).mock.calls[0][0];
    expect(Number.isNaN(Date.parse(payload.scheduledAtIso))).toBe(false);

    expect(titleInput).toHaveValue("");
    expect(addressInput).toHaveValue("");
    expect(notesInput).toHaveValue("");
    expect(campaignInput).toHaveValue("Campanha de Teste");
  });

  it("deve exibir historico ordenado por data decrescente", () => {
    const data = createBaseRpgData({
      sessions: [
        {
          id: "s-old",
          title: "Sessao Antiga",
          scheduledAtIso: "2026-03-10T12:00:00.000Z",
          createdAtIso: "2026-03-01T00:00:00.000Z",
        },
        {
          id: "s-new",
          title: "Sessao Nova",
          scheduledAtIso: "2026-03-24T12:00:00.000Z",
          createdAtIso: "2026-03-02T00:00:00.000Z",
        },
      ],
    });

    renderSessionsPage({ data });

    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards[0]).toHaveTextContent("Sessao Nova");
    expect(cards[1]).toHaveTextContent("Sessao Antiga");

    expect(screen.getByText(/24\/03\/2026/)).toBeInTheDocument();
  });

  it("deve exibir data e horario no padrao pt-BR", () => {
    const scheduledAtIso = "2026-03-24T20:15:00-03:00";
    const data = createBaseRpgData({
      sessions: [
        {
          id: "s-ptbr",
          title: "Sessao PTBR",
          scheduledAtIso,
          createdAtIso: "2026-03-20T00:00:00.000Z",
        },
      ],
    });

    renderSessionsPage({ data });

    const expectedDate = new Date(scheduledAtIso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const expectedTime = new Date(scheduledAtIso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it("deve chamar removeSession ao remover item do historico", async () => {
    const user = userEvent.setup();
    const actions = createMockActions();
    const data = createBaseRpgData({
      sessions: [
        {
          id: "s-1",
          title: "Sessao Removivel",
          scheduledAtIso: "2026-03-24T12:00:00.000Z",
          createdAtIso: "2026-03-20T00:00:00.000Z",
        },
      ],
    });

    renderSessionsPage({ data, actions });

    const card = screen.getByRole("heading", { name: "Sessao Removivel", level: 3 }).closest(".card");
    expect(card).toBeTruthy();
    const removeButton = within(card as HTMLElement).getByTitle("Remover");

    await user.click(removeButton);
    expect(actions.removeSession).toHaveBeenCalledWith("s-1");
  });
});
