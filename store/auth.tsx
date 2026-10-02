import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
};

type AuthValue = {
  user: AuthUser | null;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function toUser(session: Session | null): Promise<AuthUser | null> {
  const u = session?.user;
  if (!u) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (error || !data) {
      return {
        id: u.id,
        name: (u.user_metadata?.name as string) || 'Reader',
        email: u.email ?? '',
        isAdmin: false,
        createdAt: u.created_at,
      };
    }
    return {
      id: data.id as string,
      name: (data.name as string) || 'Reader',
      email: (data.email as string) || u.email || '',
      isAdmin: Boolean(data.is_admin),
      createdAt: data.created_at as string,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setUser(await toUser(data.session));
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setReady(true);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) setUser(await toUser(session));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) return { ok: false as const, error: 'Please enter your name.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false as const, error: 'Please enter a valid email.' };
    if (password.length < 6) return { ok: false as const, error: 'Password must be at least 6 characters.' };
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name: cleanName } },
      });
      if (error) return { ok: false as const, error: error.message };
      if (!data.session) {
        // Email confirmation is on: ask Supabase to resend nothing — user must confirm.
        await supabase.auth.signOut().catch(() => {});
        return { ok: false as const, error: 'Account created — check your email to confirm, then sign in.' };
      }
      setUser(await toUser(data.session));
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: 'Could not create account. Please try again.' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false as const, error: 'Please enter a valid email.' };
    if (!password) return { ok: false as const, error: 'Please enter your password.' };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { ok: false as const, error: error.message };
      setUser(await toUser(data.session));
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: 'Could not sign in. Please try again.' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(() => ({ user, ready, signUp, signIn, signOut }), [user, ready, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
