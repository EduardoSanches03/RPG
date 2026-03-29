import { useEffect, useMemo, useState } from "react";
import { useRpgData } from "../store/RpgDataContext";
import {
  IconCalendar,
  IconClock,
  IconMapPin,
  IconBook,
  IconNotes,
  IconPlus,
  IconTrash,
} from "../app/shell/icons";

const BR_LOCALE = "pt-BR";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateBr(value: string | Date) {
  return new Date(value).toLocaleDateString(BR_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeBr(value: string | Date) {
  return new Date(value).toLocaleTimeString(BR_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function SessionsPage() {
  const { data, actions } = useRpgData();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [time, setTime] = useState("20:00");
  const [address, setAddress] = useState("");
  const [campaignName, setCampaignName] = useState(data.campaign.name || "");
  const [notes, setNotes] = useState("");

  const canAdd =
    title.trim().length > 0 && date.trim().length > 0 && time.trim().length > 0;

  const sortedSessions = useMemo(() => {
    return [...data.sessions].sort(
      (a, b) =>
        new Date(b.scheduledAtIso).getTime() -
        new Date(a.scheduledAtIso).getTime(),
    );
  }, [data.sessions]);

  useEffect(() => {
    setCampaignName(data.campaign.name || "");
  }, [data.campaign.id, data.campaign.name]);

  function handleAddSession() {
    if (!canAdd) return;

    const scheduledAtIso = new Date(`${date}T${time}`).toISOString();

    actions.addSession({
      title,
      scheduledAtIso,
      address,
      campaignName,
      notes,
    });

    setTitle("");
    setAddress("");
    setNotes("");
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Sessoes</h1>
          <p className="page__subtitle">
            Planeje as proximas sessoes e acompanhe o historico.
          </p>
        </div>
      </header>

      <section className="grid" aria-label="Criar sessao">
        <div className="card card--span-12">
          <div className="section-header" style={{ marginBottom: 20 }}>
            <div className="section-title">
              <IconPlus
                size={18}
                style={{ marginRight: 8, color: "var(--accent)" }}
              />
              Nova Sessao
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 16,
            }}
          >
            <div className="field" style={{ gridColumn: "span 4" }}>
              <div className="label">Titulo da Sessao</div>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: O Resgate do Rei"
              />
            </div>

            <div className="field" style={{ gridColumn: "span 4" }}>
              <div className="label">Agendamento</div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ position: "relative", flex: 3 }}>
                  <IconCalendar
                    size={14}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    className="input"
                    type="date"
                    lang={BR_LOCALE}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ paddingLeft: 32 }}
                  />
                </div>
                <div style={{ position: "relative", flex: 2 }}>
                  <IconClock
                    size={14}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--muted)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    className="input"
                    type="time"
                    lang={BR_LOCALE}
                    step={60}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={{ paddingLeft: 32 }}
                  />
                </div>
              </div>
            </div>

            <div className="field" style={{ gridColumn: "span 4" }}>
              <div className="label">Campanha</div>
              <div style={{ position: "relative" }}>
                <IconBook
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="input"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Nome da campanha"
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <div className="label">Endereco / Link</div>
              <div style={{ position: "relative" }}>
                <IconMapPin
                  size={14}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  className="input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Local fisico ou link do Discord/Roll20"
                  style={{ paddingLeft: 32, width: "100%" }}
                />
              </div>
            </div>

            <div className="field" style={{ gridColumn: "span 12" }}>
              <div className="label">Observacoes e Planejamento</div>
              <textarea
                className="input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O que aconteceu na ultima sessao? O que planejar para esta?"
                style={{
                  resize: "vertical",
                  minHeight: "80px",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              className="button"
              disabled={!canAdd}
              onClick={handleAddSession}
              style={{ padding: "10px 24px" }}
            >
              Criar Sessao
            </button>
          </div>
        </div>

        <div
          className="card card--span-12"
          style={{
            background: "transparent",
            border: "none",
            boxShadow: "none",
            padding: 0,
          }}
        >
          <div className="section-header" style={{ marginBottom: 16 }}>
            <div className="section-title">Historico de Sessoes</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {sortedSessions.length === 0 ? (
              <div
                className="card card--span-12"
                style={{
                  textAlign: "center",
                  padding: 40,
                  color: "var(--muted)",
                }}
              >
                Nenhuma sessao cadastrada ainda.
              </div>
            ) : (
              sortedSessions.map((s) => (
                <div
                  key={s.id}
                  className="card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "default",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--shadow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-soft)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 900,
                          color: "var(--accent)",
                          lineHeight: 1.2,
                        }}
                      >
                        {s.title}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginTop: 6,
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <IconCalendar size={12} />
                          {formatDateBr(s.scheduledAtIso)}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <IconClock size={12} />
                          {formatTimeBr(s.scheduledAtIso)}
                        </span>
                      </div>
                    </div>
                    <button
                      className="button--danger"
                      onClick={() => actions.removeSession(s.id)}
                      style={{
                        padding: 6,
                        minWidth: "auto",
                        height: "auto",
                        borderRadius: "50%",
                        opacity: 0.6,
                        transition: "opacity 0.2s",
                        border: "none",
                        background: "rgba(255, 90, 102, 0.1)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.6")
                      }
                      title="Remover"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {s.campaignName && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: "0.75rem",
                          padding: "4px 10px",
                          background: "rgba(210, 59, 59, 0.1)",
                          borderRadius: 99,
                          color: "var(--accent-2)",
                          border: "1px solid rgba(210, 59, 59, 0.2)",
                        }}
                      >
                        <IconBook size={12} />
                        {s.campaignName}
                      </div>
                    )}
                    {s.address && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: "0.75rem",
                          padding: "4px 10px",
                          background: "rgba(255, 255, 255, 0.05)",
                          borderRadius: 99,
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <IconMapPin size={12} />
                        {s.address}
                      </div>
                    )}
                  </div>

                  {s.notes && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: "12px",
                        background: "var(--panel-2)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        color: "var(--text)",
                        lineHeight: 1.5,
                        borderLeft: "3px solid var(--accent)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 6,
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          color: "var(--muted)",
                        }}
                      >
                        <IconNotes size={10} />
                        Notas da Sessao
                      </div>
                      {s.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

