import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { ROUTES } from "./routes";
import { useAuth } from "../contexts/AuthContext";

const DashboardPage = lazy(() =>
  import("../pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const CharactersPage = lazy(() =>
  import("../pages/CharactersPage").then((module) => ({
    default: module.CharactersPage,
  })),
);
const CharacterSheetPage = lazy(() =>
  import("../pages/CharacterSheetPage").then((module) => ({
    default: module.CharacterSheetPage,
  })),
);
const SessionsPage = lazy(() =>
  import("../pages/SessionsPage").then((module) => ({
    default: module.SessionsPage,
  })),
);
const NotesPage = lazy(() =>
  import("../pages/NotesPage").then((module) => ({
    default: module.NotesPage,
  })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const PublicProfilePage = lazy(() =>
  import("../pages/PublicProfilePage").then((module) => ({
    default: module.PublicProfilePage,
  })),
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

function withSuspense(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="page">
          <div className="card card--span-12">Carregando p&aacute;gina...</div>
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export function RequireAuth(props: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page">
        <div className="card card--span-12">Carregando sessao...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  return <>{props.children}</>;
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={ROUTES.login} replace /> },
      {
        path: ROUTES.dashboard,
        element: withSuspense(
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>,
        ),
      },
      {
        path: ROUTES.characters,
        element: withSuspense(
          <RequireAuth>
            <CharactersPage />
          </RequireAuth>,
        ),
      },
      {
        path: `${ROUTES.characters}/:id`,
        element: withSuspense(
          <RequireAuth>
            <CharacterSheetPage />
          </RequireAuth>,
        ),
      },
      {
        path: ROUTES.sessions,
        element: withSuspense(
          <RequireAuth>
            <SessionsPage />
          </RequireAuth>,
        ),
      },
      {
        path: ROUTES.notes,
        element: withSuspense(
          <RequireAuth>
            <NotesPage />
          </RequireAuth>,
        ),
      },
      {
        path: ROUTES.publicProfile(":id"),
        element: withSuspense(
          <RequireAuth>
            <PublicProfilePage />
          </RequireAuth>,
        ),
      },
      { path: ROUTES.login, element: withSuspense(<SettingsPage />) },
      { path: ROUTES.settings, element: <Navigate to={ROUTES.login} replace /> },
      {
        path: "*",
        element: withSuspense(
          <RequireAuth>
            <NotFoundPage />
          </RequireAuth>,
        ),
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});
