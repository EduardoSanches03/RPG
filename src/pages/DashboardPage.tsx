import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../app/routes";
import { IconClock, IconMapPin, IconSparkles } from "../app/shell/icons";
import { useRpgData } from "../store/RpgDataContext";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function countdownParts(targetIso: string) {
  const distance = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { days, hours, minutes };
}

function hpRatio(current: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function manaRatio(base: number) {
  return Math.max(8, Math.min(100, Math.round((base / 12) * 100)));
}

function classTone(value?: string) {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("wizard") || normalized.includes("mago")) return "arcane";
  if (normalized.includes("rogue") || normalized.includes("ladino")) return "shadow";
  if (normalized.includes("paladin") || normalized.includes("cleric")) return "radiant";
  return "steel";
}

export function DashboardPage() {
  const { data } = useRpgData();

  const nextSession = useMemo(() => {
    if (!data.sessions.length) return null;
    const sorted = [...data.sessions].sort(
      (a, b) => new Date(a.scheduledAtIso).getTime() - new Date(b.scheduledAtIso).getTime(),
    );
    const upcoming = sorted.find(
      (session) => new Date(session.scheduledAtIso).getTime() >= Date.now(),
    );
    return upcoming ?? sorted[0];
  }, [data.sessions]);

  const countdown = useMemo(() => {
    if (!nextSession) return { days: 0, hours: 0, minutes: 0 };
    return countdownParts(nextSession.scheduledAtIso);
  }, [nextSession]);

  const roster = useMemo(() => {
    const partyIds = data.campaign.partyMemberIds ?? [];
    const partySet = new Set(partyIds);
    const linked = data.characters.filter((character) => partySet.has(character.id));
    const source = linked.length > 0 ? linked : data.characters;
    return source.slice(0, 4);
  }, [data.campaign.partyMemberIds, data.characters]);
  const summary = useMemo(() => {
    const raw = (data.notes.campaign || "").trim();
    if (!raw) return "Nenhum resumo registrado. Abra Notas e escreva os eventos da ultima sessao.";
    if (raw.length <= 320) return raw;
    return `${raw.slice(0, 320)}...`;
  }, [data.notes.campaign]);

  return (
    <div className="page ledger-dashboard">
      <div className="ledger-dashboard-grid">
        <section className="card ledger-hero-card">
          <div className="ledger-hero-art" aria-hidden="true" />
          <div className="ledger-hero-content">
            <p className="ledger-kicker">A TAVERNA</p>
            <h1 className="ledger-hero-title">{data.campaign.name || "Sombras sobre Eldoria"}</h1>
            <p className="ledger-hero-location">
              <IconMapPin size={14} />
              Torre de Obsidiana, Regiao Central
            </p>
          </div>
        </section>

        <aside className="card ledger-countdown-card">
          <p className="ledger-kicker ledger-kicker--violet">
            <IconSparkles size={12} />
            PROXIMA SESSAO
          </p>
          <div className="ledger-countdown">
            <div>
              <strong>{String(countdown.days).padStart(2, "0")}</strong>
              <span>DIAS</span>
            </div>
            <div>
              <strong>{String(countdown.hours).padStart(2, "0")}</strong>
              <span>HORAS</span>
            </div>
            <div>
              <strong>{String(countdown.minutes).padStart(2, "0")}</strong>
              <span>MIN</span>
            </div>
          </div>

          <div className="ledger-session-info">
            <div>
              <span>Data</span>
              <strong>{nextSession ? formatDate(nextSession.scheduledAtIso) : "--"}</strong>
            </div>
            <div>
              <span>Hora</span>
              <strong>{nextSession ? formatTime(nextSession.scheduledAtIso) : "--"}</strong>
            </div>
          </div>
        </aside>

        <section className="card ledger-party-card">
          <header className="ledger-section-head">
            <h2>Companhia Vinculada</h2>
            <Link to={ROUTES.characters}>GERENCIAR GRUPO</Link>
          </header>

          <div className="ledger-party-grid">
            {roster.length === 0 ? (
              <div className="ledger-empty-panel">
                Nenhum personagem ainda. Crie o primeiro para formar seu grupo.
              </div>
            ) : (
              roster.map((char) => {
                const hpCurrent = char.stats?.hp?.current ?? 10;
                const hpMax = char.stats?.hp?.max ?? 10;
                const hpPercent = hpRatio(hpCurrent, hpMax);
                const manaPercent = manaRatio(char.attributes?.smarts ?? 4);
                const tone = classTone(char.class);
                return (
                  <article key={char.id} className={`ledger-member-card tone-${tone}`}>
                    <div className="ledger-member-avatar">{char.name.slice(0, 2).toUpperCase()}</div>
                    <div className="ledger-member-main">
                      <h3>{char.name}</h3>
                      <p>
                        {(char.race || "Aventureiro")} · {(char.class || "Andarilho")}
                      </p>
                      <div className="ledger-bars">
                        <div>
                          <span>HP</span>
                          <div className="bar-track">
                            <div className="bar-fill bar-fill--hp" style={{ width: `${hpPercent}%` }} />
                          </div>
                        </div>
                        <div>
                          <span>Mana</span>
                          <div className="bar-track">
                            <div className="bar-fill bar-fill--mana" style={{ width: `${manaPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ledger-member-stats">
                      <div>
                        <small>LVL</small>
                        <strong>{String(char.level ?? 1)}</strong>
                      </div>
                      <div>
                        <small>HP</small>
                        <strong>
                          {hpCurrent}/{hpMax}
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="card ledger-recap-card">
          <header className="ledger-section-head">
            <h2>Resumo da Sessao</h2>
            <Link to={ROUTES.notes}>EDITAR NOTAS</Link>
          </header>

          <div className="ledger-summary-block">
            <p className="ledger-kicker">RESUMO</p>
            <p>{summary}</p>
          </div>

          <div className="ledger-objectives">
            <p className="ledger-kicker">PROXIMOS OBJETIVOS</p>
            <ul>
              <li>Garantir o portao norte antes do anoitecer.</li>
              <li>Rastrear os portadores do relicario no distrito inferior.</li>
              <li>Preparar suprimentos e componentes de ritual.</li>
            </ul>
          </div>

          <Link to={ROUTES.sessions} className="ledger-recap-link">
            <IconClock size={14} />
            Abrir agenda de sessoes
          </Link>
        </section>
      </div>
    </div>
  );
}


