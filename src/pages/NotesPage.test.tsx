import { fireEvent, render, screen } from "@testing-library/react";
import { NotesPage } from "./NotesPage";
import { RpgDataContext } from "../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../test/rpgDataTestUtils";

function renderNotesPage({
  notes = "Resumo inicial",
  actions = createMockActions(),
}: {
  notes?: string;
  actions?: ReturnType<typeof createMockActions>;
} = {}) {
  const data = createBaseRpgData({
    notes: { campaign: notes },
  });

  return render(
    <RpgDataContext.Provider value={{ data, actions }}>
      <NotesPage />
    </RpgDataContext.Provider>,
  );
}

describe("NotesPage", () => {
  it("deve renderizar texto atual das notas da campanha", () => {
    renderNotesPage({ notes: "Resumo da ultima sessao" });

    expect(screen.getByRole("textbox")).toHaveValue("Resumo da ultima sessao");
  });

  it("deve chamar setCampaignNotes ao editar o conteudo", () => {
    const actions = createMockActions();
    renderNotesPage({ actions });

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Nova anotacao" } });

    expect(actions.setCampaignNotes).toHaveBeenCalledWith("Nova anotacao");
  });

  it("deve indicar salvamento automatico na tela", () => {
    renderNotesPage();
    expect(screen.getByText(/Salva automaticamente/i)).toBeInTheDocument();
  });
});
