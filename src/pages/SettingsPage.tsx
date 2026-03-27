import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { getUserProfileSettings, upsertUserProfileSettings } from "../services/userProfileApi";
import { ROUTES } from "../app/routes";
import { useRpgData } from "../store/RpgDataContext";
import { IconBook, IconCalendar, IconCoin, IconDice, IconSparkles, IconUsers } from "../app/shell/icons";

type ProfilePreferences = {
  emailNotifications: boolean;
  obsidianTheme: boolean;
  diceSound: boolean;
};

type UserProfile = {
  badge: string;
  displayName: string;
  bio: string;
  email: string;
  preferences: ProfilePreferences;
};

const PROFILE_STORAGE_PREFIX = "a-taverna:profile:v1:";
const LEGACY_PLACEHOLDER_DISPLAY_NAME = "Mestre Arcano";
const LEGACY_PLACEHOLDER_EMAILS = new Set(["arcanista@taverna.rpg", "sem-email@taverna.rpg"]);

function normalizeStoredProfile(raw: unknown): Partial<UserProfile> {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const preferences =
    typeof source.preferences === "object" && source.preferences !== null
      ? (source.preferences as Record<string, unknown>)
      : {};

  return {
    badge: typeof source.badge === "string" ? source.badge : undefined,
    displayName: typeof source.displayName === "string" ? source.displayName : undefined,
    bio: typeof source.bio === "string" ? source.bio : undefined,
    email: typeof source.email === "string" ? source.email : undefined,
    preferences: {
      emailNotifications:
        typeof preferences.emailNotifications === "boolean"
          ? preferences.emailNotifications
          : true,
      obsidianTheme:
        typeof preferences.obsidianTheme === "boolean" ? preferences.obsidianTheme : true,
      diceSound: typeof preferences.diceSound === "boolean" ? preferences.diceSound : false,
    },
  };
}

function buildDefaultProfile(input: { displayName: string; email: string }): UserProfile {
  return {
    badge: "Grande Arquivista",
    displayName: input.displayName || "Aventureiro",
    bio: "Arquiteto de mundos e tecelao de destinos. Mestre de mesa focado em campanhas imersivas.",
    email: input.email,
    preferences: {
      emailNotifications: true,
      obsidianTheme: true,
      diceSound: false,
    },
  };
}

function resolveLoggedUserIdentity(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const metadata = user.user_metadata ?? {};
  const metadataCandidates = [
    metadata.name,
    metadata.full_name,
    metadata.display_name,
    metadata.preferred_username,
    metadata.username,
  ];
  const metadataName = metadataCandidates.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  const email = user.email?.trim() ?? "";
  const fallbackName = email.split("@")[0]?.trim() ?? "";
  const displayName = metadataName?.trim() || fallbackName || "Aventureiro";

  return { displayName, email: email || "sem-email@taverna.rpg" };
}

function shouldIgnoreStoredDisplayName(value: string | undefined) {
  if (!value) return true;
  return value.trim() === LEGACY_PLACEHOLDER_DISPLAY_NAME;
}

function shouldIgnoreStoredEmail(value: string | undefined, currentUserEmail: string) {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (LEGACY_PLACEHOLDER_EMAILS.has(normalized)) return true;
  return normalized !== currentUserEmail.trim().toLowerCase();
}

function avatarInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "MA";
  return parts.map((part) => part.slice(0, 1).toUpperCase()).join("");
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { data } = useRpgData();
  const { user, isLoading, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() =>
    buildDefaultProfile({ displayName: "Aventureiro", email: "sem-email@taverna.rpg" }),
  );

  const isSignup = authMode === "signup";
  const emailTrimmed = useMemo(() => email.trim(), [email]);
  const passwordsMatch = useMemo(
    () => !isSignup || password === confirmPassword,
    [confirmPassword, isSignup, password],
  );
  const hasMinPassword = useMemo(
    () => !isSignup || password.length >= 6,
    [isSignup, password.length],
  );
  const canSubmit = useMemo(() => {
    return Boolean(
      isSupabaseConfigured &&
        emailTrimmed &&
        password &&
        (!isSignup || (passwordsMatch && hasMinPassword)),
    );
  }, [emailTrimmed, hasMinPassword, isSignup, password, passwordsMatch]);

  useEffect(() => {
    if (!user) return;

    const identity = resolveLoggedUserIdentity({
      email: user.email,
      user_metadata:
        (user.user_metadata as Record<string, unknown> | null | undefined) ?? null,
    });
    const base = buildDefaultProfile(identity);
    let localResolved = base;

    const storageKey = `${PROFILE_STORAGE_PREFIX}${user.id}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = normalizeStoredProfile(JSON.parse(raw));
        const parsedDisplayName = shouldIgnoreStoredDisplayName(parsed.displayName)
          ? base.displayName
          : parsed.displayName ?? base.displayName;
        const parsedEmail = shouldIgnoreStoredEmail(parsed.email, identity.email)
          ? base.email
          : parsed.email ?? base.email;

        localResolved = {
          ...base,
          ...parsed,
          displayName: parsedDisplayName,
          email: parsedEmail,
          preferences: {
            ...base.preferences,
            ...(parsed.preferences ?? {}),
          },
        };
      } catch {
        localResolved = base;
      }
    }

    setProfile(localResolved);

    if (!isSupabaseConfigured) return;
    let isCancelled = false;
    void (async () => {
      try {
        const remote = await getUserProfileSettings(user.id);
        if (isCancelled || !remote) return;
        setProfile((current) => ({
          ...current,
          ...remote,
          email: identity.email,
          preferences: {
            ...current.preferences,
            ...remote.preferences,
          },
        }));
      } catch {
        // Keep local fallback when cloud profile is unavailable.
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const storageKey = `${PROFILE_STORAGE_PREFIX}${user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(profile));

    if (!isSupabaseConfigured || isEditingProfile) return;

    const timeoutId = window.setTimeout(() => {
      void upsertUserProfileSettings({
        userId: user.id,
        profile: {
          displayName: profile.displayName,
          bio: profile.bio,
          badge: profile.badge,
          preferences: profile.preferences,
        },
      }).catch(() => {
        setProfileSaveMessage("Nao foi possivel sincronizar o perfil na nuvem.");
      });
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isEditingProfile, profile, user]);

  async function handleProfileEditToggle() {
    if (!isEditingProfile) {
      setProfileSaveMessage(null);
      setIsEditingProfile(true);
      return;
    }

    if (!user || !isSupabaseConfigured) {
      setIsEditingProfile(false);
      setProfileSaveMessage("Perfil salvo localmente.");
      return;
    }

    try {
      setIsProfileSaving(true);
      await upsertUserProfileSettings({
        userId: user.id,
        profile: {
          displayName: profile.displayName,
          bio: profile.bio,
          badge: profile.badge,
          preferences: profile.preferences,
        },
      });
      setIsEditingProfile(false);
      setProfileSaveMessage("Perfil salvo com sucesso.");
    } catch (caught: any) {
      setProfileSaveMessage(caught?.message || "Falha ao salvar perfil.");
    } finally {
      setIsProfileSaving(false);
    }
  }

  const profileStats = useMemo(() => {
    const sessionsPlayed = data.sessions.length;
    const activeCampaigns = data.campaign.isRegistered ? 1 : 0;
    const charactersCreated = data.characters.length;
    const masterLevel = Math.max(1, Math.floor((sessionsPlayed + charactersCreated) / 2));
    return { sessionsPlayed, activeCampaigns, charactersCreated, masterLevel };
  }, [data.campaign.isRegistered, data.characters.length, data.sessions.length]);

  function togglePreference(key: keyof ProfilePreferences) {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key],
      },
    }));
  }

  if (isLoading) {
    return (
      <div className="page profile-page">
        <div className="card profile-loading">Carregando perfil...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="page profile-page">
        <section className="card profile-hero">
          <div className="profile-hero__avatar">{avatarInitials(profile.displayName)}</div>
          <div className="profile-hero__body">
            <span className="profile-hero__badge">{profile.badge}</span>
            <h1>{profile.displayName}</h1>
            <p>{profile.bio}</p>
          </div>
          <button
            className="button profile-hero__edit-btn"
            onClick={() => {
              void handleProfileEditToggle();
            }}
            disabled={isProfileSaving}
          >
            {isProfileSaving ? "Salvando..." : isEditingProfile ? "Salvar Perfil" : "Editar Perfil"}
          </button>
        </section>

        {profileSaveMessage ? <div className="card profile-loading">{profileSaveMessage}</div> : null}

        <section className="profile-stats-grid">
          <article className="card profile-stat-card">
            <small>Sessoes Jogadas</small>
            <strong>{profileStats.sessionsPlayed}</strong>
            <IconCalendar size={14} />
          </article>
          <article className="card profile-stat-card">
            <small>Campanhas Ativas</small>
            <strong>{profileStats.activeCampaigns}</strong>
            <IconBook size={14} />
          </article>
          <article className="card profile-stat-card">
            <small>Personagens Criados</small>
            <strong>{profileStats.charactersCreated}</strong>
            <IconUsers size={14} />
          </article>
          <article className="card profile-stat-card">
            <small>Mestre Nivel</small>
            <strong>{profileStats.masterLevel}</strong>
            <IconSparkles size={14} />
          </article>
        </section>

        <section className="profile-content-grid">
          <article className="card profile-settings-card">
            <h2>User Settings</h2>
            <div className="field">
              <label className="label">Nome de Exibicao</label>
              <input
                className="input"
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, displayName: event.target.value }))
                }
                disabled={!isEditingProfile}
              />
            </div>
            <div className="field">
              <label className="label">Bio</label>
              <textarea
                className="textarea"
                value={profile.bio}
                onChange={(event) => setProfile((prev) => ({ ...prev, bio: event.target.value }))}
                disabled={!isEditingProfile}
                rows={4}
              />
            </div>
            <div className="field">
              <label className="label">E-mail</label>
              <input className="input" value={profile.email} disabled />
            </div>
            <button className="button button--danger profile-signout" onClick={() => signOut()}>
              Sair da conta
            </button>
          </article>

          <article className="card profile-preferences-card">
            <h2>Preferences</h2>
            <div className="profile-pref-list">
              <button
                type="button"
                className="profile-pref-item"
                onClick={() => togglePreference("emailNotifications")}
                role="switch"
                aria-checked={profile.preferences.emailNotifications}
              >
                <div>
                  <strong>Notificacoes por e-mail</strong>
                  <small>Alertas de novas sessoes</small>
                </div>
                <span
                  className={
                    profile.preferences.emailNotifications
                      ? "profile-toggle profile-toggle--on"
                      : "profile-toggle"
                  }
                >
                  <span />
                </span>
              </button>

              <button
                type="button"
                className="profile-pref-item"
                onClick={() => togglePreference("obsidianTheme")}
                role="switch"
                aria-checked={profile.preferences.obsidianTheme}
              >
                <div>
                  <strong>Tema Escuro (sempre on)</strong>
                  <small>Sistema fixo em Obsidian</small>
                </div>
                <span
                  className={
                    profile.preferences.obsidianTheme
                      ? "profile-toggle profile-toggle--on"
                      : "profile-toggle"
                  }
                >
                  <span />
                </span>
              </button>

              <button
                type="button"
                className="profile-pref-item"
                onClick={() => togglePreference("diceSound")}
                role="switch"
                aria-checked={profile.preferences.diceSound}
              >
                <div>
                  <strong>Som de Dados</strong>
                  <small>Efeitos sonoros imersivos</small>
                </div>
                <span
                  className={
                    profile.preferences.diceSound
                      ? "profile-toggle profile-toggle--on"
                      : "profile-toggle"
                  }
                >
                  <span />
                </span>
              </button>
            </div>

            <div className="profile-preferences-footnote">
              <IconCoin size={14} />
              <span>Configuracoes salvas no perfil do usuario e em fallback local.</span>
              <IconDice size={14} />
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="page profile-auth-page">
      <div className="card profile-auth-card">
        <header className="profile-auth-card__header">
          <h1 className="page__title">{isSignup ? "Criar Conta" : "Bem-vindo"}</h1>
          <p className="page__subtitle">
            {isSignup
              ? "Registre-se para salvar seus dados na nuvem."
              : "Entre para sincronizar suas fichas."}
          </p>
        </header>

        <div className="profile-auth-tabs">
          <button
            className={authMode === "signin" ? "profile-auth-tab profile-auth-tab--active" : "profile-auth-tab"}
            onClick={() => {
              setAuthError(null);
              setAuthMode("signin");
            }}
          >
            Entrar
          </button>
          <button
            className={authMode === "signup" ? "profile-auth-tab profile-auth-tab--active" : "profile-auth-tab"}
            onClick={() => {
              setAuthError(null);
              setAuthMode("signup");
            }}
          >
            Registrar
          </button>
        </div>

        {!isSupabaseConfigured && (
          <div className="profile-auth-warning">
            Configuracao do Supabase ausente no .env.local
          </div>
        )}

        <div className="profile-auth-form">
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              disabled={!isSupabaseConfigured}
            />
          </div>

          <div className="field">
            <label className="label">Senha</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              autoComplete={isSignup ? "new-password" : "current-password"}
              disabled={!isSupabaseConfigured}
            />
          </div>

          {isSignup && (
            <div className="field">
              <label className="label">Confirmar Senha</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="********"
                autoComplete="new-password"
                disabled={!isSupabaseConfigured}
              />
            </div>
          )}

          {(authError ||
            (isSignup && (!passwordsMatch || (!hasMinPassword && password.length > 0)))) && (
            <div className="profile-auth-error">
              {authError}
              {isSignup &&
                !hasMinPassword &&
                password.length > 0 &&
                "Senha deve ter no minimo 6 caracteres."}
              {isSignup && !passwordsMatch && confirmPassword.length > 0 && "As senhas nao conferem."}
            </div>
          )}

          <button
            className="button profile-auth-submit"
            disabled={authBusy || !canSubmit}
            onClick={async () => {
              try {
                setAuthBusy(true);
                setAuthError(null);
                if (isSignup) {
                  await signUpWithEmail(emailTrimmed, password);
                } else {
                  await signInWithEmail(emailTrimmed, password);
                }
                navigate(ROUTES.dashboard, { replace: true });
              } catch (error: any) {
                if (error?.status === 429) {
                  setAuthError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
                } else {
                  setAuthError(error?.message || (isSignup ? "Falha ao criar conta" : "Falha ao entrar"));
                }
              } finally {
                setAuthBusy(false);
              }
            }}
          >
            {authBusy ? "Processando..." : isSignup ? "Criar Conta" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
