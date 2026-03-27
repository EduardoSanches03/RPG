import { type ComponentType, type CSSProperties, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ROUTES } from "../routes";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import { RpgDataProvider } from "../../store/RpgDataProvider";
import { useRpgData } from "../../store/RpgDataContext";
import { getRpgSystemLabel, RPG_SYSTEM_OPTIONS } from "../../domain/rpgSystems";
import {
  createFriendRequest,
  type FriendProfile,
  listAcceptedFriends,
  listReceivedFriendRequests,
  listSentFriendRequests,
  updateFriendRequestStatus,
  type ReceivedFriendRequest,
  type SentFriendRequest,
} from "../../services/friendRequestApi";
import { searchPublicProfiles, type PublicProfile } from "../../services/profileApi";
import { subscribeToSocialPresence } from "../../services/socialPresence";
import { SocialSidebar } from "./SocialSidebar";
import {
  IconBook,
  IconCalendar,
  IconD20Mark,
  IconGrid,
  IconMapPin,
  IconSkull,
  IconUsers,
  IconX,
} from "./icons";

type SideNavItem = {
  key: string;
  label: string;
  to?: string;
  Icon: ComponentType<{ size?: number; style?: CSSProperties; className?: string }>;
  isSoon?: boolean;
};

const sideNavItems: SideNavItem[] = [
  { key: "dashboard", label: "Painel", to: ROUTES.dashboard, Icon: IconGrid },
  { key: "characters", label: "Personagens", to: ROUTES.characters, Icon: IconUsers },
  { key: "sessions", label: "Sessoes", to: ROUTES.sessions, Icon: IconCalendar },
  { key: "lore", label: "Historia e Notas", to: ROUTES.notes, Icon: IconBook },
  { key: "bestiary", label: "Bestiario", Icon: IconSkull, isSoon: true },
  { key: "world-map", label: "Mapa Mundi", Icon: IconMapPin, isSoon: true },
];

function initialsLabel(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "??";
  return parts.map((part) => part.slice(0, 1).toUpperCase()).join("");
}

export function AppShell() {
  return (
    <AuthProvider>
      <RpgDataProvider>
        <AppShellContent />
      </RpgDataProvider>
    </AuthProvider>
  );
}

function AppShellContent() {
  const { user } = useAuth();
  const { data, actions } = useRpgData();
  const availableSystemIds = useMemo(
    () => new Set(RPG_SYSTEM_OPTIONS.map((option) => option.id)),
    [],
  );
  const resolveSystemId = (value: string | undefined) =>
    value && availableSystemIds.has(value) ? value : "savage_pathfinder";
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState(data.campaign.name || "");
  const [campaignSystem, setCampaignSystem] = useState(resolveSystemId(data.campaign.system));
  const [campaignRole, setCampaignRole] = useState<"mestre" | "jogador">(
    data.campaign.role ?? "mestre",
  );
  const [campaignLocale, setCampaignLocale] = useState(data.campaign.locale ?? "pt-BR");
  const [campaignTimeZone, setCampaignTimeZone] = useState(
    data.campaign.timeZone ?? "America/Sao_Paulo",
  );
  const [campaignPartyMemberIds, setCampaignPartyMemberIds] = useState<string[]>(
    data.campaign.partyMemberIds ?? [],
  );
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<PublicProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [requestingUserIds, setRequestingUserIds] = useState<string[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ReceivedFriendRequest[]>([]);
  const [processingReceivedIds, setProcessingReceivedIds] = useState<string[]>([]);
  const [socialFeedback, setSocialFeedback] = useState<string | null>(null);
  const [friendProfiles, setFriendProfiles] = useState<FriendProfile[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const userLabel = useMemo(() => {
    const metaName = (user?.user_metadata as { name?: unknown } | undefined)?.name;
    if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
    const email = user?.email ?? "";
    if (!email) return "Mestre";
    return email.split("@")[0] || email;
  }, [user]);

  const avatarLabel = userLabel.slice(0, 2).toUpperCase();

  const mobileNavItems = useMemo(() => sideNavItems.filter((item) => item.to), []);
  const isCampaignRegistered = data.campaign.isRegistered ?? false;
  const friendIds = useMemo(
    () => new Set((data.social?.friends ?? []).map((friend) => friend.id)),
    [data.social?.friends],
  );
  const requestedIds = useMemo(
    () => new Set((data.social?.requestsSent ?? []).map((request) => request.id)),
    [data.social?.requestsSent],
  );
  const incomingRequestIds = useMemo(
    () => new Set(receivedRequests.map((request) => request.requesterId)),
    [receivedRequests],
  );

  function mapFriendStatus(friends: FriendProfile[]) {
    return friends.map((friend) => {
      const isOnline = onlineUserIds.has(friend.id);
      return {
        id: friend.id,
        name: friend.displayName,
        status: (isOnline ? "online" : "offline") as const,
        activity: isOnline ? "Online" : "Offline",
        avatarUrl: friend.avatarUrl,
      };
    });
  }

  async function syncSocialData(userId: string) {
    let sentRequests: SentFriendRequest[] = [];

    try {
      sentRequests = await listSentFriendRequests(userId);
      actions.setSentFriendRequests(
        sentRequests.map((request) => ({
          id: request.addresseeId,
          name: request.displayName,
          handle: request.handle,
          avatarUrl: request.avatarUrl,
          sentAtIso: request.sentAtIso,
          status: request.status,
        })),
      );
    } catch {
      // Keep local state as fallback when cloud is unavailable.
    }

    try {
      const incoming = await listReceivedFriendRequests(userId);
      setReceivedRequests(incoming);
    } catch {
      // Keep local state as fallback when cloud is unavailable.
    }

    try {
      const friends = await listAcceptedFriends(userId);
      setFriendProfiles(friends);
    } catch {
      // Keep local state as fallback when cloud is unavailable.
    }

    return sentRequests;
  }

  useEffect(() => {
    if (!user?.id) {
      setReceivedRequests([]);
      setFriendProfiles([]);
      setOnlineUserIds(new Set());
      return;
    }
    let isCancelled = false;

    void (async () => {
      await syncSocialData(user.id);
      if (isCancelled) return;
    })();

    return () => {
      isCancelled = true;
    };
  }, [actions, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    function handleSocialRefresh() {
      void syncSocialData(user.id);
    }

    window.addEventListener("social:refresh", handleSocialRefresh);
    return () => {
      window.removeEventListener("social:refresh", handleSocialRefresh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    return subscribeToSocialPresence(user.id, (snapshot) => {
      setOnlineUserIds(snapshot);
    });
  }, [user?.id]);

  useEffect(() => {
    actions.setSocialFriends(mapFriendStatus(friendProfiles));
  }, [actions, friendProfiles, onlineUserIds]);

  useEffect(() => {
    const query = userSearch.trim();
    if (!query) {
      setUserSearchResults([]);
      setSearchError(null);
      setIsSearchingUsers(false);
      return;
    }

    let isCancelled = false;
    setIsSearchingUsers(true);
    setSearchError(null);

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const profiles = await searchPublicProfiles(query, 6);
          if (isCancelled) return;
          setUserSearchResults(
            user?.id ? profiles.filter((profile) => profile.id !== user.id) : profiles,
          );
        } catch (caught: any) {
          if (isCancelled) return;
          setUserSearchResults([]);
          setSearchError(caught?.message || "Erro ao consultar perfis no banco.");
        } finally {
          if (!isCancelled) setIsSearchingUsers(false);
        }
      })();
    }, 250);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [user?.id, userSearch]);

  function openCampaignModal() {
    setCampaignName(data.campaign.name || "");
    setCampaignSystem(resolveSystemId(data.campaign.system));
    setCampaignRole(data.campaign.role ?? "mestre");
    setCampaignLocale(data.campaign.locale ?? "pt-BR");
    setCampaignTimeZone(data.campaign.timeZone ?? "America/Sao_Paulo");
    setCampaignPartyMemberIds(data.campaign.partyMemberIds ?? []);
    setIsCampaignModalOpen(true);
  }

  function closeCampaignModal() {
    setIsCampaignModalOpen(false);
  }

  function saveCampaignRegistration() {
    const trimmedName = campaignName.trim();
    const trimmedSystem = campaignSystem.trim();
    const trimmedLocale = campaignLocale.trim();
    const trimmedTimeZone = campaignTimeZone.trim();
    if (!trimmedName || !trimmedSystem || !trimmedLocale || !trimmedTimeZone) {
      return;
    }

    actions.registerCampaign({
      name: trimmedName,
      system: trimmedSystem,
      role: campaignRole,
      locale: trimmedLocale,
      timeZone: trimmedTimeZone,
    });
    actions.setCampaignPartyMembers(campaignPartyMemberIds);
    closeCampaignModal();
  }

  function toggleCampaignPartyMember(characterId: string) {
    setCampaignPartyMemberIds((current) => {
      const exists = current.includes(characterId);
      if (exists) return current.filter((item) => item !== characterId);
      return [...current, characterId];
    });
  }

  async function sendFriendRequest(entry: PublicProfile) {
    if (!user?.id) {
      setSearchFeedback("Faca login para enviar solicitacoes de amizade.");
      return;
    }
    if (friendIds.has(entry.id) || requestedIds.has(entry.id) || incomingRequestIds.has(entry.id)) {
      return;
    }

    setRequestingUserIds((current) => (current.includes(entry.id) ? current : [...current, entry.id]));
    try {
      await createFriendRequest({
        requesterId: user.id,
        addresseeId: entry.id,
      });
      actions.sendFriendRequest({
        id: entry.id,
        name: entry.displayName,
        handle: entry.handle,
        avatarUrl: entry.avatarUrl,
      });
      setSearchFeedback(`Solicitacao enviada para ${entry.displayName}.`);
    } catch (caught: any) {
      const message = String(caught?.message || "");
      if (message.toLowerCase().includes("ja enviada")) {
        actions.sendFriendRequest({
          id: entry.id,
          name: entry.displayName,
          handle: entry.handle,
          avatarUrl: entry.avatarUrl,
        });
        setSearchFeedback(`Solicitacao ja existente para ${entry.displayName}.`);
      } else if (message.toLowerCase().includes("voce ja recebeu")) {
        await syncSocialData(user.id);
        setSearchFeedback(
          `Esse usuario ja te enviou uma solicitacao. Voce pode aceitar ou recusar.`,
        );
      } else {
        setSearchFeedback(message || "Falha ao enviar solicitacao.");
      }
    } finally {
      setRequestingUserIds((current) => current.filter((id) => id !== entry.id));
    }
  }

  async function handleAcceptFriendRequest(requesterId: string) {
    if (!user?.id) return;
    const normalizedRequesterId = requesterId.trim();
    if (!normalizedRequesterId) return;

    setProcessingReceivedIds((current) =>
      current.includes(normalizedRequesterId) ? current : [...current, normalizedRequesterId],
    );
    setSocialFeedback(null);

    try {
      await updateFriendRequestStatus({
        requesterId: normalizedRequesterId,
        addresseeId: user.id,
        status: "accepted",
      });
      await syncSocialData(user.id);
      setSocialFeedback("Solicitacao aceita com sucesso.");
    } catch (caught: any) {
      setSocialFeedback(caught?.message || "Nao foi possivel aceitar a solicitacao.");
    } finally {
      setProcessingReceivedIds((current) =>
        current.filter((id) => id !== normalizedRequesterId),
      );
    }
  }

  async function handleRejectFriendRequest(requesterId: string) {
    if (!user?.id) return;
    const normalizedRequesterId = requesterId.trim();
    if (!normalizedRequesterId) return;

    setProcessingReceivedIds((current) =>
      current.includes(normalizedRequesterId) ? current : [...current, normalizedRequesterId],
    );
    setSocialFeedback(null);

    try {
      await updateFriendRequestStatus({
        requesterId: normalizedRequesterId,
        addresseeId: user.id,
        status: "rejected",
      });
      await syncSocialData(user.id);
      setSocialFeedback("Solicitacao recusada.");
    } catch (caught: any) {
      setSocialFeedback(caught?.message || "Nao foi possivel recusar a solicitacao.");
    } finally {
      setProcessingReceivedIds((current) =>
        current.filter((id) => id !== normalizedRequesterId),
      );
    }
  }

  return (
    <div className="app-shell obsidian-shell">
      <header className="ledger-topbar">
        <div className="ledger-topbar__left" aria-label="Marca">
          <span className="ledger-topbar__glyph" aria-hidden="true">
            <IconD20Mark size={20} />
          </span>
          <span className="ledger-topbar__brand">A Taverna</span>
        </div>

        <div className="ledger-topbar__center">
          <button
            type="button"
            className="ledger-topbar__campaign-trigger"
            onClick={openCampaignModal}
          >
            <span className="ledger-topbar__campaign-meta">
              {isCampaignRegistered ? "Campanha Ativa" : "Campanha Nao Registrada"}
            </span>
            <strong>{data.campaign.name || "Registrar Campanha"}</strong>
            <span className="ledger-topbar__campaign-system">
              {getRpgSystemLabel(data.campaign.system)}
            </span>
            {!isCampaignRegistered ? (
              <span className="campaign-flag">CONFIGURAR</span>
            ) : null}
          </button>
        </div>

        <div className="ledger-topbar__right">
          <div className="ledger-topbar__search-wrap">
            <label className="ledger-topbar__search" aria-label="Buscar usuarios da plataforma">
              <input
                type="search"
                placeholder="Buscar usuarios..."
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  if (searchFeedback) setSearchFeedback(null);
                }}
              />
            </label>
            {userSearch.trim().length > 0 ? (
              <div className="user-search-dropdown" role="listbox" aria-label="Resultados de usuarios">
                {isSearchingUsers ? (
                  <div className="user-search-empty">Buscando perfis no banco...</div>
                ) : searchError ? (
                  <div className="user-search-empty">{searchError}</div>
                ) : userSearchResults.length === 0 ? (
                  <div className="user-search-empty">Nenhum usuario encontrado.</div>
                ) : (
                  userSearchResults.map((entry) => {
                    const isFriend = friendIds.has(entry.id);
                    const isRequested = requestedIds.has(entry.id);
                    const hasIncomingRequest = incomingRequestIds.has(entry.id);
                    const isSending = requestingUserIds.includes(entry.id);
                    const isProcessingIncoming = processingReceivedIds.includes(entry.id);
                    return (
                      <article key={entry.id} className="user-search-result">
                        <div className="user-search-result__avatar">
                          {initialsLabel(entry.displayName)}
                        </div>
                        <div className="user-search-result__body">
                          <strong>{entry.displayName}</strong>
                          <small>{entry.handle}</small>
                        </div>
                        <div className="user-search-result__actions">
                          <NavLink
                            className="button button--ghost user-search-action"
                            to={ROUTES.publicProfile(entry.id)}
                            onClick={() => {
                              setUserSearch("");
                              setUserSearchResults([]);
                            }}
                          >
                            Ver perfil
                          </NavLink>
                          {hasIncomingRequest ? (
                            <>
                              <button
                                type="button"
                                className="button user-search-action"
                                onClick={() => {
                                  void handleAcceptFriendRequest(entry.id);
                                }}
                                disabled={isProcessingIncoming}
                              >
                                {isProcessingIncoming ? "Processando..." : "Aceitar"}
                              </button>
                              <button
                                type="button"
                                className="button button--ghost user-search-action"
                                onClick={() => {
                                  void handleRejectFriendRequest(entry.id);
                                }}
                                disabled={isProcessingIncoming}
                              >
                                Recusar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="button user-search-action"
                              onClick={() => {
                                void sendFriendRequest(entry);
                              }}
                              disabled={isFriend || isRequested || isSending}
                            >
                              {isSending
                                ? "Enviando..."
                                : isFriend
                                ? "Ja e amigo"
                                : isRequested
                                  ? "Solicitado"
                                  : "Solicitar"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            ) : null}
            {searchFeedback ? <div className="user-search-feedback">{searchFeedback}</div> : null}
          </div>
          <NavLink className="avatar-pill" title={userLabel} to={ROUTES.login}>
            {avatarLabel}
          </NavLink>
        </div>
      </header>

      <div className={isSocialOpen ? "app-shell__body app-shell__body--social-open" : "app-shell__body"}>
        <aside className="ledger-sidenav" aria-label="Navegacao principal">
          <nav className="ledger-nav">
            {sideNavItems.map((item) => {
              if (!item.to) {
                return (
                  <button key={item.key} type="button" className="ledger-link ledger-link--soon">
                    <span className="ledger-link__icon" aria-hidden="true">
                      <item.Icon size={16} />
                    </span>
                    <span>{item.label}</span>
                    {item.isSoon ? <span className="soon-pill">EM BREVE</span> : null}
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "ledger-link ledger-link--active" : "ledger-link"
                  }
                >
                  <span className="ledger-link__icon" aria-hidden="true">
                    <item.Icon size={16} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="main">
          <nav className="mobile-quick-nav" aria-label="Navegacao mobile">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to as string}
                className={({ isActive }) =>
                  isActive ? "mobile-quick-link mobile-quick-link--active" : "mobile-quick-link"
                }
              >
                <item.Icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </main>

        <SocialSidebar
          isOpen={isSocialOpen}
          onToggle={() => setIsSocialOpen((current) => !current)}
          receivedRequests={receivedRequests}
          processingReceivedIds={processingReceivedIds}
          socialFeedback={socialFeedback}
          onAcceptRequest={(requesterId) => {
            void handleAcceptFriendRequest(requesterId);
          }}
          onRejectRequest={(requesterId) => {
            void handleRejectFriendRequest(requesterId);
          }}
        />
      </div>

      {isCampaignModalOpen ? (
        <div className="ledger-modal-backdrop" onClick={closeCampaignModal}>
          <div className="ledger-modal" onClick={(event) => event.stopPropagation()}>
            <header className="ledger-modal__header">
              <h2>Registrar Campanha</h2>
              <button className="icon-pill" title="Fechar" onClick={closeCampaignModal}>
                <IconX size={12} />
              </button>
            </header>

            <div className="field">
              <label className="label">Nome da Campanha</label>
              <input
                className="input"
                autoFocus
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                placeholder="Ex: Sombras sobre Eldoria"
              />
            </div>

            <div className="ledger-modal__row">
              <div className="field">
                <label className="label">Sistema</label>
                <select
                  className="input"
                  value={campaignSystem}
                  onChange={(event) => setCampaignSystem(event.target.value)}
                >
                  {RPG_SYSTEM_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Papel</label>
                <select
                  className="input"
                  value={campaignRole}
                  onChange={(event) =>
                    setCampaignRole(event.target.value as "mestre" | "jogador")
                  }
                >
                  <option value="mestre">Mestre</option>
                  <option value="jogador">Jogador</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Idioma</label>
                <select
                  className="input"
                  value={campaignLocale}
                  onChange={(event) => setCampaignLocale(event.target.value)}
                >
                  <option value="pt-BR">pt-BR</option>
                  <option value="en-US">en-US</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Fuso Horario</label>
              <select
                className="input"
                value={campaignTimeZone}
                onChange={(event) => setCampaignTimeZone(event.target.value)}
              >
                <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                <option value="America/Manaus">America/Manaus</option>
                <option value="America/Fortaleza">America/Fortaleza</option>
                <option value="Europe/Lisbon">Europe/Lisbon</option>
              </select>
            </div>

            <div className="field">
              <label className="label">Party da Campanha</label>
              <div className="campaign-party-menu">
                {data.characters.length === 0 ? (
                  <div className="campaign-party-menu__empty">
                    Nenhum personagem criado ainda.
                  </div>
                ) : (
                  data.characters.map((character) => {
                    const isChecked = campaignPartyMemberIds.includes(character.id);
                    return (
                      <label key={character.id} className="campaign-party-menu__item">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCampaignPartyMember(character.id)}
                        />
                        <span className="campaign-party-menu__name">{character.name}</span>
                        <small>{getRpgSystemLabel(character.system)}</small>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="ledger-modal__actions">
              <button className="button button--ghost" onClick={closeCampaignModal}>
                Cancelar
              </button>
              <button
                className="button"
                onClick={saveCampaignRegistration}
                disabled={
                  !campaignName.trim() ||
                  !campaignSystem.trim() ||
                  !campaignLocale.trim() ||
                  !campaignTimeZone.trim()
                }
              >
                Salvar Campanha
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
