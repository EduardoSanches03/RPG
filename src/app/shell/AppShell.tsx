import { NavLink, Outlet } from "react-router-dom";
import { RpgDataProvider } from "../../store/RpgDataProvider";
import {
  IconD20Mark,
  IconCalendar,
  IconCog,
  IconGrid,
  IconNotes,
  IconUsers,
} from "./icons";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: IconGrid },
  { to: "/characters", label: "Personagens", Icon: IconUsers },
  { to: "/sessions", label: "Sessões", Icon: IconCalendar },
  { to: "/notes", label: "Notas", Icon: IconNotes },
  { to: "/settings", label: "Configurações", Icon: IconCog },
];

export function AppShell() {
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
                    isActive
                      ? "topbar__link topbar__link--active"
                      : "topbar__link"
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
