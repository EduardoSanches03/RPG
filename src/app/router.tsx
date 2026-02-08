import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./shell/AppShell";
import { CharactersPage } from "../pages/CharactersPage";
import { CharacterSheetPage } from "../pages/CharacterSheetPage";
import { DashboardPage } from "../pages/DashboardPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { NotesPage } from "../pages/NotesPage";
import { SessionsPage } from "../pages/SessionsPage";
import { SettingsPage } from "../pages/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/characters", element: <CharactersPage /> },
      { path: "/characters/:id", element: <CharacterSheetPage /> },
      { path: "/sessions", element: <SessionsPage /> },
      { path: "/notes", element: <NotesPage /> },
      { path: "/login", element: <SettingsPage /> },
      { path: "/settings", element: <Navigate to="/login" replace /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
