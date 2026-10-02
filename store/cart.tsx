import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Book } from '@/data/books';
import { supabase } from '@/lib/supabase';
import { useShop } from '@/store/shop';

export type CartLine = { book: Book; qty: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  promo: string | null;
  discount: number;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  add: (book: Book, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOwner: (userId: string | null) => void;
};

export const PROMO_CODE = 'BOOKNOOK10';
export const PROMO_RATE = 0.1;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { books } = useShop();
  const [owner, setOwnerState] = useState<string | null>(null);
  const [entries, setEntries] = useState<{ bookId: string; qty: number }[]>([]);
  const [ready, setReady] = useState(false);
  const [promo, setPromo] = useState<string | null>(null);

  // Load the signed-in user's cart from Supabase; guests keep an in-memory cart.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (owner == null) {
        if (!cancelled) {
          setEntries([]);
          setReady(true);
        }
        return;
      }
      try {
        const { data } = await supabase.from('cart_items').select('book_id,qty').eq('user_id', owner);
        if (!cancelled) {
          setEntries(((data ?? []) as { book_id: string; qty: number }[]).map((r) => ({ bookId: r.book_id, qty: r.qty })));
        }
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [owner]);

  const setOwner = useCallback((userId: string | null) => {
    setOwnerState(userId);
  }, []);

  const persist = useCallback(
    (next: { bookId: string; qty: number }[]) => {
      setEntries(next);
      if (owner == null) return; // guest cart stays in memory
      void (async () => {
        try {
          await supabase.from('cart_items').delete().eq('user_id', owner);
          if (next.length > 0) {
            await supabase.from('cart_items').insert(
              next.map((e) => ({ user_id: owner, book_id: e.bookId, qty: e.qty })),
            );
          }
        } catch {
          // Non-fatal: in-memory state is already updated.
        }
      })();
    },
    [owner],
  );

  const value = useMemo<CartContextValue>(() => {
    const map = new Map(books.map((b) => [b.id, b]));
    const lines: CartLine[] = [];
    for (const e of entries) {
      const book = map.get(e.bookId);
      if (book && e.qty > 0) lines.push({ book, qty: e.qty });
    }
    const count = lines.reduce((a, l) => a + l.qty, 0);
    const subtotal = lines.reduce((a, l) => a + l.qty * l.book.price, 0);
    const discount = promo ? Math.round(subtotal * PROMO_RATE) : 0;
    return {
      lines,
      count,
      subtotal,
      ready,
      promo,
      discount,
      applyPromo: (code: string) => {
        if (code.trim().toUpperCase() === PROMO_CODE) {
          setPromo(PROMO_CODE);
          return true;
        }
        return false;
      },
      clearPromo: () => setPromo(null),
      add: (book, qty = 1) => {
        const found = entries.find((e) => e.bookId === book.id);
        if (!found) {
          if (qty > 0) persist([...entries, { bookId: book.id, qty }]);
          return;
        }
        const nextQty = found.qty + qty;
        persist(
          nextQty <= 0
            ? entries.filter((e) => e.bookId !== book.id)
            : entries.map((e) => (e.bookId === book.id ? { ...e, qty: nextQty } : e)),
        );
      },
      remove: (id) => persist(entries.filter((e) => e.bookId !== id)),
      setQty: (id, qty) =>
        persist(
          qty <= 0 ? entries.filter((e) => e.bookId !== id) : entries.map((e) => (e.bookId === id ? { ...e, qty } : e)),
        ),
      clear: () => persist([]),
      setOwner,
    };
  }, [entries, books, ready, promo, persist, setOwner]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
