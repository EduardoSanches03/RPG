export const ROUTES = {
  dashboard: "/dashboard",
  characters: "/characters",
  characterSheet: (id: string) => `/characters/${id}`,
  publicProfile: (id: string) => `/profiles/${id}`,
  sessions: "/sessions",
  notes: "/notes",
  login: "/login",
  settings: "/settings",
} as const;
