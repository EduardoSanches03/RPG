import { ROUTES } from "./routes";

describe("ROUTES", () => {
  it("deve manter caminhos base esperados", () => {
    expect(ROUTES.dashboard).toBe("/dashboard");
    expect(ROUTES.characters).toBe("/characters");
    expect(ROUTES.sessions).toBe("/sessions");
    expect(ROUTES.notes).toBe("/notes");
    expect(ROUTES.login).toBe("/login");
    expect(ROUTES.settings).toBe("/settings");
  });

  it("deve montar rota de ficha de personagem com id", () => {
    expect(ROUTES.characterSheet("abc123")).toBe("/characters/abc123");
  });

  it("deve montar rota de perfil publico com id", () => {
    expect(ROUTES.publicProfile("user-1")).toBe("/profiles/user-1");
  });
});
