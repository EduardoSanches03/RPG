import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./router";

const authMockState = vi.hoisted(() => ({
  value: {
    user: null as null | { id: string },
    isLoading: false,
  },
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    ...authMockState.value,
    session: null,
    isConfigured: true,
    signUpWithEmail: vi.fn(),
    signInWithEmail: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe("RequireAuth", () => {
  it("deve redirecionar para login quando usuario nao estiver autenticado", () => {
    authMockState.value = {
      user: null,
      isLoading: false,
    };

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <div>Area protegida</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Tela de login")).toBeInTheDocument();
    expect(screen.queryByText("Area protegida")).not.toBeInTheDocument();
  });

  it("deve renderizar conteudo protegido quando usuario estiver autenticado", () => {
    authMockState.value = {
      user: { id: "user-1" },
      isLoading: false,
    };

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <div>Area protegida</div>
              </RequireAuth>
            }
          />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Area protegida")).toBeInTheDocument();
    expect(screen.queryByText("Tela de login")).not.toBeInTheDocument();
  });
});
