import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isSupabaseConfigured } from "../services/supabaseClient";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, isLoading, signInWithEmail, signUpWithEmail, signOut } =
    useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

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

  return (
    <div
      className="page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 400,
          width: "100%",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          borderRadius: 12,
        }}
      >
        <header style={{ textAlign: "center" }}>
          <h1 className="page__title" style={{ fontSize: 28, marginBottom: 8 }}>
            {isSignup ? "Criar Conta" : "Bem-vindo"}
          </h1>
          <p className="page__subtitle" style={{ fontSize: 14 }}>
            {isSignup
              ? "Registre-se para salvar seus dados na nuvem."
              : "Entre para sincronizar suas fichas."}
          </p>
        </header>

        {isLoading ? (
          <div
            style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}
          >
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            Carregando...
          </div>
        ) : user ? (
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: 16,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}
              >
                Logado como
              </div>
              <strong style={{ color: "var(--text)", fontSize: 16 }}>
                {user.email}
              </strong>
            </div>
            <button
              className="button button--danger"
              onClick={() => signOut()}
              style={{ width: "100%" }}
            >
              Sair
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--border)",
                marginBottom: 8,
              }}
            >
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    authMode === "signin"
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  color:
                    authMode === "signin" ? "var(--accent)" : "var(--muted)",
                  cursor: "pointer",
                  fontWeight: authMode === "signin" ? 600 : 400,
                  transition: "all 0.2s",
                }}
                onClick={() => {
                  setAuthError(null);
                  setAuthMode("signin");
                }}
              >
                Entrar
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    authMode === "signup"
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                  color:
                    authMode === "signup" ? "var(--accent)" : "var(--muted)",
                  cursor: "pointer",
                  fontWeight: authMode === "signup" ? 600 : 400,
                  transition: "all 0.2s",
                }}
                onClick={() => {
                  setAuthError(null);
                  setAuthMode("signup");
                }}
              >
                Registrar
              </button>
            </div>

            {!isSupabaseConfigured && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(255, 50, 50, 0.1)",
                  border: "1px solid var(--danger)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--danger)",
                  textAlign: "center",
                }}
              >
                Configuração do Supabase ausente no .env.local
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="label" style={{ fontSize: 13 }}>
                  Email
                </label>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  disabled={!isSupabaseConfigured}
                  style={{ padding: 12 }}
                />
              </div>

              <div className="field">
                <label className="label" style={{ fontSize: 13 }}>
                  Senha
                </label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  disabled={!isSupabaseConfigured}
                  style={{ padding: 12 }}
                />
              </div>

              {isSignup && (
                <div className="field">
                  <label className="label" style={{ fontSize: 13 }}>
                    Confirmar Senha
                  </label>
                  <input
                    className="input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={!isSupabaseConfigured}
                    style={{ padding: 12 }}
                  />
                </div>
              )}

              {(authError ||
                (isSignup &&
                  (!passwordsMatch ||
                    (!hasMinPassword && password.length > 0)))) && (
                <div
                  style={{
                    color: "var(--danger)",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {authError}
                  {isSignup &&
                    !hasMinPassword &&
                    password.length > 0 &&
                    "Senha deve ter no mínimo 6 caracteres."}
                  {isSignup &&
                    !passwordsMatch &&
                    confirmPassword.length > 0 &&
                    "As senhas não conferem."}
                </div>
              )}

              <button
                className="button"
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
                    navigate("/dashboard", { replace: true });
                  } catch (e: any) {
                    if (e?.status === 429) {
                      setAuthError(
                        "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
                      );
                    } else {
                      setAuthError(
                        e?.message ||
                          (isSignup
                            ? "Falha ao criar conta"
                            : "Falha ao entrar"),
                      );
                    }
                  } finally {
                    setAuthBusy(false);
                  }
                }}
                style={{
                  marginTop: 8,
                  padding: 12,
                  justifyContent: "center",
                  background: "var(--accent)",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                {authBusy
                  ? "Processando..."
                  : isSignup
                    ? "Criar Conta"
                    : "Entrar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
