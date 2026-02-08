import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRpgData } from '../store/RpgDataContext'

export function DashboardPage() {
  const { data } = useRpgData()

  const nextSession = useMemo(() => {
    const upcoming = [...data.sessions].sort(
      (a, b) => new Date(a.scheduledAtIso).getTime() - new Date(b.scheduledAtIso).getTime(),
    )
    return upcoming[0]
  }, [data.sessions])

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">{data.campaign.name}</h1>
          <p className="page__subtitle">Sistema: {data.campaign.system}</p>
        </div>
      </header>

      <section className="grid" aria-label="Resumo">
        <div className="card card--span-4">
          <div className="card__kicker">Personagens</div>
          <div className="card__value">{data.characters.length}</div>
        </div>
        <div className="card card--span-4">
          <div className="card__kicker">Sessões</div>
          <div className="card__value">{data.sessions.length}</div>
        </div>
        <div className="card card--span-4">
          <div className="card__kicker">Próxima sessão</div>
          <div className="card__value">{nextSession ? formatDate(nextSession.scheduledAtIso) : '—'}</div>
        </div>

        <div className="card card--span-8">
          <div className="card__kicker">Notas rápidas</div>
          <div style={{ marginTop: 10, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
            {data.notes.campaign.trim() ? data.notes.campaign : 'Sem notas ainda.'}
          </div>
        </div>
        <div className="card card--span-4">
          <div className="card__kicker">Atalhos</div>
          <div className="toolbar" style={{ marginTop: 10 }}>
            <Link className="button button--ghost" to="/characters">
              Adicionar personagem
            </Link>
            <Link className="button button--ghost" to="/sessions">
              Criar sessão
            </Link>
            <Link className="button button--ghost" to="/notes">
              Editar notas
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${day} ${time}`
}
