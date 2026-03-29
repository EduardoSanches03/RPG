import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotesPage } from "./NotesPage";
import { ROUTES } from "../app/routes";
import { RpgDataContext } from "../store/RpgDataContext";
import { serializeCampaignBook } from "../domain/campaignBook";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";
import type { Session } from "../domain/rpg";

function buildSession(id: string, title: string, scheduledAtIso: string): Session {
  return {
    id,
    title,
    scheduledAtIso,
    createdAtIso: scheduledAtIso,
    campaignId: "camp-1",
  };
}

function renderNotesPage({
  notes = "Resumo inicial",
  actions = createMockActions(),
  sessions = [],
}: {
  notes?: string;
  actions?: ReturnType<typeof createMockActions>;
  sessions?: Session[];
} = {}) {
  const data = createBaseRpgData({
    sessions,
    notes: {
      campaign: notes,
      byCampaign: {
        "camp-1": notes,
      },
    },
  });

  return render(
    <MemoryRouter>
      <RpgDataContext.Provider value={{ data, actions }}>
        <NotesPage />
      </RpgDataContext.Provider>
    </MemoryRouter>,
  );
}

describe("NotesPage", () => {
  it("deve renderizar texto atual da pagina do livro da campanha", () => {
    renderNotesPage({ notes: "Resumo da ultima sessao" });

    expect(screen.getByLabelText(/Pagina 1 do livro da campanha/i)).toHaveValue(
      "Resumo da ultima sessao",
    );
    expect(screen.getAllByText(/Folio I/i)).not.toHaveLength(0);
  });

  it("deve chamar setCampaignNotes ao editar o conteudo da pagina atual", () => {
    const actions = createMockActions();
    renderNotesPage({ actions });

    const textarea = screen.getByLabelText(/Pagina 1 do livro da campanha/i);
    fireEvent.change(textarea, { target: { value: "Nova anotacao" } });

    expect(actions.setCampaignNotes).toHaveBeenCalledWith("Nova anotacao");
  });

  it("deve folhear paginas existentes e criar a proxima ao avancar no fim do livro", () => {
    const actions = createMockActions();
    renderNotesPage({
      notes: serializeCampaignBook(["Pagina 1", "Pagina 2"]),
      actions,
    });

    expect(screen.getByLabelText(/Pagina 1 do livro da campanha/i)).toHaveValue("Pagina 1");

    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));
    expect(screen.getByLabelText(/Pagina 2 do livro da campanha/i)).toHaveValue("Pagina 2");

    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));
    expect(actions.setCampaignNotes).toHaveBeenCalledWith(
      serializeCampaignBook(["Pagina 1", "Pagina 2", ""]),
    );

    expect(screen.queryByRole("button", { name: /Nova pagina/i })).not.toBeInTheDocument();
  });

  it("deve exibir um indice simples com as tres primeiras paginas e a ultima quando houver mais de cinco", () => {
    renderNotesPage({
      notes: serializeCampaignBook(["P1", "P2", "P3", "P4", "P5", "P6"]),
    });

    expect(screen.getByRole("button", { name: /Ir para pagina 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir para pagina 2/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir para pagina 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir para pagina 6/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ir para pagina 4/i })).not.toBeInTheDocument();
    expect(screen.getByText("...")).toBeInTheDocument();
  });

  it("deve inverter o indice ao avancar para o fim do livro", () => {
    renderNotesPage({
      notes: serializeCampaignBook(["P1", "P2", "P3", "P4", "P5", "P6"]),
    });

    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));
    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));
    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));

    expect(screen.getByRole("button", { name: /Ir para pagina 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir para pagina 4/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir para pagina 5/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir para pagina 6/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ir para pagina 2/i })).not.toBeInTheDocument();
  });

  it("deve permitir inserir um capitulo manualmente na pagina atual", () => {
    const actions = createMockActions();
    renderNotesPage({
      notes: serializeCampaignBook(["Pagina 1", "Pagina 2"]),
      actions,
    });

    fireEvent.change(screen.getByRole("textbox", { name: /Titulo do capitulo da pagina atual/i }), {
      target: { value: "A queda da muralha" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Inserir capitulo/i }));

    expect(actions.setCampaignNotes).toHaveBeenCalledWith(
      serializeCampaignBook({
        pages: ["Pagina 1", "Pagina 2"],
        chapters: [{ pageIndex: 0, title: "A queda da muralha" }],
        sessionLinks: [],
      }),
    );
  });

  it("deve permitir vincular a pagina atual a uma sessao da campanha", () => {
    const actions = createMockActions();
    renderNotesPage({
      notes: serializeCampaignBook(["Pagina 1"]),
      actions,
      sessions: [buildSession("session-1", "Sessao 1", "2026-03-27T20:00:00.000Z")],
    });

    fireEvent.change(screen.getByRole("combobox", { name: /Sessao vinculada a pagina atual/i }), {
      target: { value: "session-1" },
    });

    expect(actions.setCampaignNotes).toHaveBeenCalledWith(
      serializeCampaignBook({
        pages: ["Pagina 1"],
        chapters: [],
        sessionLinks: [{ pageIndex: 0, sessionId: "session-1" }],
      }),
    );
  });

  it("deve manter o capitulo atual no topo ate que um novo comece", () => {
    renderNotesPage({
      notes: serializeCampaignBook({
        pages: ["Pagina 1", "Pagina 2", "Pagina 3"],
        chapters: [
          { pageIndex: 0, title: "A morte do anao" },
          { pageIndex: 2, title: "O retorno do herdeiro" },
        ],
        sessionLinks: [],
      }),
    });

    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));
    expect(screen.getAllByText("A morte do anao")).not.toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Folhear para frente/i }));
    expect(screen.getAllByText("O retorno do herdeiro")).not.toHaveLength(0);
  });

  it("deve usar o indice para abrir a primeira pagina de cada capitulo", () => {
    renderNotesPage({
      notes: serializeCampaignBook({
        pages: ["Pagina 1", "Pagina 2", "Pagina 3"],
        chapters: [
          { pageIndex: 0, title: "A morte do anao" },
          { pageIndex: 2, title: "O retorno do herdeiro" },
        ],
        sessionLinks: [],
      }),
    });

    fireEvent.click(screen.getByRole("tab", { name: /O retorno do herdeiro/i }));

    expect(screen.getByLabelText(/Pagina 3 do livro da campanha/i)).toHaveValue("Pagina 3");
  });

  it("deve indicar quando ainda nao existem sessoes para vincular", () => {
    renderNotesPage({ sessions: [] });
    expect(
      screen.getByText(/Nenhuma sessao cadastrada nesta campanha ainda/i),
    ).toBeInTheDocument();
  });

  it("deve exibir um atalho para a tela de sessoes no card de sessao vinculada", () => {
    renderNotesPage();

    expect(screen.getByRole("link", { name: /Ir para Sessoes|Abrir Sessoes/i })).toHaveAttribute(
      "href",
      ROUTES.sessions,
    );
  });

  it("deve indicar que o salvamento e automatico por campanha", () => {
    renderNotesPage();
    expect(screen.getByText(/Salvamento automatico por campanha/i)).toBeInTheDocument();
  });
});
