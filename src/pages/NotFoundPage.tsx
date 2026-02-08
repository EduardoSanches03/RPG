import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Página não encontrada</h1>
          <p className="page__subtitle">O caminho que você tentou acessar não existe.</p>
        </div>
      </header>

      <div className="card card--span-12">
        <Link className="button" to="/dashboard">
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  )
}

