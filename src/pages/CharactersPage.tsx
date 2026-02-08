import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconPlus, IconTrash, IconUser } from "../app/shell/icons";
import {
  defaultLevelForSystem,
  isSavagePathfinder,
  formatLevel,
  savagePathfinderRanks,
  type SavagePathfinderRank,
} from "../domain/savagePathfinder";
import { useRpgData } from "../store/RpgDataContext";

export function CharactersPage() {
  const { data, actions } = useRpgData();
  const navigate = useNavigate();

  // Estado do modal de criação
  const [isCreating, setIsCreating] = useState(false);
  const [newSystem] = useState("savage_pathfinder");
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newRace, setNewRace] = useState("");
  const [newLevel, setNewLevel] = useState<number | SavagePathfinderRank>(
    defaultLevelForSystem("savage_pathfinder"),
  );

  const rows = useMemo(() => {
    return [...data.characters].sort((a, b) => a.name.localeCompare(b.name));
  }, [data.characters]);

  function handleCreate() {
    if (!newName.trim()) return;
    actions.upsertCharacter({
      name: newName,
      system: newSystem,
      playerName: "", // Removido da UI, padrão vazio
      class: newClass,
      race: newRace,
      level: newLevel,
    });
    setIsCreating(false);
    setNewName("");
    setNewClass("");
    setNewRace("");
    setNewLevel(defaultLevelForSystem(newSystem));
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Personagens</h1>
          <p className="page__subtitle">Gerencie as fichas dos heróis.</p>
        </div>
        <button className="button" onClick={() => setIsCreating(true)}>
          <IconPlus style={{ marginRight: 8 }} />
          Novo Personagem
        </button>
      </header>

      {isCreating && (
        <div className="modal-backdrop">
          <div className="modal">
            <header className="modal-header">
              <h2>Nova Ficha</h2>
              <div className="badge badge--accent">Savage Pathfinder</div>
            </header>

            <div className="field">
              <label className="label">Nome do Personagem</label>
              <input
                className="input input--lg"
                autoFocus
                placeholder="Ex: Valeros, o Guerreiro"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
            >
              <div className="field">
                <label className="label">Classe</label>
                <input
                  className="input"
                  placeholder="Guerreiro"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Raça</label>
                <input
                  className="input"
                  placeholder="Humano"
                  value={newRace}
                  onChange={(e) => setNewRace(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Nível</label>
                {isSavagePathfinder(newSystem) ? (
                  <select
                    className="input"
                    value={typeof newLevel === "string" ? newLevel : "Novato"}
                    onChange={(e) =>
                      setNewLevel(e.target.value as SavagePathfinderRank)
                    }
                  >
                    {savagePathfinderRanks.map((rank) => (
                      <option key={rank} value={rank}>
                        {rank}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    className="input"
                    min={1}
                    value={typeof newLevel === "number" ? newLevel : 1}
                    onChange={(e) => setNewLevel(Number(e.target.value))}
                  />
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="button button--ghost"
                onClick={() => setIsCreating(false)}
              >
                Cancelar
              </button>
              <button
                className="button button--primary"
                onClick={handleCreate}
                disabled={!newName.trim()}
              >
                Criar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid">
        {rows.length === 0 ? (
          <div
            className="card card--span-12"
            style={{ textAlign: "center", padding: 40 }}
          >
            <p style={{ color: "var(--muted)" }}>
              Nenhum personagem criado ainda.
            </p>
            <button className="button" onClick={() => setIsCreating(true)}>
              Criar o primeiro
            </button>
          </div>
        ) : (
          rows.map((char) => (
            <div key={char.id} className="card card--span-4 character-card">
              <div
                className="character-card__content"
                onClick={() => navigate(`/characters/${char.id}`)}
              >
                <div className="character-card__avatar">
                  <IconUser size={24} />
                </div>
                <div className="character-card__info">
                  <div className="character-card__name">{char.name}</div>
                  <div className="character-card__meta">
                    {char.class || "Classe"} • Nível{" "}
                    {formatLevel(char.system, char.level)}
                  </div>
                </div>
              </div>
              <button
                className="character-card__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Tem certeza?")) actions.removeCharacter(char.id);
                }}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(4px);
        }
        .modal {
          background: var(--panel);
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: var(--radius);
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
        }
        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
        }
        .badge--accent {
          background: rgba(255, 50, 50, 0.1);
          color: var(--accent);
          border-color: var(--accent);
        }
        .input--lg {
          font-size: 16px;
          padding: 12px;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
        }
        .character-card {
          position: relative;
          padding: 0;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .character-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }
        .character-card__content {
          padding: 16px;
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .character-card__avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          border: 1px solid var(--border);
        }
        .character-card__info {
          flex: 1;
          min-width: 0;
        }
        .character-card__name {
          font-weight: 800;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .character-card__meta {
          font-size: 13px;
          color: var(--accent-2);
          margin-top: 2px;
        }
        .character-card__player {
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
        }
        .character-card__delete {
          position: absolute;
          top: 8px;
          right: 8px;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
          padding: 6px;
          border-radius: 6px;
        }
        .character-card__delete:hover {
          background: var(--danger);
          color: white;
        }
        .character-card:hover .character-card__delete {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
