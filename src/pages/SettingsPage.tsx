import { useState } from 'react'
import { useRpgData } from '../store/RpgDataContext'

export function SettingsPage() {
  const { data, actions } = useRpgData()
  const [name, setName] = useState(data.campaign.name)
  const [system, setSystem] = useState(data.campaign.system)

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Configurações</h1>
          <p className="page__subtitle">Personalize sua campanha e ajuste preferências.</p>
        </div>
      </header>

      <section className="grid" aria-label="Campanha">
        <div className="card card--span-12">
          <div className="grid">
            <div className="card card--span-6 card--flat">
              <div className="field">
                <div className="label">Nome da campanha</div>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="card card--span-6 card--flat">
              <div className="field">
                <div className="label">Sistema</div>
                <input className="input" value={system} onChange={(e) => setSystem(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="toolbar" style={{ marginTop: 10, justifyContent: 'space-between' }}>
            <button
              className="button button--danger"
              onClick={() => {
                actions.resetToSeed()
              }}
            >
              Resetar dados
            </button>
            <button
              className="button"
              onClick={() => {
                actions.setCampaignName(name)
                actions.setCampaignSystem(system)
              }}
            >
              Salvar
            </button>
          </div>

          <div style={{ marginTop: 10, color: 'var(--muted)', fontSize: 13 }}>
            Dados ficam salvos no seu navegador (localStorage).
          </div>
        </div>
      </section>
    </div>
  )
}
