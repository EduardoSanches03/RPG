import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    const client = supabase;

    let isCancelled = false;
    const timeoutMs = 5000;

    void Promise.race([
      client.auth.getSession(),
      new Promise<never>((_, reject) =>
        window.setTimeout(
          () => reject(new Error("Tempo limite ao consultar sessao")),
          timeoutMs,
        ),
      ),
    ])
      .then((result) => {
        const response = result as Awaited<ReturnType<typeof client.auth.getSession>>;
        if (isCancelled) return;
        if (response.error) throw response.error;
        setSession(response.data.session ?? null);
      })
      .catch(() => {
        if (isCancelled) return;
        setSession(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      isCancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user: session?.user ?? null,
      session,
      isLoading,
      isConfigured: isSupabaseConfigured,
      async signUpWithEmail(email, password) {
        if (!supabase) throw new Error("Supabase não configurado");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) {
            const msg = String((signInError as any)?.message ?? "");
            if (msg.toLowerCase().includes("email not confirmed")) {
              throw new Error(
                "Conta criada. Confirme seu email para entrar, ou desative 'Confirm email' no Supabase (Email Provider).",
              );
            }
            throw signInError;
          }
        }
      },
      async signInWithEmail(email, password) {
        if (!supabase) throw new Error("Supabase não configurado");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, isLoading]);

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
