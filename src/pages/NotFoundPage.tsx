import { Link } from "react-router-dom";
import { ROUTES } from "../app/routes";

export function NotFoundPage() {
  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Pagina nao encontrada</h1>
          <p className="page__subtitle">O caminho que voce tentou acessar nao existe.</p>
        </div>
      </header>

      <div className="card card--span-12">
        <Link className="button" to={ROUTES.dashboard}>
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}

