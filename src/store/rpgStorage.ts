import type { RpgDataV1 } from '../domain/rpg'

const STORAGE_KEY = 'rpg-dashboard:data'

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createSeedData(): RpgDataV1 {
  const createdAtIso = nowIso()

  return {
    version: 1,
    campaign: {
      id: createId(),
      name: 'Minha Campanha',
      system: 'RPG',
      createdAtIso,
    },
    characters: [
      {
        id: createId(),
        name: 'Artheon',
        system: 'savage_pathfinder',
        playerName: 'Jogador 1',
        createdAtIso,
        modules: [
          { id: createId(), type: 'combat_stats', system: 'savage_pathfinder' },
          { id: createId(), type: 'attributes', system: 'savage_pathfinder' },
        ],
      },
      {
        id: createId(),
        name: 'Lys',
        system: 'savage_pathfinder',
        playerName: 'Jogador 2',
        createdAtIso,
        modules: [
          { id: createId(), type: 'combat_stats', system: 'savage_pathfinder' },
          { id: createId(), type: 'attributes', system: 'savage_pathfinder' },
        ],
      },
    ],
    sessions: [
      {
        id: createId(),
        title: 'Sessão 1',
        scheduledAtIso: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAtIso,
      },
    ],
    notes: {
      campaign: 'Resumo da campanha, ganchos, NPCs importantes...',
    },
  }
}

export function loadRpgData(): RpgDataV1 {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createSeedData()

  try {
    const parsed = JSON.parse(raw) as unknown
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as { version?: unknown }).version === 1
    ) {
      const data = parsed as RpgDataV1
      // Migração segura para garantir modules
      data.characters = data.characters.map((c) => ({
        ...c,
        modules: c.modules || [],
      }))
      return data
    }
    return createSeedData()
  } catch {
    return createSeedData()
  }
}

export function saveRpgData(next: RpgDataV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function newId() {
  return createId()
}

export function newIsoNow() {
  return nowIso()
}

