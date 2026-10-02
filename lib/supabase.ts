import { Platform } from 'react-native';
import { createClient, type SupabaseClient, type SupportedStorage } from '@supabase/supabase-js';

// NOTE: Expo's build-time EXPO_PUBLIC_* inlining proved unreliable in this
// project (verified: keys missing from the built bundle), so the public
// anon credentials live here as literals. This is safe: the anon key is
// PUBLIC by design (it ships in every client app) and RLS policies guard
// the data. NEVER put the secret/service-role key here.
const SUPABASE_URL = 'https://yiusktgesegfjzzxckdg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CdYAPrgEBH3oM2HJEbbqFA_zxYeqzD-';

const CONFIGURED = true;

// Session storage, chosen per runtime. AsyncStorage is lazy-required so the
// web/SSR bundle never evaluates its `window`-dependent backend at import time.
function resolveStorage(): SupportedStorage {
  if (typeof window !== 'undefined' && window.localStorage) {
    const ls = window.localStorage;
    return {
      getItem: (k: string) => Promise.resolve(ls.getItem(k)),
      setItem: (k: string, v: string) => {
        ls.setItem(k, v);
        return Promise.resolve();
      },
      removeItem: (k: string) => {
        ls.removeItem(k);
        return Promise.resolve();
      },
    };
  }
  if (Platform.OS === 'web') {
    // Node prerender: sessions don't matter for static HTML.
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => Promise.resolve(mem.get(k) ?? null),
      setItem: (k: string, v: string) => {
        mem.set(k, v);
        return Promise.resolve();
      },
      removeItem: (k: string) => {
        mem.delete(k);
        return Promise.resolve();
      },
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-async-storage/async-storage').default as SupportedStorage;
}

export function isSupabaseConfigured(): boolean {
  return CONFIGURED;
}

// Placeholder keeps the client constructible in tests; the app always ships
// the real credentials above, and all queries fall back gracefully on error.
export const supabase: SupabaseClient = createClient(
  CONFIGURED ? SUPABASE_URL : 'https://placeholder.supabase.co',
  CONFIGURED ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      storage: resolveStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
