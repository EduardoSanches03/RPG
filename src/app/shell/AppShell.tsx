import { useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import { RpgDataProvider } from "../../store/RpgDataProvider";
import {
  IconD20Mark,
  IconCalendar,
  IconCog,
  IconGrid,
  IconNotes,
  IconUsers,
} from "./icons";

export function AppShell() {
  return (
    <AuthProvider>
      <AppShellContent />
    </AuthProvider>
  );
}

function AppShellContent() {
  const { user } = useAuth();

  const userLabel = useMemo(() => {
    const metaName = (user?.user_metadata as any)?.name;
    if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
    const email = user?.email ?? "";
    if (!email) return "Login";
    return email.split("@")[0] || email;
  }, [user]);

  const navItems = useMemo(() => {
    return [
      { to: "/dashboard", label: "Dashboard", Icon: IconGrid },
      { to: "/characters", label: "Personagens", Icon: IconUsers },
      { to: "/sessions", label: "Sessões", Icon: IconCalendar },
      { to: "/notes", label: "Notas", Icon: IconNotes },
      { to: "/login", label: user ? userLabel : "Login", Icon: IconCog },
    ];
  }, [user, userLabel]);

  return (
    <RpgDataProvider>
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar__inner">
            <div className="topbar__brand" aria-label="RPG">
              <span className="topbar__mark" aria-hidden="true">
                <IconD20Mark />
              </span>
              <span className="topbar__title">RPG</span>
            </div>

            <nav className="topbar__nav" aria-label="Navegação">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "topbar__link topbar__link--active" : "topbar__link"
                  }
                  title={item.label}
                  aria-label={item.label}
                >
                  <span className="topbar__icon" aria-hidden="true">
                    <item.Icon />
                  </span>
                  <span className="topbar__label">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </RpgDataProvider>
  );
}
