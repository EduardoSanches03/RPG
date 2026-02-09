import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useRpgData } from "../store/RpgDataContext";
import {
  IconShield,
  IconSword,
  IconHeart,
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
  IconTrash,
  IconBubble,
  IconEdit,
  IconScroll,
  IconGrid,
  IconSkull,
  IconSparkles,
  IconStar,
  IconBackpack,
  IconCoin,
  IconBolt,
  IconRefresh,
  IconMagic,
  IconX,
  IconBook,
} from "../app/shell/icons";
import type {
  Character,
  CharacterModule,
  Skill,
  Hindrance,
  AncestralAbility,
  Edge,
  Advancement,
  EquipmentItem,
  Power,
  Weapon,
} from "../domain/rpg";
import { formatLevel } from "../domain/savagePathfinder";
import { ReferenceSidebar } from "../components/ReferenceSidebar";

function DieShape({
  sides,
  active,
  onClick,
}: {
  sides: 4 | 6 | 8 | 10 | 12;
  active: boolean;
  onClick: () => void;
}) {
  const size = 24;
  const color = active ? "var(--accent)" : "var(--muted)";
  const fill = active ? "var(--accent)" : "transparent";
  const strokeWidth = active ? 0 : 1.5;

  let path = "";
  let textY = 12; // Ajuste vertical do texto

  switch (sides) {
    case 4:
      path = "M12 2 L22 20 H2 Z";
      textY = 16;
      break;
    case 6:
      path = "M4 4 H20 V20 H4 Z";
      break;
    case 8:
      path = "M12 2 L22 12 L12 22 L2 12 Z";
      break;
    case 10:
      path = "M12 2 L22 10 L12 22 L2 10 Z";
      textY = 13;
      break;
    case 12:
      path = "M12 2 L20.66 7 L20.66 17 L12 22 L3.34 17 L3.34 7 Z";
      break;
  }

  return (
    <div
      className={`die-shape ${active ? "die-shape--active" : ""}`}
      onClick={onClick}
      title={`d${sides}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ overflow: "visible" }}
      >
        <path
          d={path}
          fill={fill}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <text
          x="12"
          y={textY}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={active ? "black" : color}
          fontSize="10"
          fontWeight="bold"
          style={{ pointerEvents: "none" }}
        >
          {sides}
        </text>
      </svg>
    </div>
  );
}

function DamageTrack({
  label,
  value,
  max,
  onChange,
  labels,
  reverse = false,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (val: number) => void;
  labels: string[];
  reverse?: boolean;
}) {
  return (
    <div className="damage-track">
      <div className="damage-track__label">{label}</div>
      <div
        className="damage-track__boxes"
        style={{ flexDirection: reverse ? "row-reverse" : "row" }}
      >
        {Array.from({ length: max }).map((_, i) => {
          const step = i + 1;
          const isActive = value >= step;
          return (
            <div
              key={step}
              className={`damage-box ${isActive ? "damage-box--active" : ""}`}
              onClick={() =>
                onChange(isActive && value === step ? step - 1 : step)
              }
            >
              <span className="damage-box__val">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Componentes de Módulos ---

type ModuleProps = {
  character: Character;
  moduleId: string;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  actions: {
    updateCharacterStats: (id: string, stats: Character["stats"]) => void;
    updateCharacterAttributes: (
      id: string,
      attrs: Character["attributes"],
    ) => void;
    updateCharacterModule: (
      charId: string,
      moduleId: string,
      updates: Partial<CharacterModule>,
    ) => void;
  };
};

function ModuleActions({
  isEditing,
  setIsEditing,
  isNotesOpen,
  setIsNotesOpen,
  module,
  props,
}: {
  isEditing?: boolean;
  setIsEditing?: (v: boolean) => void;
  isNotesOpen: boolean;
  setIsNotesOpen: (v: boolean) => void;
  module: CharacterModule;
  props: ModuleProps;
}) {
  const currentSpan = module.span || 1;
  const toggleSpan = () => {
    const nextSpan = currentSpan >= 3 ? 1 : ((currentSpan + 1) as 1 | 2 | 3);
    props.actions.updateCharacterModule(props.character.id, module.id, {
      span: nextSpan,
    });
  };

  const currentRowSpan = module.rowSpan || 1;
  const toggleRowSpan = () => {
    const nextRowSpan =
      currentRowSpan >= 3 ? 1 : ((currentRowSpan + 1) as 1 | 2 | 3);
    props.actions.updateCharacterModule(props.character.id, module.id, {
      rowSpan: nextRowSpan,
    });
  };

  return (
    <div className="module-actions">
      {props.canMoveLeft && (
        <button
          className="module-action-btn"
          onClick={props.onMoveLeft}
          title="Mover para esquerda"
        >
          <IconChevronLeft size={14} />
        </button>
      )}
      <button
        className="module-action-btn"
        onClick={props.onMoveUp}
        title="Mover para cima"
      >
        <IconChevronUp size={14} />
      </button>
      <button
        className="module-action-btn"
        onClick={props.onMoveDown}
        title="Mover para baixo"
      >
        <IconChevronDown size={14} />
      </button>
      {props.canMoveRight && (
        <button
          className="module-action-btn"
          onClick={props.onMoveRight}
          title="Mover para direita"
        >
          <IconChevronRight size={14} />
        </button>
      )}

      <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

      <button
        className="module-action-btn"
        onClick={toggleSpan}
        title={`Largura: ${currentSpan} (Clique para alterar)`}
      >
        <IconGrid
          size={14}
          style={{
            opacity: currentSpan > 1 ? 1 : 0.5,
            color: currentSpan > 1 ? "var(--accent)" : "inherit",
          }}
        />
      </button>

      <button
        className="module-action-btn"
        onClick={toggleRowSpan}
        title={`Altura: ${currentRowSpan} (Clique para alterar)`}
      >
        <IconGrid
          size={14}
          style={{
            transform: "rotate(90deg)",
            opacity: currentRowSpan > 1 ? 1 : 0.5,
            color: currentRowSpan > 1 ? "var(--accent)" : "inherit",
          }}
        />
      </button>

      <div style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

      {setIsEditing && (
        <button
          className={`module-action-btn ${isEditing ? "module-action-btn--active" : ""}`}
          onClick={() => setIsEditing(!isEditing)}
          title="Editar"
        >
          <IconEdit size={14} />
        </button>
      )}

      <button
        className={`module-action-btn ${module.notes ? "module-action-btn--active" : ""}`}
        onClick={() => setIsNotesOpen(!isNotesOpen)}
        title="Notas"
      >
        <IconBubble size={14} />
      </button>
      <button
        className="module-action-btn module-action-btn--danger"
        onClick={props.onRemove}
        title="Remover módulo"
      >
        <IconTrash size={14} />
      </button>
    </div>
  );
}

function ModuleCombatStats(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const stats = character.stats || {
    ca: 10,
    hp: { current: 10, max: 10 },
    initiative: 0,
  };
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!module) return null;

  function updateStats(newStats: Partial<Character["stats"]>) {
    actions.updateCharacterStats(character.id, { ...stats, ...newStats });
  }

  function updateHp(current: number) {
    updateStats({
      hp: {
        ...stats.hp,
        current: Math.min(Math.max(0, current), stats.hp.max),
      },
    });
  }

  const isSavage =
    character.system === "savage_pathfinder" ||
    module.system === "savage_pathfinder";

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações sobre este módulo..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconShield
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          COMBATE
        </div>
      </div>

      {isEditing && (
        <div className="edit-panel">
          {isSavage ? (
            <>
              <div className="field">
                <label className="label">Movimento (Pace)</label>
                <input
                  type="number"
                  className="input"
                  value={stats.pace ?? 6}
                  onChange={(e) =>
                    updateStats({ pace: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label className="label">Aparar (Parry)</label>
                <input
                  type="number"
                  className="input"
                  value={stats.parry ?? 2}
                  onChange={(e) =>
                    updateStats({ parry: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label className="label">Resistência (Toughness)</label>
                <input
                  type="number"
                  className="input"
                  value={stats.toughness ?? 4}
                  onChange={(e) =>
                    updateStats({ toughness: Number(e.target.value) })
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label className="label">CA</label>
                <input
                  type="number"
                  className="input"
                  value={stats.ca}
                  onChange={(e) => updateStats({ ca: Number(e.target.value) })}
                />
              </div>
              <div className="field">
                <label className="label">Iniciativa</label>
                <input
                  type="number"
                  className="input"
                  value={stats.initiative}
                  onChange={(e) =>
                    updateStats({ initiative: Number(e.target.value) })
                  }
                />
              </div>
            </>
          )}
          <div className="field">
            <label className="label">PV Máximo / Ferimentos</label>
            <input
              type="number"
              className="input"
              value={stats.hp.max}
              onChange={(e) =>
                updateStats({
                  hp: { ...stats.hp, max: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
      )}

      <div className="combat-stats">
        {isSavage ? (
          <>
            <div className="stat-box">
              <IconSword className="stat-icon" />
              <div className="stat-label">MOVIMENTO</div>
              <div className="stat-value">{stats.pace ?? 6}</div>
            </div>
            <div className="stat-box">
              <IconShield className="stat-icon" />
              <div className="stat-label">APARAR</div>
              <div className="stat-value">{stats.parry ?? 2}</div>
            </div>
            <div className="stat-box">
              <IconShield
                className="stat-icon"
                style={{ color: "var(--accent-2)" }}
              />
              <div className="stat-label">RESISTÊNCIA</div>
              <div className="stat-value">{stats.toughness ?? 4}</div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-box">
              <IconShield className="stat-icon" />
              <div className="stat-label">CA</div>
              <div className="stat-value">{stats.ca}</div>
            </div>
            <div className="stat-box">
              <IconHeart
                className="stat-icon"
                style={{ color: "var(--danger)" }}
              />
              <div className="stat-label">PV</div>
              <div className="stat-value">
                {stats.hp.current}
                <span className="stat-max">/{stats.hp.max}</span>
              </div>
            </div>
            <div className="stat-box">
              <IconSword
                className="stat-icon"
                style={{ color: "var(--accent-2)" }}
              />
              <div className="stat-label">INICIATIVA</div>
              <div className="stat-value">{stats.initiative}</div>
            </div>
          </>
        )}
      </div>

      <div className="hp-bar-container">
        {isSavage ? (
          <div className="savage-tracks">
            <DamageTrack
              label="FADIGA"
              max={2}
              value={stats.fatigue ?? 0}
              onChange={(v) => updateStats({ fatigue: v })}
              labels={["-1", "-2"]}
              reverse={false}
            />

            <div
              className={`incapacitated-marker ${stats.isIncapacitated ? "incapacitated-marker--active" : ""}`}
              onClick={() =>
                updateStats({ isIncapacitated: !stats.isIncapacitated })
              }
            >
              <div className="incapacitated-label">INC</div>
            </div>

            <DamageTrack
              label="FERIMENTOS"
              max={3}
              value={stats.wounds ?? 0}
              onChange={(v) => updateStats({ wounds: v })}
              labels={["-1", "-2", "-3"]}
              reverse={true}
            />
          </div>
        ) : (
          <>
            <div className="hp-labels">
              <span>Pontos de Vida</span>
              <span>
                {stats.hp.current}/{stats.hp.max}
              </span>
            </div>
            <div className="hp-track">
              <div
                className="hp-fill"
                style={{ width: `${(stats.hp.current / stats.hp.max) * 100}%` }}
              />
            </div>
            <div className="hp-controls">
              <button
                className="hp-btn"
                onClick={() => updateHp(stats.hp.current - 1)}
              >
                -
              </button>
              <button
                className="hp-btn"
                onClick={() => updateHp(stats.hp.current + 1)}
              >
                +
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModuleAttributes(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const attrs = character.attributes || {
    agility: 4,
    smarts: 4,
    spirit: 4,
    strength: 4,
    vigor: 4,
  };
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  const attributesList = [
    { key: "agility", label: "AGILIDADE", value: attrs.agility },
    { key: "smarts", label: "ASTÚCIA", value: attrs.smarts },
    { key: "spirit", label: "ESPÍRITO", value: attrs.spirit },
    { key: "strength", label: "FORÇA", value: attrs.strength },
    { key: "vigor", label: "VIGOR", value: attrs.vigor },
  ] as const;

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações sobre este módulo..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <span style={{ marginRight: 8, color: "var(--accent)" }}>✨</span>
          ATRIBUTOS
        </div>
      </div>

      <div className="attributes-list">
        {attributesList.map((attr) => (
          <div key={attr.key} className="attribute-row">
            <div className="attribute-dice">
              {[4, 6, 8, 10, 12].map((d) => (
                <DieShape
                  key={d}
                  sides={d as 4 | 6 | 8 | 10 | 12}
                  active={attr.value === d}
                  onClick={() =>
                    actions.updateCharacterAttributes(character.id, {
                      ...attrs,
                      [attr.key]: d,
                    })
                  }
                />
              ))}
            </div>
            <div className="attribute-label">{attr.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleSkills(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [openSkillNoteId, setOpenSkillNoteId] = useState<string | null>(null);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  // Helper para garantir tipagem dos dados
  const skills = (module.data?.skills as Skill[]) || [];

  function updateSkills(newSkills: Skill[]) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, skills: newSkills },
    });
  }

  function addSkill() {
    const newSkill: Skill = {
      id: crypto.randomUUID(),
      name: "",
      die: 4,
    };
    updateSkills([...skills, newSkill]);
  }

  function updateSkill(id: string, updates: Partial<Skill>) {
    updateSkills(skills.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }

  function removeSkill(id: string) {
    updateSkills(skills.filter((s) => s.id !== id));
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações gerais sobre as perícias..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconScroll
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          PERÍCIAS
        </div>
      </div>

      <div className="skills-list">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-row-container">
            <div className="skill-row">
              <div className="skill-dice">
                {[4, 6, 8, 10, 12].map((d) => (
                  <DieShape
                    key={d}
                    sides={d as 4 | 6 | 8 | 10 | 12}
                    active={skill.die === d}
                    onClick={() => updateSkill(skill.id, { die: d as any })}
                  />
                ))}
              </div>
              <input
                className="input skill-name-input"
                placeholder="Nome da Perícia"
                value={skill.name}
                onChange={(e) =>
                  updateSkill(skill.id, { name: e.target.value })
                }
              />
              <div className="skill-actions">
                <button
                  className={`skill-action-btn ${skill.notes ? "skill-action-btn--active" : ""}`}
                  onClick={() =>
                    setOpenSkillNoteId(
                      openSkillNoteId === skill.id ? null : skill.id,
                    )
                  }
                  title="Anotação da perícia"
                >
                  <IconEdit size={16} style={{ display: "block" }} />
                </button>
                <button
                  className="skill-action-btn skill-action-btn--danger"
                  onClick={() => removeSkill(skill.id)}
                  title="Remover perícia"
                >
                  <IconTrash size={16} style={{ display: "block" }} />
                </button>
              </div>
            </div>

            {openSkillNoteId === skill.id && (
              <div className="skill-note">
                <textarea
                  className="input input--textarea skill-note-input"
                  placeholder={`Notas para ${skill.name || "esta perícia"}...`}
                  value={skill.notes || ""}
                  onChange={(e) =>
                    updateSkill(skill.id, { notes: e.target.value })
                  }
                  rows={2}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}

        <button
          className="button button--ghost"
          onClick={addSkill}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        >
          <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar Perícia
        </button>
      </div>
    </div>
  );
}

function ModuleHindrances(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [openHindranceNoteId, setOpenHindranceNoteId] = useState<string | null>(
    null,
  );

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  // Helper para garantir tipagem dos dados
  const hindrances = (module.data?.hindrances as Hindrance[]) || [];

  // Migração automática de text_block para hindrances
  useEffect(() => {
    if (module.type === "text_block") {
      const text = (module.data?.text as string) || "";
      if (text.trim()) {
        const newHindrances = text
          .split("\n")
          .filter((t) => t.trim())
          .map((line) => ({
            id: crypto.randomUUID(),
            name: line.trim(),
          }));
        actions.updateCharacterModule(character.id, moduleId, {
          type: "hindrances",
          data: { hindrances: newHindrances },
        });
      } else {
        actions.updateCharacterModule(character.id, moduleId, {
          type: "hindrances",
          data: { hindrances: [] },
        });
      }
    }
  }, [module.type, module.data, character.id, moduleId, actions]);

  function updateHindrances(newHindrances: Hindrance[]) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, hindrances: newHindrances },
    });
  }

  function addHindrance() {
    const newHindrance: Hindrance = {
      id: crypto.randomUUID(),
      name: "",
    };
    updateHindrances([...hindrances, newHindrance]);
  }

  function updateHindrance(id: string, updates: Partial<Hindrance>) {
    updateHindrances(
      hindrances.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  }

  function removeHindrance(id: string) {
    updateHindrances(hindrances.filter((h) => h.id !== id));
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações gerais sobre as complicações..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconSkull
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          COMPLICAÇÕES
        </div>
      </div>

      <div className="skills-list">
        {hindrances.map((hindrance) => (
          <div key={hindrance.id} className="skill-row-container">
            <div className="skill-row">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  background: "rgba(0, 0, 0, 0.1)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  height: "34px",
                  marginRight: "8px",
                }}
              >
                <select
                  style={{
                    width: "70px",
                    padding: "0 4px",
                    fontSize: "0.75rem",
                    height: "100%",
                    border: "none",
                    background: "rgba(210, 59, 59, 0.15)",
                    color: "var(--accent-2)",
                    fontWeight: 700,
                    outline: "none",
                    cursor: "pointer",
                    textAlign: "center",
                    borderRight: "1px solid var(--border)",
                  }}
                  value={hindrance.type || ""}
                  onChange={(e) =>
                    updateHindrance(hindrance.id, {
                      type: (e.target.value as "major" | "minor") || undefined,
                    })
                  }
                >
                  <option
                    value=""
                    style={{ background: "var(--bg)", color: "var(--text)" }}
                  >
                    TIPO
                  </option>
                  <option
                    value="minor"
                    style={{ background: "var(--bg)", color: "var(--text)" }}
                  >
                    MENOR
                  </option>
                  <option
                    value="major"
                    style={{ background: "var(--bg)", color: "var(--text)" }}
                  >
                    MAIOR
                  </option>
                </select>
                <input
                  placeholder="Nome da Complicação"
                  value={hindrance.name}
                  onChange={(e) =>
                    updateHindrance(hindrance.id, { name: e.target.value })
                  }
                  style={{
                    padding: "0 10px",
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    color: "var(--text)",
                    height: "100%",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
              </div>
              <div className="skill-actions">
                <button
                  className={`skill-action-btn ${hindrance.notes ? "skill-action-btn--active" : ""}`}
                  onClick={() =>
                    setOpenHindranceNoteId(
                      openHindranceNoteId === hindrance.id
                        ? null
                        : hindrance.id,
                    )
                  }
                  title="Anotação"
                >
                  <IconEdit size={16} style={{ display: "block" }} />
                </button>
                <button
                  className="skill-action-btn skill-action-btn--danger"
                  onClick={() => removeHindrance(hindrance.id)}
                  title="Remover"
                >
                  <IconTrash size={16} style={{ display: "block" }} />
                </button>
              </div>
            </div>

            {openHindranceNoteId === hindrance.id && (
              <div className="skill-note">
                <textarea
                  className="input input--textarea skill-note-input"
                  placeholder={`Notas para ${hindrance.name || "esta complicação"}...`}
                  value={hindrance.notes || ""}
                  onChange={(e) =>
                    updateHindrance(hindrance.id, { notes: e.target.value })
                  }
                  rows={2}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}

        <button
          className="button button--ghost"
          onClick={addHindrance}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        >
          <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar
          Complicação
        </button>
      </div>
    </div>
  );
}

function ModuleAncestralAbilities(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [openAbilityNoteId, setOpenAbilityNoteId] = useState<string | null>(
    null,
  );

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  // Helper para garantir tipagem dos dados
  const abilities =
    (module.data?.ancestral_abilities as AncestralAbility[]) || [];

  function updateAbilities(newAbilities: AncestralAbility[]) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, ancestral_abilities: newAbilities },
    });
  }

  function addAbility() {
    const newAbility: AncestralAbility = {
      id: crypto.randomUUID(),
      name: "",
    };
    updateAbilities([...abilities, newAbility]);
  }

  function updateAbility(id: string, updates: Partial<AncestralAbility>) {
    updateAbilities(
      abilities.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }

  function removeAbility(id: string) {
    updateAbilities(abilities.filter((a) => a.id !== id));
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações gerais sobre as habilidades ancestrais..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconSparkles
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          HABILIDADES ANCESTRAIS
        </div>
      </div>

      <div className="skills-list">
        {abilities.map((ability) => (
          <div key={ability.id} className="skill-row-container">
            <div className="skill-row">
              <input
                className="input skill-name-input"
                placeholder="Nome da Habilidade"
                value={ability.name}
                onChange={(e) =>
                  updateAbility(ability.id, { name: e.target.value })
                }
                style={{ paddingLeft: 8 }}
              />
              <div className="skill-actions">
                <button
                  className={`skill-action-btn ${ability.notes ? "skill-action-btn--active" : ""}`}
                  onClick={() =>
                    setOpenAbilityNoteId(
                      openAbilityNoteId === ability.id ? null : ability.id,
                    )
                  }
                  title="Anotação"
                >
                  <IconEdit size={16} style={{ display: "block" }} />
                </button>
                <button
                  className="skill-action-btn skill-action-btn--danger"
                  onClick={() => removeAbility(ability.id)}
                  title="Remover"
                >
                  <IconTrash size={16} style={{ display: "block" }} />
                </button>
              </div>
            </div>

            {openAbilityNoteId === ability.id && (
              <div className="skill-note">
                <textarea
                  className="input input--textarea skill-note-input"
                  placeholder={`Notas para ${ability.name || "esta habilidade"}...`}
                  value={ability.notes || ""}
                  onChange={(e) =>
                    updateAbility(ability.id, { notes: e.target.value })
                  }
                  rows={2}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}

        <button
          className="button button--ghost"
          onClick={addAbility}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        >
          <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar Habilidade
        </button>
      </div>
    </div>
  );
}

const ADVANCEMENT_SLOTS = [
  { id: "N1", rank: "N", label: "Novato +1" },
  { id: "N2", rank: "N", label: "Novato +2" },
  { id: "N3", rank: "N", label: "Novato +3" },
  { id: "E0", rank: "E", label: "Experiente" },
  { id: "E1", rank: "E", label: "Experiente +1" },
  { id: "E2", rank: "E", label: "Experiente +2" },
  { id: "E3", rank: "E", label: "Experiente +3" },
  { id: "V0", rank: "V", label: "Veterano" },
  { id: "V1", rank: "V", label: "Veterano +1" },
  { id: "V2", rank: "V", label: "Veterano +2" },
  { id: "V3", rank: "V", label: "Veterano +3" },
  { id: "H0", rank: "H", label: "Heroico" },
  { id: "H1", rank: "H", label: "Heroico +1" },
  { id: "H2", rank: "H", label: "Heroico +2" },
  { id: "H3", rank: "H", label: "Heroico +3" },
  { id: "L0", rank: "L", label: "Lendário" },
  { id: "L1", rank: "L", label: "Lendário +1" },
  { id: "L2", rank: "L", label: "Lendário +2" },
  { id: "L3", rank: "L", label: "Lendário +3" },
];

function ModuleEdgesAdvancements(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [openEdgeNoteId, setOpenEdgeNoteId] = useState<string | null>(null);
  const [openAdvancementNoteId, setOpenAdvancementNoteId] = useState<
    string | null
  >(null);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  // Dados
  const edges = (module.data?.edges as Edge[]) || [];
  const advancements =
    (module.data?.advancements as Record<string, Advancement>) || {};

  // Actions para Edges (Vantagens)
  function updateEdges(newEdges: Edge[]) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, edges: newEdges },
    });
  }

  function addEdge() {
    const newEdge: Edge = {
      id: crypto.randomUUID(),
      name: "",
    };
    updateEdges([...edges, newEdge]);
  }

  function updateEdge(id: string, updates: Partial<Edge>) {
    updateEdges(edges.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }

  function removeEdge(id: string) {
    updateEdges(edges.filter((e) => e.id !== id));
  }

  // Actions para Advancements (Progressos)
  function updateAdvancement(slotId: string, value: string, notes?: string) {
    const current = advancements[slotId] || {
      id: slotId,
      value: "",
      notes: "",
    };
    const next = {
      ...current,
      value,
      ...(notes !== undefined ? { notes } : {}),
    };

    actions.updateCharacterModule(character.id, moduleId, {
      data: {
        ...module?.data,
        advancements: { ...advancements, [slotId]: next },
      },
    });
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações gerais..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconStar
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          VANTAGENS E PROGRESSOS
        </div>
      </div>

      {/* Lista de Vantagens */}
      <div className="skills-list" style={{ marginBottom: 24 }}>
        {edges.map((edge) => (
          <div key={edge.id} className="skill-row-container">
            <div className="skill-row">
              <input
                className="input skill-name-input"
                placeholder="Nome da Vantagem"
                value={edge.name}
                onChange={(e) => updateEdge(edge.id, { name: e.target.value })}
                style={{ paddingLeft: 8 }}
              />
              <div className="skill-actions">
                <button
                  className={`skill-action-btn ${edge.notes ? "skill-action-btn--active" : ""}`}
                  onClick={() =>
                    setOpenEdgeNoteId(
                      openEdgeNoteId === edge.id ? null : edge.id,
                    )
                  }
                  title="Anotação"
                >
                  <IconEdit size={16} style={{ display: "block" }} />
                </button>
                <button
                  className="skill-action-btn skill-action-btn--danger"
                  onClick={() => removeEdge(edge.id)}
                  title="Remover"
                >
                  <IconTrash size={16} style={{ display: "block" }} />
                </button>
              </div>
            </div>

            {openEdgeNoteId === edge.id && (
              <div className="skill-note">
                <textarea
                  className="input input--textarea skill-note-input"
                  placeholder={`Notas para ${edge.name || "esta vantagem"}...`}
                  value={edge.notes || ""}
                  onChange={(e) =>
                    updateEdge(edge.id, { notes: e.target.value })
                  }
                  rows={2}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}

        <button
          className="button button--ghost"
          onClick={addEdge}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        >
          <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar Vantagem
        </button>
      </div>

      {/* Lista de Progressos */}
      <div className="advancements-list">
        {ADVANCEMENT_SLOTS.map((slot) => {
          const data = advancements[slot.id] || { value: "", notes: "" };
          return (
            <div key={slot.id} className="advancement-row-container">
              <div className="advancement-row">
                <div className="advancement-rank">{slot.rank}</div>
                <div className="advancement-input-wrapper">
                  <input
                    className="input advancement-input"
                    placeholder={slot.label}
                    value={data.value}
                    onChange={(e) => updateAdvancement(slot.id, e.target.value)}
                  />
                </div>
                <div className="skill-actions">
                  <button
                    className={`skill-action-btn ${data.notes ? "skill-action-btn--active" : ""}`}
                    onClick={() =>
                      setOpenAdvancementNoteId(
                        openAdvancementNoteId === slot.id ? null : slot.id,
                      )
                    }
                    title="Anotação"
                  >
                    <IconEdit size={16} style={{ display: "block" }} />
                  </button>
                </div>
              </div>

              {openAdvancementNoteId === slot.id && (
                <div className="skill-note">
                  <textarea
                    className="input input--textarea skill-note-input"
                    placeholder={`Notas para ${slot.label}...`}
                    value={data.notes || ""}
                    onChange={(e) =>
                      updateAdvancement(slot.id, data.value, e.target.value)
                    }
                    rows={2}
                    autoFocus
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModuleEquipment(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [openItemNoteId, setOpenItemNoteId] = useState<string | null>(null);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  const baseGold = (module.data?.baseGold as number) || 0;
  const items = (module.data?.items as EquipmentItem[]) || [];

  // Cálculos
  const totalWeight = items.reduce(
    (acc, item) => acc + (Number(item.weight) || 0),
    0,
  );
  const totalCost = items.reduce(
    (acc, item) => acc + (Number(item.cost) || 0),
    0,
  );
  const currentGold = baseGold - totalCost;

  function updateData(updates: Record<string, any>) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, ...updates },
    });
  }

  function addItem() {
    const newItem: EquipmentItem = {
      id: crypto.randomUUID(),
      name: "",
      cost: 0,
      weight: 0,
    };
    updateData({ items: [...items, newItem] });
  }

  function updateItem(id: string, updates: Partial<EquipmentItem>) {
    const newItems = items.map((i) => (i.id === id ? { ...i, ...updates } : i));
    updateData({ items: newItems });
  }

  function removeItem(id: string) {
    const newItems = items.filter((i) => i.id !== id);
    updateData({ items: newItems });
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações gerais..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconBackpack
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          EQUIPAMENTO
        </div>
      </div>

      <div className="equipment-base-gold">
        <div className="equipment-label">Ouro Inicial:</div>
        <div
          className="input-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(0,0,0,0.2)",
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid var(--border)",
          }}
        >
          <IconCoin
            size={14}
            style={{ marginRight: 6, color: "var(--accent)" }}
          />
          <input
            type="number"
            className="input"
            style={{
              border: "none",
              padding: 0,
              background: "transparent",
              width: 80,
            }}
            value={baseGold || ""}
            onChange={(e) => updateData({ baseGold: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>

      <div
        className="equipment-list-header"
        style={{
          display: "flex",
          padding: "0 8px 4px",
          fontSize: 11,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        <div style={{ flex: 2 }}>Item</div>
        <div style={{ flex: 1, textAlign: "center" }}>Valor</div>
        <div style={{ flex: 1, textAlign: "center" }}>Peso</div>
        <div style={{ width: 28 }}></div>
      </div>

      <div className="skills-list">
        {items.map((item) => (
          <div
            key={item.id}
            className="equipment-row-container"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="equipment-row"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                padding: "4px 8px",
              }}
            >
              <input
                className="input equipment-name"
                placeholder="Nome"
                style={{ flex: 2 }}
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
              />
              <input
                type="number"
                className="input equipment-number"
                placeholder="0"
                style={{ flex: 1, textAlign: "center" }}
                value={item.cost || ""}
                onChange={(e) =>
                  updateItem(item.id, { cost: Number(e.target.value) })
                }
              />
              <input
                type="number"
                className="input equipment-number"
                placeholder="0"
                style={{ flex: 1, textAlign: "center" }}
                value={item.weight || ""}
                onChange={(e) =>
                  updateItem(item.id, { weight: Number(e.target.value) })
                }
              />
              <div className="skill-actions">
                <button
                  className={`skill-action-btn ${item.notes ? "skill-action-btn--active" : ""}`}
                  onClick={() =>
                    setOpenItemNoteId(
                      openItemNoteId === item.id ? null : item.id,
                    )
                  }
                  title="Anotação"
                >
                  <IconEdit size={16} style={{ display: "block" }} />
                </button>
                <button
                  className="skill-action-btn skill-action-btn--danger"
                  onClick={() => removeItem(item.id)}
                  title="Remover"
                >
                  <IconTrash size={16} style={{ display: "block" }} />
                </button>
              </div>
            </div>

            {openItemNoteId === item.id && (
              <div className="skill-note" style={{ padding: "0 8px 8px 8px" }}>
                <textarea
                  className="input input--textarea skill-note-input"
                  placeholder={`Notas para ${item.name || "este item"}...`}
                  value={item.notes || ""}
                  onChange={(e) =>
                    updateItem(item.id, { notes: e.target.value })
                  }
                  rows={2}
                  autoFocus
                />
              </div>
            )}
          </div>
        ))}

        <button
          className="button button--ghost"
          onClick={addItem}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}
        >
          <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar Item
        </button>
      </div>

      <div
        className="equipment-footer"
        style={{
          marginTop: 16,
          borderTop: "1px dashed var(--border)",
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div
          className="equipment-stat"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <span
            className="label"
            style={{ fontSize: 11, color: "var(--muted)" }}
          >
            PESO TOTAL
          </span>
          <span className="value" style={{ fontSize: 16, fontWeight: "bold" }}>
            {totalWeight} kg
          </span>
        </div>
        <div
          className="equipment-stat"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <span
            className="label"
            style={{ fontSize: 11, color: "var(--muted)" }}
          >
            OURO RESTANTE
          </span>
          <span
            className="value"
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: currentGold < 0 ? "var(--danger)" : "var(--accent)",
            }}
          >
            {currentGold}
          </span>
        </div>
      </div>
    </div>
  );
}

function ModulePowerPoints(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  const current = (module.data?.current as number) ?? 10;
  const max = (module.data?.max as number) ?? 10;

  const percent = Math.min(100, Math.max(0, (current / max) * 100));
  const isLow = percent <= 30;

  // Efeito visual para quando está baixo
  const cardStyle = {
    position: "relative" as const,
    ...gridColumnStyle,
    ...(isLow
      ? {
          boxShadow: "0 0 0 1px var(--danger), 0 0 12px rgba(255, 69, 58, 0.3)",
          transition: "box-shadow 0.3s ease",
        }
      : {}),
  };

  function updateData(updates: Record<string, any>) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, ...updates },
    });
  }

  return (
    <div className="card" style={cardStyle}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconBolt
            size={18}
            style={{
              marginRight: 8,
              color: isLow ? "var(--danger)" : "var(--accent)",
            }}
          />
          PONTOS DE PODER
          <button
            className="button button--icon"
            title="Resetar para o Máximo"
            onClick={() => updateData({ current: max })}
            style={{
              width: 24,
              height: 24,
              padding: 0,
              opacity: 0.6,
              marginLeft: 8,
            }}
          >
            <IconRefresh size={14} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 0 16px 0",
        }}
      >
        {/* Barra de Progresso */}
        <div
          style={{
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: isLow ? "var(--danger)" : "var(--accent)",
              transition: "width 0.3s ease, background-color 0.3s ease",
              boxShadow: isLow ? "0 0 8px var(--danger)" : "none",
            }}
          />
        </div>

        {/* Display Principal */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: isLow ? "var(--danger)" : "var(--text)",
              lineHeight: 1,
              transition: "color 0.3s ease",
              textShadow: isLow ? "0 0 10px rgba(255, 69, 58, 0.3)" : "none",
            }}
          >
            {current}
          </span>
          <span
            style={{ fontSize: 20, color: "var(--muted)", fontWeight: 500 }}
          >
            / {max}
          </span>
        </div>

        {/* Controles */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <button
            className="button"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: "bold",
            }}
            onClick={() => updateData({ current: Math.max(0, current - 1) })}
          >
            -
          </button>

          <button
            className="button button--primary"
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: "bold",
            }}
            onClick={() => updateData({ current: Math.min(max, current + 1) })}
          >
            +
          </button>
        </div>

        {/* Configuração de Max */}
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: 0.6,
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--muted)" }}>MÁXIMO:</span>
          <input
            type="number"
            className="input"
            style={{
              width: 60,
              textAlign: "center",
              padding: "2px 4px",
              background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--border)",
            }}
            value={max}
            onChange={(e) => updateData({ max: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function ModulePowers(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  const powers = (module.data?.powers as Power[]) || [];

  const ppModule = character.modules.find((m) => m.type === "power_points");
  const ppCurrent = (ppModule?.data?.current as number) ?? null;
  const ppMax = (ppModule?.data?.max as number) ?? null;

  function updatePowers(next: Power[]) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, powers: next },
    });
  }

  function addPower() {
    const nextPower: Power = {
      id: crypto.randomUUID(),
      name: "",
      powerPoints: 0,
      range: "",
      duration: "",
      effect: "",
    };
    updatePowers([...powers, nextPower]);
  }

  function updatePower(id: string, updates: Partial<Power>) {
    updatePowers(powers.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }

  function removePower(id: string) {
    updatePowers(powers.filter((p) => p.id !== id));
  }

  function spendPowerPoints(amount: number) {
    if (!ppModule) return;
    const current = (ppModule.data?.current as number) ?? 0;
    const max = (ppModule.data?.max as number) ?? 0;
    const next = Math.max(0, current - amount);
    actions.updateCharacterModule(character.id, ppModule.id, {
      data: { ...ppModule.data, current: Math.min(next, max) },
    });
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconBolt
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          PODERES
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {ppCurrent === null || ppMax === null
            ? "Pontos de Poder: (adicione o módulo Pontos de Poder)"
            : `Pontos de Poder: ${ppCurrent} / ${ppMax}`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {powers.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              background: "rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 10px 8px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button
                  className="skill-action-btn skill-action-btn--active"
                  onClick={() => spendPowerPoints(Number(p.powerPoints) || 0)}
                  disabled={!ppModule || !p.powerPoints}
                  title={
                    !ppModule
                      ? "Módulo PP não encontrado"
                      : `Gastar ${p.powerPoints || 0} PP`
                  }
                  style={{
                    height: "100%",
                    width: 28,
                    justifyContent: "center",
                    opacity: !ppModule || !p.powerPoints ? 0.3 : 1,
                  }}
                >
                  <IconMagic size={14} />
                </button>
              </div>
              <input
                className="input"
                placeholder="Nome"
                value={p.name}
                onChange={(e) => updatePower(p.id, { name: e.target.value })}
                style={{ flex: 2 }}
              />
              <input
                className="input"
                type="number"
                placeholder="PP"
                value={Number.isFinite(p.powerPoints) ? p.powerPoints : 0}
                onChange={(e) =>
                  updatePower(p.id, { powerPoints: Number(e.target.value) })
                }
                style={{ width: 70, textAlign: "center" }}
              />
              <input
                className="input"
                placeholder="Alcance"
                value={p.range}
                onChange={(e) => updatePower(p.id, { range: e.target.value })}
                style={{ flex: 1.2 }}
              />
              <input
                className="input"
                placeholder="Duração"
                value={p.duration}
                onChange={(e) =>
                  updatePower(p.id, { duration: e.target.value })
                }
                style={{ flex: 1.2 }}
              />
              <button
                className="skill-action-btn skill-action-btn--danger"
                onClick={() => removePower(p.id)}
                title="Remover"
              >
                <IconTrash size={16} style={{ display: "block" }} />
              </button>
            </div>

            <div style={{ padding: 10 }}>
              <textarea
                className="input input--textarea"
                placeholder="Efeito"
                value={p.effect}
                onChange={(e) => updatePower(p.id, { effect: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        className="button button--ghost"
        onClick={addPower}
        style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
      >
        <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar Poder
      </button>
    </div>
  );
}

function ModuleWeapons(props: ModuleProps) {
  const { character, actions, moduleId } = props;
  const module = character.modules.find((m) => m.id === moduleId);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  if (!module) return null;

  const gridColumnStyle = {
    gridColumnStart: (module.column ?? 0) + 1,
    gridColumnEnd: `span ${module.span || 1}`,
    gridRowEnd: `span ${module.rowSpan || 1}`,
  };

  const weapons = (module.data?.weapons as Weapon[]) || [];

  function updateWeapons(next: Weapon[]) {
    actions.updateCharacterModule(character.id, moduleId, {
      data: { ...module?.data, weapons: next },
    });
  }

  function addWeapon() {
    const nextWeapon: Weapon = {
      id: crypto.randomUUID(),
      name: "",
      range: "",
      damage: "",
      ap: 0,
      rof: 1,
      weight: 0,
      notes: "",
    };
    updateWeapons([...weapons, nextWeapon]);
  }

  function updateWeapon(id: string, updates: Partial<Weapon>) {
    updateWeapons(weapons.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }

  function removeWeapon(id: string) {
    updateWeapons(weapons.filter((w) => w.id !== id));
  }

  return (
    <div className="card" style={{ position: "relative", ...gridColumnStyle }}>
      <ModuleActions
        props={props}
        module={module}
        isNotesOpen={isNotesOpen}
        setIsNotesOpen={setIsNotesOpen}
      />

      {isNotesOpen && (
        <div className="module-notes">
          <textarea
            className="input input--textarea"
            placeholder="Observações..."
            value={module.notes || ""}
            onChange={(e) =>
              actions.updateCharacterModule(character.id, moduleId, {
                notes: e.target.value,
              })
            }
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="section-header">
        <div className="section-title">
          <IconSword
            size={18}
            style={{ marginRight: 8, color: "var(--accent)" }}
          />
          ARMAS
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weapons.map((w) => (
          <div
            key={w.id}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              background: "rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 10px 8px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <input
                className="input"
                placeholder="Arma"
                value={w.name}
                onChange={(e) => updateWeapon(w.id, { name: e.target.value })}
                style={{ flex: 2 }}
              />
              <input
                className="input"
                placeholder="Distância"
                value={w.range}
                onChange={(e) => updateWeapon(w.id, { range: e.target.value })}
                style={{ width: 80 }}
                title="Distância"
              />
              <input
                className="input"
                placeholder="Dano"
                value={w.damage}
                onChange={(e) => updateWeapon(w.id, { damage: e.target.value })}
                style={{ width: 80 }}
                title="Dano"
              />
              <button
                className="skill-action-btn skill-action-btn--danger"
                onClick={() => removeWeapon(w.id)}
                title="Remover"
              >
                <IconTrash size={16} style={{ display: "block" }} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "8px 10px",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                  }}
                >
                  PA:
                </span>
                <input
                  className="input"
                  type="number"
                  value={w.ap || 0}
                  onChange={(e) =>
                    updateWeapon(w.id, { ap: Number(e.target.value) })
                  }
                  style={{
                    width: 40,
                    textAlign: "center",
                    padding: "2px 4px",
                    fontSize: 12,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                  }}
                >
                  CdT:
                </span>
                <input
                  className="input"
                  type="number"
                  value={w.rof || 1}
                  onChange={(e) =>
                    updateWeapon(w.id, { rof: Number(e.target.value) })
                  }
                  style={{
                    width: 40,
                    textAlign: "center",
                    padding: "2px 4px",
                    fontSize: 12,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Peso:
                </span>
                <input
                  className="input"
                  type="number"
                  value={w.weight || 0}
                  onChange={(e) =>
                    updateWeapon(w.id, { weight: Number(e.target.value) })
                  }
                  style={{
                    width: 40,
                    textAlign: "center",
                    padding: "2px 4px",
                    fontSize: 12,
                  }}
                />
              </div>
            </div>

            <div style={{ padding: 10 }}>
              <textarea
                className="input input--textarea"
                placeholder="Observações"
                value={w.notes}
                onChange={(e) => updateWeapon(w.id, { notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        className="button button--ghost"
        onClick={addWeapon}
        style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
      >
        <IconPlus size={14} style={{ marginRight: 6 }} /> Adicionar Arma
      </button>
    </div>
  );
}

// --- Componente Principal ---

export function CharacterSheetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, actions } = useRpgData();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);

  const character = data.characters.find((c) => c.id === id);

  useEffect(() => {
    if (!character && id) {
      navigate("/characters");
    }
  }, [character, id, navigate]);

  if (!character) return null;

  const modules = character.modules || [];

  function handleAddModule(
    type: CharacterModule["type"],
    system: CharacterModule["system"],
  ) {
    if (!character) return;
    const defaultLayout =
      type === "edges_advancements"
        ? { span: 1 as const, rowSpan: 2 as const, column: 2 as const }
        : {};
    actions.addCharacterModule(character.id, {
      type,
      system,
      ...defaultLayout,
    });
    setIsAddMenuOpen(false);
  }

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleEditAvatar() {
    if (!character) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !character) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        actions.updateCharacter(character.id, { avatarUrl: result });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      className="page"
      style={{ maxWidth: 1200, paddingBottom: 100, position: "relative" }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Sidebar de Referência */}
      <ReferenceSidebar
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
        customTrigger={
          <button
            onClick={() => setIsReferenceOpen(true)}
            title="Consultar Regras"
            style={{
              position: "absolute",
              left: -50,
              top: 70, // Alinhado com o painel de informações (Header)
              width: 40,
              height: 120, // Aumentado para acomodar o texto
              background: "var(--panel)",
              border: "1px solid var(--accent)",
              borderRadius: "8px 0 0 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--accent)",
              boxShadow: "-2px 0 10px rgba(0,0,0,0.5)",
              zIndex: 10,
              gap: 8,
              padding: "12px 0",
            }}
          >
            <IconBook size={20} />
            <span
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                fontSize: 12,
                fontWeight: "bold",
                letterSpacing: 1,
                transform: "rotate(180deg)", // Ajuste para leitura correta
              }}
            >
              CONSULTA
            </span>
          </button>
        }
      />

      {/* Botão voltar */}
      <button
        className="button button--ghost"
        style={{ marginBottom: 16, paddingLeft: 0, color: "var(--muted)" }}
        onClick={() => navigate("/characters")}
      >
        <IconChevronLeft style={{ marginRight: 6 }} />
        Voltar para Personagens
      </button>

      {/* Header Fixo */}
      <div className="char-header card" style={{ marginBottom: 24 }}>
        <div
          className="char-header__avatar"
          style={{
            backgroundImage: `url('${character.avatarUrl || "https://placehold.co/80x80/2a2a2a/FFF?text=Avatar"}')`,
          }}
          onClick={handleEditAvatar}
          title="Clique para alterar o avatar"
        >
          <div className="avatar-overlay">
            <IconEdit size={24} style={{ color: "white" }} />
          </div>
        </div>
        <div className="char-header__info">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1 className="char-header__name">{character.name}</h1>
            <button
              className="button button--ghost"
              onClick={() => setIsStoryOpen(true)}
              title="História do Personagem"
            >
              <IconScroll size={20} style={{ marginRight: 8 }} />
              História
            </button>
          </div>
          <div className="char-header__meta">
            <IconSword size={14} style={{ color: "var(--accent)" }} />
            {character.race || "Raça"} {character.class || "Classe"} • Nível{" "}
            {formatLevel(character.system, character.level)}
          </div>
        </div>
        <div className="char-header__badge">
          <IconShield size={20} />
        </div>
      </div>

      {/* Modal de História */}
      {isStoryOpen && (
        <div className="modal-overlay" onClick={() => setIsStoryOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <IconScroll size={20} />
                HISTÓRIA DO PERSONAGEM
              </h3>
              <button
                className="button button--icon"
                onClick={() => setIsStoryOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 8 }}
              >
                <IconX size={20} />
              </button>
            </div>
            <textarea
              className="input input--textarea"
              style={{
                minHeight: 400,
                fontSize: 16,
                lineHeight: 1.6,
                padding: 20,
                resize: "none",
              }}
              value={character.background || ""}
              onChange={(e) =>
                actions.updateCharacter(character.id, {
                  background: e.target.value,
                })
              }
              placeholder="Escreva a história do seu personagem aqui..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Grid de Módulos */}
      <div className="modules-grid">
        {modules.map((mod) => {
          const colIndex = mod.column ?? 0;
          const props: ModuleProps = {
            character,
            moduleId: mod.id,
            actions,
            onRemove: () => actions.removeCharacterModule(character.id, mod.id),
            onMoveUp: () =>
              actions.reorderCharacterModule(character.id, mod.id, "up"),
            onMoveDown: () =>
              actions.reorderCharacterModule(character.id, mod.id, "down"),
            onMoveLeft: () =>
              actions.moveCharacterModuleColumn(character.id, mod.id, "left"),
            onMoveRight: () =>
              actions.moveCharacterModuleColumn(character.id, mod.id, "right"),
            canMoveLeft: colIndex > 0,
            canMoveRight: colIndex < 2,
          };

          if (mod.type === "combat_stats")
            return <ModuleCombatStats key={mod.id} {...props} />;
          if (mod.type === "attributes")
            return <ModuleAttributes key={mod.id} {...props} />;
          if (mod.type === "skills")
            return <ModuleSkills key={mod.id} {...props} />;
          if (mod.type === "hindrances" || mod.type === "text_block")
            return <ModuleHindrances key={mod.id} {...props} />;
          if (mod.type === "ancestral_abilities")
            return <ModuleAncestralAbilities key={mod.id} {...props} />;
          if (mod.type === "edges_advancements")
            return <ModuleEdgesAdvancements key={mod.id} {...props} />;
          if (mod.type === "equipment")
            return <ModuleEquipment key={mod.id} {...props} />;
          if (mod.type === "power_points")
            return <ModulePowerPoints key={mod.id} {...props} />;
          if (mod.type === "powers")
            return <ModulePowers key={mod.id} {...props} />;
          if (mod.type === "weapons")
            return <ModuleWeapons key={mod.id} {...props} />;
          return null;
        })}
      </div>

      {/* Floating Menu */}
      <div className="floating-dock">
        <div style={{ position: "relative" }}>
          <button
            className="dock-btn"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          >
            <IconPlus style={{ marginRight: 6 }} />
            Adicionar Módulo
          </button>

          {isAddMenuOpen && (
            <div className="add-menu">
              <div className="add-menu__section">
                <div className="add-menu__title">Savage Pathfinder</div>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("combat_stats", "savage_pathfinder")
                  }
                >
                  <IconShield size={14} style={{ marginRight: 8 }} />
                  Combate
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("attributes", "savage_pathfinder")
                  }
                >
                  <span style={{ marginRight: 8 }}>✨</span>
                  Atributos
                </button>
                <button
                  className="add-menu__item"
                  onClick={() => handleAddModule("skills", "savage_pathfinder")}
                >
                  <IconScroll size={14} style={{ marginRight: 8 }} />
                  Perícias
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("hindrances", "savage_pathfinder")
                  }
                >
                  <IconSkull size={14} style={{ marginRight: 8 }} />
                  Complicações
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("ancestral_abilities", "savage_pathfinder")
                  }
                >
                  <IconSparkles size={14} style={{ marginRight: 8 }} />
                  Hab. Ancestrais
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("edges_advancements", "savage_pathfinder")
                  }
                >
                  <IconStar size={14} style={{ marginRight: 8 }} />
                  Vantagens e Progressos
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("equipment", "savage_pathfinder")
                  }
                >
                  <IconBackpack size={14} style={{ marginRight: 8 }} />
                  Equipamento
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("power_points", "savage_pathfinder")
                  }
                >
                  <IconBolt size={14} style={{ marginRight: 8 }} />
                  Pontos de Poder
                </button>
                <button
                  className="add-menu__item"
                  onClick={() => handleAddModule("powers", "savage_pathfinder")}
                >
                  <IconMagic size={14} style={{ marginRight: 8 }} />
                  Poderes
                </button>
                <button
                  className="add-menu__item"
                  onClick={() =>
                    handleAddModule("weapons", "savage_pathfinder")
                  }
                >
                  <IconSword size={14} style={{ marginRight: 8 }} />
                  Armas
                </button>
              </div>

              <div className="add-menu__section">
                <div className="add-menu__title">Genérico</div>
                <button
                  className="add-menu__item"
                  disabled
                  style={{ opacity: 0.5 }}
                >
                  Bloco de Texto (Em breve)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="dock-separator" />

        <button
          className="dock-btn dock-btn--danger"
          onClick={() => navigate("/characters")}
        >
          Fechar Ficha
        </button>
      </div>

      <style>{`
        .modules-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          align-items: start;
          grid-auto-flow: dense;
        }
        @media (max-width: 900px) {
          .modules-grid {
            grid-template-columns: 1fr;
          }
        }
        .modules-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 100px;
        }

        .char-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(20,20,20,0.8), rgba(40,30,30,0.6));
          border: 1px solid var(--accent);
          position: relative;
          overflow: hidden;
        }
        .char-header__avatar {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          background: url('https://placehold.co/80x80/2a2a2a/FFF?text=Avatar') center/cover;
          border: 2px solid var(--accent);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          cursor: pointer;
          position: relative;
        }
        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          border-radius: 14px;
        }
        .char-header__avatar:hover .avatar-overlay {
          opacity: 1;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s;
        }
        .modal-content {
          background: #1a1a1a;
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          padding: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .char-header__info {
          flex: 1;
        }
        .char-header__name {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .char-header__meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 14px;
          margin-top: 6px;
          font-weight: 500;
        }
        .char-header__badge {
          position: absolute;
          right: 20px;
          bottom: 20px;
          color: var(--accent);
          opacity: 0.2;
        }

        .module-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 4px;
          z-index: 10;
        }
        .module-action-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          padding: 4px;
          border-radius: 4px;
        }
        .card:hover .module-action-btn {
          opacity: 1;
        }
        .module-action-btn:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text);
        }
        .module-action-btn--active {
          opacity: 1;
          color: var(--accent);
        }
        .module-action-btn--danger:hover {
          background: var(--danger);
          color: white;
        }

        .module-notes {
          padding: 0 16px 16px 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 16px;
          animation: slideDown 0.2s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .input--textarea {
          width: 100%;
          min-height: 80px;
          resize: vertical;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          padding: 8px;
          font-family: inherit;
          font-size: 13px;
        }
        .input--textarea:focus {
          border-color: var(--accent);
          outline: none;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
          padding-right: 140px; /* Espaço para botões de ação */
          min-height: 32px;
        }
        .section-title {
          font-weight: 800;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          line-height: 1.2;
        }

        .combat-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-box {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .stat-icon {
          opacity: 0.7;
        }
        .stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--muted);
        }
        .stat-value {
          font-size: 28px;
          font-weight: 900;
          color: var(--accent);
          line-height: 1;
        }
        .stat-max {
          font-size: 14px;
          color: var(--muted);
          font-weight: 400;
        }

        .hp-bar-container {
          background: rgba(0,0,0,0.2);
          padding: 16px;
          border-radius: 12px;
        }
        .hp-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 8px;
        }
        .hp-track {
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .hp-fill {
          height: 100%;
          background: var(--danger);
          transition: width 0.3s ease;
        }
        .hp-controls {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .hp-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05);
          color: var(--text);
          cursor: pointer;
          font-weight: bold;
        }
        .hp-btn:hover {
          background: rgba(255,255,255,0.1);
        }

        .attributes-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .attribute-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dashed rgba(255,255,255,0.05);
        }
        .attribute-label {
          font-weight: 800;
          letter-spacing: 1px;
          font-size: 13px; /* Slightly smaller */
          text-align: right;
          width: 120px;
        }
        .attribute-dice {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .floating-dock {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20,20,20,0.9);
          border: 1px solid var(--accent);
          padding: 8px;
          border-radius: 16px;
          display: flex;
          gap: 8px;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 50;
        }
        .dock-separator {
          width: 1px;
          background: var(--border);
          margin: 0 4px;
        }
        .dock-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--accent);
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }
        .dock-btn:hover {
          background: rgba(255, 183, 77, 0.1);
          border-color: rgba(255, 183, 77, 0.3);
        }
        .dock-btn--danger {
          color: var(--danger);
        }
        .dock-btn--danger:hover {
          background: rgba(255, 77, 77, 0.1);
          border-color: rgba(255, 77, 77, 0.3);
        }

        .add-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 10px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          width: 200px;
          box-shadow: var(--shadow);
          overflow: hidden;
          animation: slideUp 0.2s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .add-menu__section {
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }
        .add-menu__section:last-child {
          border-bottom: none;
        }
        .add-menu__title {
          font-size: 11px;
          text-transform: uppercase;
          color: var(--muted);
          padding: 4px 12px;
          font-weight: 700;
        }
        .add-menu__item {
          display: flex;
          align-items: center;
          width: 100%;
          background: none;
          border: none;
          color: var(--text);
          padding: 8px 12px;
          cursor: pointer;
          font-size: 13px;
          text-align: left;
        }
        .add-menu__item:hover {
          background: rgba(255,255,255,0.05);
        }
        .add-menu__item:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .savage-tracks {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 8px 0;
        }
        .damage-track {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .damage-track__label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--muted);
          font-family: serif; /* Estilo mais RPG clássico */
        }
        .damage-track__boxes {
          display: flex;
          gap: 8px;
        }
        .damage-box {
          width: 36px;
          height: 36px;
          border: 2px solid var(--border);
          border-radius: 4px; /* Levemente arredondado, mas quadrado */
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: rgba(0,0,0,0.3);
          transition: all 0.2s;
          position: relative;
        }
        .damage-box:hover {
          border-color: var(--accent);
        }
        .damage-box--active {
          background: var(--danger);
          border-color: var(--danger);
          color: white;
          box-shadow: 0 0 8px rgba(255, 77, 77, 0.4);
        }
        .damage-box__val {
          font-weight: 900;
          font-size: 14px;
        }

        .incapacitated-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 60px;
          background: #2a1a1a;
          border: 2px solid var(--border);
          clip-path: polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%); /* Forma de escudo/bandeira */
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 14px; /* Alinhar visualmente com as caixas */
        }
        .incapacitated-marker:hover {
          border-color: var(--danger);
        }
        .incapacitated-marker--active {
          background: var(--danger);
          border-color: var(--danger);
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        }
        .incapacitated-label {
          writing-mode: vertical-rl;
          text-orientation: upright;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          color: var(--muted);
        }
        .incapacitated-marker--active .incapacitated-label {
          color: white;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skill-row-container {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .skill-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
        }
        .skill-dice {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .die-shape {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .die-shape:hover {
          transform: scale(1.1);
        }
        .die-shape--active {
          transform: scale(1.1);
        }
        .skill-name-input {
          flex: 1;
          background: transparent;
          border: none;
          border-bottom: 1px dashed var(--border);
          padding: 4px;
          font-size: 14px;
          color: var(--text);
        }
        .skill-name-input:focus {
          outline: none;
          border-bottom-color: var(--accent);
        }
        .skill-actions {
          display: flex;
          gap: 4px;
        }
        .skill-action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          padding: 0;
          border: none;
          outline: none;
          line-height: 0;
          color: var(--muted);
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
          flex-shrink: 0;
          opacity: 0.85;
        }
        .skill-action-btn svg {
          display: block;
        }
        .skill-row:hover .skill-action-btn {
          opacity: 1;
        }
        .skill-action-btn:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text);
        }
        .skill-action-btn:focus,
        .skill-action-btn:focus-visible {
          outline: none;
        }
        .skill-action-btn--active {
          color: var(--accent);
          opacity: 1;
        }
        .skill-action-btn--danger {
          color: var(--danger);
        }
        .skill-action-btn--danger:hover {
          background: rgba(255, 77, 77, 0.1);
        }
        .skill-note {
          padding: 0 8px 8px 8px;
          animation: slideDown 0.2s ease-out;
        }
        .skill-note-input {
          font-size: 12px;
          min-height: 40px;
        }

        .text-block-container {
          padding: 0 4px;
        }
        .text-block-input {
          width: 100%;
          min-height: 200px;
          background: transparent;
          border: none;
          color: var(--text);
          font-family: inherit;
          font-size: 14px;
          line-height: 24px;
          resize: vertical;
          background-image: linear-gradient(transparent 23px, rgba(255,255,255,0.1) 24px);
          background-size: 100% 24px;
          padding: 0;
          margin-top: 8px;
        }
        .text-block-input:focus {
          outline: none;
          background-image: linear-gradient(transparent 23px, var(--accent) 24px);
        }

        .advancement-row-container {
          margin-bottom: 0;
        }
        .advancement-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 4px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .advancement-row:hover {
          background: rgba(255,255,255,0.02);
        }
        .advancement-rank {
          font-weight: 900;
          font-size: 14px;
          width: 24px;
          text-align: center;
          color: var(--accent);
          flex-shrink: 0;
        }
        .advancement-input-wrapper {
          flex: 1;
        }
        .advancement-input {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--text);
          font-family: inherit;
          font-size: 14px;
          padding: 0;
        }
        .advancement-input:focus {
          outline: none;
        }
        .advancement-input::placeholder {
          color: rgba(255,255,255,0.2);
          font-style: italic;
        }
        
        .advancements-list {
          display: flex;
          flex-direction: column;
        }

        .equipment-base-gold {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.03);
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border: 1px solid var(--border);
        }
        .equipment-label {
          font-weight: bold;
          font-size: 13px;
          color: var(--text);
        }
        .equipment-name {
          font-weight: 500;
        }
        .equipment-number {
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
