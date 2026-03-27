import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../app/routes";
import { IconUsers, IconBook, IconCalendar, IconSparkles } from "../app/shell/icons";
import { useAuth } from "../contexts/AuthContext";
import {
  createFriendRequest,
  listReceivedFriendRequests,
  updateFriendRequestStatus,
} from "../services/friendRequestApi";
import type { PublicProfile } from "../services/profileApi";
import { getPublicProfileById } from "../services/profileApi";
import { useRpgData } from "../store/RpgDataContext";

function avatarInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "AT";
  return parts.map((part) => part.slice(0, 1).toUpperCase()).join("");
}

export function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, actions } = useRpgData();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [hasIncomingRequest, setHasIncomingRequest] = useState(false);

  const friendIds = useMemo(
    () => new Set((data.social?.friends ?? []).map((friend) => friend.id)),
    [data.social?.friends],
  );
  const requestedIds = useMemo(
    () => new Set((data.social?.requestsSent ?? []).map((request) => request.id)),
    [data.social?.requestsSent],
  );
  const canSendInvite = Boolean(
    user && profile && !friendIds.has(profile.id) && !requestedIds.has(profile.id),
  );

  useEffect(() => {
    const id = params.id?.trim();
    if (!id) {
      setError("Perfil invalido.");
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const loaded = await getPublicProfileById(id);
        if (isCancelled) return;
        if (!loaded) {
          setProfile(null);
          setError("Perfil nao encontrado.");
        } else {
          setProfile(loaded);
        }
      } catch (caught: any) {
        if (isCancelled) return;
        setProfile(null);
        setError(caught?.message || "Nao foi possivel carregar o perfil.");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    const id = params.id?.trim();
    if (!user?.id || !id) {
      setHasIncomingRequest(false);
      return;
    }

    let isCancelled = false;

    void (async () => {
      try {
        const receivedRequests = await listReceivedFriendRequests(user.id);
        if (isCancelled) return;
        setHasIncomingRequest(
          receivedRequests.some((request) => request.requesterId === id),
        );
      } catch {
        if (isCancelled) return;
        setHasIncomingRequest(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [params.id, user?.id]);

  if (loading) {
    return (
      <div className="page profile-page">
        <div className="card profile-loading">Carregando perfil publico...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page profile-page">
        <div className="card profile-loading">
          <div>{error || "Perfil nao encontrado."}</div>
          <Link className="button button--ghost" to={ROUTES.dashboard}>
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  async function handleSendFriendRequest() {
    if (!user?.id) {
      setRequestFeedback("Faca login para enviar solicitacoes.");
      return;
    }
    if (!canSendInvite) return;

    setRequestBusy(true);
    setRequestFeedback(null);
    try {
      await createFriendRequest({
        requesterId: user.id,
        addresseeId: profile.id,
      });
      actions.sendFriendRequest({
        id: profile.id,
        name: profile.displayName,
        handle: profile.handle,
        avatarUrl: profile.avatarUrl,
      });
      setRequestFeedback(`Solicitacao enviada para ${profile.displayName}.`);
    } catch (caught: any) {
      const message = String(caught?.message || "");
      if (message.toLowerCase().includes("ja enviada")) {
        actions.sendFriendRequest({
          id: profile.id,
          name: profile.displayName,
          handle: profile.handle,
          avatarUrl: profile.avatarUrl,
        });
        setRequestFeedback("Solicitacao ja estava pendente.");
      } else if (message.toLowerCase().includes("voce ja recebeu")) {
        setHasIncomingRequest(true);
        setRequestFeedback(
          "Esse usuario ja te enviou uma solicitacao. Voce pode aceitar ou recusar abaixo.",
        );
      } else {
        setRequestFeedback(message || "Falha ao enviar solicitacao.");
      }
    } finally {
      setRequestBusy(false);
    }
  }

  async function handleUpdateIncomingRequest(status: "accepted" | "rejected") {
    if (!user?.id || !profile) return;

    setRequestBusy(true);
    setRequestFeedback(null);
    try {
      await updateFriendRequestStatus({
        requesterId: profile.id,
        addresseeId: user.id,
        status,
      });
      setHasIncomingRequest(false);
      window.dispatchEvent(new CustomEvent("social:refresh"));
      setRequestFeedback(
        status === "accepted"
          ? `Solicitacao de ${profile.displayName} aceita.`
          : `Solicitacao de ${profile.displayName} recusada.`,
      );
    } catch (caught: any) {
      setRequestFeedback(
        caught?.message || "Nao foi possivel responder a solicitacao.",
      );
    } finally {
      setRequestBusy(false);
    }
  }

  return (
    <div className="page profile-page">
      <section className="card profile-hero">
        <div className="profile-hero__avatar">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} className="profile-hero__avatar-image" />
          ) : (
            avatarInitials(profile.displayName)
          )}
        </div>
        <div className="profile-hero__body">
          <span className="profile-hero__badge">{profile.badge || "Aventureiro"}</span>
          <h1>{profile.displayName}</h1>
          <p>{profile.bio || "Sem bio publica cadastrada."}</p>
          <small>{profile.handle}</small>
        </div>
        {hasIncomingRequest ? (
          <div className="profile-hero__action-group">
            <button
              className="button profile-hero__edit-btn"
              onClick={() => {
                void handleUpdateIncomingRequest("accepted");
              }}
              disabled={requestBusy}
            >
              {requestBusy ? "Processando..." : "Aceitar"}
            </button>
            <button
              className="button button--ghost profile-hero__secondary-btn"
              onClick={() => {
                void handleUpdateIncomingRequest("rejected");
              }}
              disabled={requestBusy}
            >
              Recusar
            </button>
          </div>
        ) : (
          <button
            className="button profile-hero__edit-btn"
            onClick={() => {
              void handleSendFriendRequest();
            }}
            disabled={!canSendInvite || requestBusy}
          >
            {requestBusy
              ? "Enviando..."
              : friendIds.has(profile.id)
              ? "Ja e amigo"
              : requestedIds.has(profile.id)
                ? "Solicitacao enviada"
                : "Enviar solicitacao"}
          </button>
        )}
      </section>

      {requestFeedback ? <div className="card profile-loading">{requestFeedback}</div> : null}

      <section className="profile-stats-grid">
        <article className="card profile-stat-card">
          <small>Status Social</small>
          <strong>{friendIds.has(profile.id) ? "Amigo" : "Perfil Publico"}</strong>
          <IconUsers size={14} />
        </article>
        <article className="card profile-stat-card">
          <small>Campanhas</small>
          <strong>Publico</strong>
          <IconBook size={14} />
        </article>
        <article className="card profile-stat-card">
          <small>Atividade</small>
          <strong>Perfil</strong>
          <IconCalendar size={14} />
        </article>
        <article className="card profile-stat-card">
          <small>Nicho</small>
          <strong>RPG</strong>
          <IconSparkles size={14} />
        </article>
      </section>
    </div>
  );
}
