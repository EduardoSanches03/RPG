import { useRpgData } from '../store/RpgDataContext'

export function NotesPage() {
  const { data, actions } = useRpgData()

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Notas</h1>
          <p className="page__subtitle">Organize ganchos, NPCs, locais, regras da mesa e qualquer coisa útil.</p>
        </div>
      </header>

      <section className="grid" aria-label="Notas da campanha">
        <div className="card card--span-12">
          <div className="field">
            <div className="label">Notas da campanha</div>
            <textarea
              className="textarea"
              value={data.notes.campaign}
              onChange={(e) => actions.setCampaignNotes(e.target.value)}
            />
          </div>
          <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>Salva automaticamente.</div>
        </div>
      </section>
    </div>
  )
}
