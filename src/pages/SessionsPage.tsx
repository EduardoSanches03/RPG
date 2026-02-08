import { useMemo, useState } from 'react'
import { useRpgData } from '../store/RpgDataContext'

export function SessionsPage() {
  const { data, actions } = useRpgData()
  const [title, setTitle] = useState('')
  const [scheduledLocal, setScheduledLocal] = useState(() => toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))

  const canAdd = title.trim().length > 0 && scheduledLocal.trim().length > 0

  const rows = useMemo(() => {
    return [...data.sessions].sort(
      (a, b) => new Date(b.scheduledAtIso).getTime() - new Date(a.scheduledAtIso).getTime(),
    )
  }, [data.sessions])

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Sessões</h1>
          <p className="page__subtitle">Planeje as próximas sessões e acompanhe o histórico.</p>
        </div>
      </header>

      <section className="grid" aria-label="Criar sessão">
        <div className="card card--span-12">
          <div className="toolbar">
            <div className="field" style={{ minWidth: 260, flex: 1 }}>
              <div className="label">Título</div>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sessão 2" />
            </div>
            <div className="field" style={{ minWidth: 260 }}>
              <div className="label">Agendada para</div>
              <input
                className="input"
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                className="button"
                disabled={!canAdd}
                onClick={() => {
                  actions.addSession({ title, scheduledAtIso: toIsoFromLocalInput(scheduledLocal) })
                  setTitle('')
                }}
              >
                Criar
              </button>
            </div>
          </div>
        </div>

        <div className="card card--span-12">
          <table className="table">
            <thead>
              <tr>
                <th>Sessão</th>
                <th>Data</th>
                <th style={{ width: 140 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--muted)' }}>
                    Nenhuma sessão cadastrada ainda.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.title}</td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(s.scheduledAtIso)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="button button--danger" onClick={() => actions.removeSession(s.id)}>
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function toLocalInputValue(d: Date) {
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const min = pad2(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function toIsoFromLocalInput(value: string) {
  const d = new Date(value)
  return d.toISOString()
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${day} ${time}`
}
