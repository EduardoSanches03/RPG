import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconX,
  IconTrash,
  IconUser,
  IconUsers,
  IconSparkles,
  IconSword,
} from "../app/shell/icons";
import { ROUTES } from "../app/routes";
import {
  defaultLevelForSystem,
  formatLevel,
  isSavagePathfinder,
  type SavagePathfinderRank,
} from "../domain/savagePathfinder";
import { RPG_SYSTEM_OPTIONS } from "../domain/rpgSystems";
import { useRpgData } from "../store/RpgDataContext";

function hpRatio(current: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function remainingRatio(penalty: number, maxPenalty: number) {
  return hpRatio(Math.max(0, maxPenalty - penalty), maxPenalty);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function focusRatio(base: number) {
  return Math.max(8, Math.min(100, Math.round((base / 12) * 100)));
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function resolveHp(char: {
  stats?: { hp?: { current?: number; max?: number } };
}) {
  const rawCurrent = safeNumber(char.stats?.hp?.current, 10);
  const rawMax = safeNumber(char.stats?.hp?.max, 10);
  const max = Math.max(1, rawMax);
  const current = Math.max(0, Math.min(rawCurrent, max));
  return { current, max };
}

function resolvePowerPoints(char: {
  modules?: Array<{ type: string; data?: Record<string, unknown> }>;
}) {
  const ppModule = char.modules?.find((module) => module.type === "power_points");
  const current = Math.max(0, safeNumber(ppModule?.data?.current, 0));
  const max = Math.max(0, safeNumber(ppModule?.data?.max, 0));
  if (max <= 0) return { current, max: current };
  return { current: Math.min(current, max), max };
}

function classTone(value?: string) {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("wizard") || normalized.includes("mago")) return "arcane";
  if (normalized.includes("rogue") || normalized.includes("ladino")) return "shadow";
  if (normalized.includes("paladin") || normalized.includes("cleric")) return "radiant";
  return "steel";
}

export function CharactersPage() {
  const { data, actions } = useRpgData();
  const navigate = useNavigate();
  const availableSystemIds = useMemo(
    () => new Set(RPG_SYSTEM_OPTIONS.map((option) => option.id)),
    [],
  );
  const resolveSystemId = (value: string | undefined) =>
    value && availableSystemIds.has(value) ? value : "savage_pathfinder";

  const [activeTab, setActiveTab] = useState<"players" | "npcs">("players");
  const [isCreating, setIsCreating] = useState(false);
  const [newSystem, setNewSystem] = useState(resolveSystemId(data.campaign.system));
  const [newName, setNewName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newClass, setNewClass] = useState("");
  const [newRace, setNewRace] = useState("");
  const [newAncestry, setNewAncestry] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [newWeight, setNewWeight] = useState("");
  const [newEdges, setNewEdges] = useState("0");
  const [newConviction, setNewConviction] = useState("0");
  const [newLevel, setNewLevel] = useState<number | SavagePathfinderRank>(
    defaultLevelForSystem(resolveSystemId(data.campaign.system)),
  );

  const roster = useMemo(() => {
    if (activeTab === "npcs") return [];
    return [...data.characters].sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, data.characters]);

  function resetForm() {
    setNewName("");
    setNewPlayerName("");
    setNewClass("");
    setNewRace("");
    setNewAncestry("");
    setNewHeight("");
    setNewWeight("");
    setNewEdges("0");
    setNewConviction("0");
    setNewLevel(defaultLevelForSystem(newSystem));
  }

  function openCreateModal() {
    handleSystemChange(resolveSystemId(data.campaign.system));
    setIsCreating(true);
  }

  function closeCreateModal() {
    setIsCreating(false);
    resetForm();
  }

  function handleSystemChange(value: string) {
    setNewSystem(value);
    setNewLevel(defaultLevelForSystem(value));
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const edgesValue = Number(newEdges);
    const convictionValue = Number(newConviction);
    actions.upsertCharacter({
      name: newName.trim(),
      system: newSystem,
      playerName: newPlayerName.trim(),
      class: newClass.trim() || undefined,
      race: newRace.trim() || undefined,
      ancestry: newAncestry.trim() || undefined,
      height: newHeight.trim() || undefined,
      weight: newWeight.trim() || undefined,
      edges:
        Number.isFinite(edgesValue) && edgesValue >= 0 ? Math.floor(edgesValue) : undefined,
      conviction:
        Number.isFinite(convictionValue) && convictionValue >= 0
          ? Math.floor(convictionValue)
          : undefined,
      level: isSavagePathfinder(newSystem) ? undefined : newLevel,
    });
    closeCreateModal();
  }

  return (
    <div className="page ledger-roster-page">
      <header className="ledger-roster-header">
        <div>
          <h1 className="ledger-roster-title">Lista de Aventureiros</h1>
          <p className="ledger-roster-subtitle">
            Gerencie os herois de Eldoria, de paladinos nobres a cultistas da baixa cidade.
          </p>
        </div>

        <div className="ledger-roster-actions">
          <div className="ledger-tab-group" role="tablist" aria-label="Tipo de lista">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "players"}
              className={activeTab === "players" ? "ledger-tab ledger-tab--active" : "ledger-tab"}
              onClick={() => setActiveTab("players")}
            >
              JOGADORES
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "npcs"}
              className={activeTab === "npcs" ? "ledger-tab ledger-tab--active" : "ledger-tab"}
              onClick={() => setActiveTab("npcs")}
            >
              NPCS
            </button>
          </div>

          <button className="button ledger-add-btn" onClick={openCreateModal}>
            <IconUsers size={14} />
            ADICIONAR PERSONAGEM
          </button>
        </div>
      </header>

      <section className="ledger-roster-grid">
        {roster.map((char) => {
          const hp = resolveHp(char);
          const hpPercent = hpRatio(hp.current, hp.max);

          const isSavage = isSavagePathfinder(char.system);
          const pp = resolvePowerPoints(char);
          const powerPointsCurrent = isSavage ? pp.current : safeNumber(char.attributes?.smarts, 4);
          const powerPointsMax = isSavage ? pp.max : 12;
          const powerPointsPercent = isSavage
            ? hpRatio(powerPointsCurrent, powerPointsMax || 1)
            : focusRatio(safeNumber(char.attributes?.smarts, 4));

          const savageFatigue = clamp(safeNumber(char.stats?.fatigue, 0), 0, 2);
          const savageWounds = clamp(safeNumber(char.stats?.wounds, 0), 0, 3);
          const savageFatiguePercent = remainingRatio(savageFatigue, 2);
          const savageWoundsPercent = remainingRatio(savageWounds, 3);

          const savageMovement = safeNumber(char.stats?.pace, 6);
          const savageParry = safeNumber(char.stats?.parry, 2);
          const savageToughness = safeNumber(char.stats?.toughness, 4);

          const statBlocks = isSavage
            ? [
                { label: "MOV", value: savageMovement },
                { label: "APARAR", value: savageParry },
                { label: "RESIST.", value: savageToughness },
              ]
            : [
                { label: "STR", value: char.attributes?.strength ?? 4 },
                { label: "DEX", value: char.attributes?.agility ?? 4 },
                { label: "VIT", value: char.attributes?.vigor ?? 4 },
              ];
          const tone = classTone(char.class);

          return (
            <article key={char.id} className={`ledger-roster-card tone-${tone}`}>
              <div className="ledger-roster-card__head">
                <div className="ledger-roster-avatar">
                  {char.avatarUrl ? (
                    <img
                      src={char.avatarUrl}
                      alt={`Avatar de ${char.name}`}
                      className="ledger-roster-avatar__img"
                    />
                  ) : char.name ? (
                    char.name.slice(0, 2).toUpperCase()
                  ) : (
                    <IconUser size={26} />
                  )}
                </div>
                <div className="ledger-roster-head-text">
                  <h2>{char.name}</h2>
                  <p>
                    {isSavage
                      ? `${char.ancestry || char.race || "Sem ancestralidade"} · ${
                          char.class || "Sem classe"
                        }`
                      : `Nivel ${formatLevel(char.system, char.level)} · ${
                          char.class || "Aventureiro"
                        }`}
                  </p>
                </div>
              </div>

              <div className="ledger-roster-bars">
                {isSavage ? (
                  <>
                    <div>
                      <span>Fadiga</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-fill--mana"
                          style={{ width: `${savageFatiguePercent}%` }}
                        />
                      </div>
                      <small>{savageFatigue} / 2</small>
                    </div>
                    <div>
                      <span>Ferimentos</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-fill--hp"
                          style={{ width: `${savageWoundsPercent}%` }}
                        />
                      </div>
                      <small>{savageWounds} / 3</small>
                    </div>
                    <div>
                      <span>Pontos de Poder</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-fill--mana"
                          style={{ width: `${powerPointsPercent}%` }}
                        />
                      </div>
                      <small>{powerPointsCurrent} / {powerPointsMax}</small>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span>Vida</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-fill--hp"
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                      <small>
                        {hp.current} / {hp.max}
                      </small>
                    </div>
                    <div>
                      <span>Energia</span>
                      <div className="bar-track">
                        <div
                          className="bar-fill bar-fill--mana"
                          style={{ width: `${powerPointsPercent}%` }}
                        />
                      </div>
                      <small>{powerPointsCurrent} Foco</small>
                    </div>
                  </>
                )}
              </div>

              <div className="ledger-roster-stats">
                {statBlocks.map((stat) => (
                  <div key={stat.label}>
                    <small>{stat.label}</small>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>

              <div className="ledger-roster-card__actions">
                <button
                  className="button button--ghost"
                  onClick={() => navigate(ROUTES.characterSheet(char.id))}
                >
                  VER FICHA
                </button>
                <button
                  className="icon-pill ledger-delete-btn"
                  title="Remover personagem"
                  onClick={() => {
                    if (window.confirm(`Remover ${char.name}?`)) {
                      actions.removeCharacter(char.id);
                    }
                  }}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </article>
          );
        })}

        <button type="button" className="ledger-recruit-card" onClick={openCreateModal}>
          <span className="ledger-recruit-icon">
            <IconPlus size={22} />
          </span>
          <strong>Recrutar Aventureiro</strong>
          <small>Comece uma nova jornada</small>
        </button>
      </section>

      {activeTab === "npcs" && (
        <div className="card ledger-npc-placeholder">
          <p className="ledger-kicker ledger-kicker--violet">
            <IconSparkles size={12} />
            EM BREVE
          </p>
          <h3>Arquivo de NPCs</h3>
          <p>
            A aba de NPCs vai receber fichas dedicadas para aliados, inimigos e monstros da
            campanha.
          </p>
        </div>
      )}

      {isCreating && (
        <div className="ledger-modal-backdrop" onClick={closeCreateModal}>
          <div className="ledger-modal" onClick={(e) => e.stopPropagation()}>
            <header className="ledger-modal__header">
              <h2>Recrutar Novo Personagem</h2>
              <button className="icon-pill" title="Fechar" onClick={closeCreateModal}>
                <IconX size={13} />
              </button>
            </header>

            <div className="field">
              <label className="label">Sistema</label>
              <select
                className="input"
                value={newSystem}
                onChange={(e) => handleSystemChange(e.target.value)}
                aria-label="Sistema"
                autoFocus
              >
                {RPG_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ledger-modal__row">
              <div className="field" style={{ gridColumn: "span 2" }}>
                <label className="label">Nome</label>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Kaelen Passo Sombrio"
                />
              </div>
              <div className="field" style={{ gridColumn: "span 1" }}>
                <label className="label">Jogador</label>
                <input
                  className="input"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Ex: Ana"
                />
              </div>
            </div>

            {isSavagePathfinder(newSystem) ? (
              <>
                <div className="ledger-modal__row">
                  <div className="field">
                    <label className="label">Ancestralidade</label>
                    <input
                      className="input"
                      value={newAncestry}
                      onChange={(e) => setNewAncestry(e.target.value)}
                      placeholder="Ex: Anão"
                      aria-label="Ancestralidade"
                    />
                  </div>
                  <div className="field">
                    <label className="label">Altura</label>
                    <input
                      className="input"
                      value={newHeight}
                      onChange={(e) => setNewHeight(e.target.value)}
                      placeholder="Ex: 1,82m"
                      aria-label="Altura"
                    />
                  </div>
                  <div className="field">
                    <label className="label">Peso</label>
                    <input
                      className="input"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Ex: 86kg"
                      aria-label="Peso"
                    />
                  </div>
                </div>
                <div className="ledger-modal__row">
                  <div className="field">
                    <label className="label">Classe</label>
                    <input
                      className="input"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      placeholder="Ex: Druida"
                      aria-label="Classe"
                    />
                  </div>
                  <div className="field">
                    <label className="label">Benes</label>
                    <input
                      type="number"
                      min={0}
                      className="input"
                      value={newEdges}
                      onChange={(e) => setNewEdges(e.target.value)}
                      aria-label="Benes"
                    />
                  </div>
                  <div className="field">
                    <label className="label">Conviccao</label>
                    <input
                      type="number"
                      min={0}
                      className="input"
                      value={newConviction}
                      onChange={(e) => setNewConviction(e.target.value)}
                      aria-label="Conviccao"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="ledger-modal__row">
                <div className="field">
                  <label className="label">Classe</label>
                  <input
                    className="input"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="Guerreiro"
                    aria-label="Classe"
                  />
                </div>
                <div className="field">
                  <label className="label">Raca</label>
                  <input
                    className="input"
                    value={newRace}
                    onChange={(e) => setNewRace(e.target.value)}
                    placeholder="Humano"
                    aria-label="Raca"
                  />
                </div>
                <div className="field">
                  <label className="label">Nivel</label>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={typeof newLevel === "number" ? newLevel : 1}
                    onChange={(e) => setNewLevel(Number(e.target.value))}
                    aria-label="Nivel"
                  />
                </div>
              </div>
            )}

            <div className="ledger-modal__actions">
              <button className="button button--ghost" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button className="button" onClick={handleCreate} disabled={!newName.trim()}>
                <IconSword size={14} />
                Criar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
