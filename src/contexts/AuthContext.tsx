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
    if (!supabase) return;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        setSession(data.session ?? null);
      })
      .finally(() => setIsLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => data.subscription.unsubscribe();
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
