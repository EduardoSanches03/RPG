import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ROUTES } from "../routes";
import type { ReceivedFriendRequest } from "../../services/friendRequestApi";
import { useRpgData } from "../../store/RpgDataContext";
import { IconBubble, IconChevronLeft, IconChevronRight, IconX } from "./icons";

function statusLabel(status: "online" | "in_party" | "offline") {
  if (status === "online") return "Online";
  if (status === "in_party") return "Em partida";
  return "Offline";
}

function initials(name: string) {
  const pieces = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (pieces.length === 0) return "??";
  return pieces.map((piece) => piece.slice(0, 1).toUpperCase()).join("");
}

type SocialSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  receivedRequests: ReceivedFriendRequest[];
  processingReceivedIds: string[];
  socialFeedback?: string | null;
  onAcceptRequest: (requesterId: string) => void;
  onRejectRequest: (requesterId: string) => void;
};

export function SocialSidebar(props: SocialSidebarProps) {
  const { data } = useRpgData();
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);

  const friends = useMemo(() => data.social?.friends ?? [], [data.social?.friends]);

  const onlineCount = useMemo(
    () => friends.filter((friend) => friend.status !== "offline").length,
    [friends],
  );

  return (
    <aside
      className={props.isOpen ? "ledger-social ledger-social--open" : "ledger-social"}
      aria-label="Aba social"
    >
      <button
        type="button"
        className="ledger-social__toggle"
        onClick={props.onToggle}
        aria-controls="ledger-social-panel"
        aria-expanded={props.isOpen}
      >
        {props.isOpen ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        <span>{props.isOpen ? "Recolher social" : "Abrir social"}</span>
      </button>

      {props.isOpen ? (
        <div id="ledger-social-panel" className="ledger-social__panel" aria-hidden={!props.isOpen}>
          <header className="ledger-social__header">
            <h3>SOCIAL</h3>
            <div className="ledger-social__header-actions">
              <button
                type="button"
                className="ledger-social__requests-trigger"
                onClick={() => setIsRequestsModalOpen(true)}
                aria-label={`Abrir solicitacoes recebidas (${props.receivedRequests.length})`}
                title="Solicitacoes recebidas"
              >
                <IconBubble size={14} />
                {props.receivedRequests.length > 0 ? (
                  <span className="ledger-social__requests-count">
                    {props.receivedRequests.length}
                  </span>
                ) : null}
              </button>
              <span>{onlineCount}/{friends.length}</span>
            </div>
          </header>

          <section className="ledger-social__section">
            <div className="ledger-social__section-title">
              Amigos ({onlineCount}/{friends.length})
            </div>
            <div className="ledger-social__list">
              {friends.length === 0 ? (
                <div className="ledger-social__empty">Nenhum amigo adicionado ainda.</div>
              ) : (
                friends.map((friend) => (
                  <article key={friend.id} className="ledger-social-card">
                    <div className="ledger-social-card__avatar">{initials(friend.name)}</div>
                    <div className="ledger-social-card__main">
                      <strong>{friend.name}</strong>
                      <small className={`ledger-social-status ledger-social-status--${friend.status}`}>
                        {statusLabel(friend.status)}
                      </small>
                    </div>
                    <div className={`ledger-social-dot ledger-social-dot--${friend.status}`} />
                  </article>
                ))
              )}
            </div>
          </section>

          {props.socialFeedback ? (
            <section className="ledger-social__section">
              <div className="ledger-social__empty">{props.socialFeedback}</div>
            </section>
          ) : null}
        </div>
      ) : null}

      {isRequestsModalOpen ? (
        <div className="ledger-modal-backdrop" onClick={() => setIsRequestsModalOpen(false)}>
          <div
            className="ledger-modal ledger-modal--social"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="ledger-modal__header ledger-social-modal__header">
              <div className="ledger-social-modal__title-wrap">
                <span className="ledger-social-modal__kicker">Social</span>
                <h2>Solicitacoes Recebidas</h2>
                <p>Responda convites pendentes e abra o perfil publico para ver mais detalhes.</p>
              </div>
              <div className="ledger-social-modal__header-side">
                <span className="ledger-social-modal__badge">
                  {props.receivedRequests.length}
                </span>
                <button
                  type="button"
                  className="icon-pill"
                  title="Fechar"
                  onClick={() => setIsRequestsModalOpen(false)}
                >
                  <IconX size={12} />
                </button>
              </div>
            </header>

            <div className="ledger-social-modal__body">
              {props.receivedRequests.length === 0 ? (
                <div className="ledger-social-modal__empty">
                  <strong>Nenhuma solicitacao recebida.</strong>
                  <span>Quando alguem te adicionar, o convite vai aparecer aqui.</span>
                </div>
              ) : (
                props.receivedRequests.map((request) => {
                  const isBusy = props.processingReceivedIds.includes(request.requesterId);
                  return (
                    <article key={request.requesterId} className="ledger-social-request-row">
                      <div className="ledger-social-request-row__avatar">
                        {initials(request.displayName)}
                      </div>
                      <div className="ledger-social-request-row__body">
                        <Link
                          className="ledger-social-request-row__name"
                          to={ROUTES.publicProfile(request.requesterId)}
                          title={request.displayName}
                          onClick={() => setIsRequestsModalOpen(false)}
                        >
                          {request.displayName}
                        </Link>
                        <span className="ledger-social-request-row__handle">
                          {request.handle || "@sem-handle"}
                        </span>
                      </div>
                      <div className="ledger-social-request-row__actions">
                        <button
                          type="button"
                          className="ledger-social-inline-btn"
                          onClick={() => props.onAcceptRequest(request.requesterId)}
                          disabled={isBusy}
                        >
                          {isBusy ? "Processando..." : "Aceitar"}
                        </button>
                        <button
                          type="button"
                          className="ledger-social-inline-btn ledger-social-inline-btn--ghost"
                          onClick={() => props.onRejectRequest(request.requesterId)}
                          disabled={isBusy}
                        >
                          Recusar
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
