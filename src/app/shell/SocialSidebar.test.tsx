import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialSidebar } from "./SocialSidebar";
import { RpgDataContext } from "../../store/RpgDataContext";
import { createBaseRpgData, createMockActions } from "../../test/rpgDataTestUtils";

describe("SocialSidebar", () => {
  it("deve iniciar recolhida e expandir ao clicar na seta", async () => {
    const user = userEvent.setup();
    const data = createBaseRpgData({
      social: {
        friends: [
          { id: "f-1", name: "Danielz", status: "online", activity: "Online" },
          { id: "f-2", name: "Afro Samurai", status: "in_party", activity: "Em partida" },
        ],
        groups: [],
      },
    });

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <MemoryRouter>
          <RpgDataContext.Provider value={{ data, actions: createMockActions() }}>
            <SocialSidebar
              isOpen={isOpen}
              onToggle={() => setIsOpen((prev) => !prev)}
              receivedRequests={[
                {
                  requesterId: "u-10",
                  displayName: "Eduardo Madlito",
                  handle: "@eduardo",
                  sentAtIso: "2026-03-25T00:00:00.000Z",
                  status: "pending",
                },
              ]}
              processingReceivedIds={[]}
              socialFeedback={null}
              onAcceptRequest={() => undefined}
              onRejectRequest={() => undefined}
            />
          </RpgDataContext.Provider>
        </MemoryRouter>
      );
    }

    render(<Harness />);

    const openButton = screen.getByRole("button", { name: /Abrir social/i });
    expect(openButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Danielz")).not.toBeInTheDocument();

    await user.click(openButton);

    expect(screen.getByRole("button", { name: /Recolher social/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Danielz")).toBeInTheDocument();
    expect(screen.getByText("Afro Samurai")).toBeInTheDocument();
    expect(screen.queryByText("Grupos")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Eduardo Madlito" })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Abrir solicitacoes recebidas \(1\)/i }),
    );

    expect(screen.getByRole("heading", { name: "Solicitacoes Recebidas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Eduardo Madlito" })).toHaveAttribute(
      "href",
      "/profiles/u-10",
    );
    expect(screen.getByRole("button", { name: "Aceitar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recusar" })).toBeInTheDocument();
  });
});
