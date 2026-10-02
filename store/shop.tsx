import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { BOOKS, type Book } from '@/data/books';
import { supabase } from '@/lib/supabase';

export type Review = {
  id: number;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Order = {
  id: number;
  name: string;
  email: string;
  subtotal: number;
  shipping: number;
  total: number;
  discount: number;
  method: string;
  status: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  createdAt: string;
  userId: string | null;
};

export type OrderItem = {
  id: number;
  orderId: number;
  bookId: string;
  title: string;
  price: number;
  qty: number;
};

export type BookInput = {
  title: string;
  author: string;
  price: number;
  oldPrice?: number | null;
  category: string;
  genre?: string;
  tone?: string;
  blurb: string;
  stock: number;
};

type ShopValue = {
  books: Book[];
  ready: boolean;
  refresh: () => Promise<void>;
  getBook: (id: string) => Book | undefined;
  createOrder: (input: {
    name: string;
    email: string;
    subtotal: number;
    shipping: number;
    total: number;
    discount: number;
    method: string;
    status?: string;
    phone?: string;
    street?: string;
    city?: string;
    province?: string;
    postal?: string;
    country?: string;
    userId: string | null;
    lines: { book: Book; qty: number }[];
  }) => Promise<number>;
  listOrders: (userId?: string | null, admin?: boolean) => Promise<Order[]>;
  getOrder: (id: number) => Promise<Order | null>;
  listOrderItems: (orderId: number) => Promise<OrderItem[]>;
  wishlist: string[];
  refreshWishlist: (userId: string | null) => Promise<void>;
  toggleWishlist: (userId: string | null, bookId: string) => Promise<void>;
  isWished: (bookId: string) => boolean;
  listReviews: (bookId: string) => Promise<Review[]>;
  addReview: (bookId: string, userId: string, userName: string, rating: number, comment: string) => Promise<void>;
  addBook: (input: BookInput) => Promise<string>;
  updateBook: (id: string, input: Partial<BookInput>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  listProfiles: () => Promise<{ id: string; name: string; email: string; isAdmin: boolean; createdAt: string }[]>;
  listItems: (limit?: number) => Promise<{ bookId: string; price: number; qty: number }[]>;
};

const ShopContext = createContext<ShopValue | null>(null);

type BookRow = {
  id: string;
  title: string;
  author: string;
  price: number;
  old_price: number | null;
  category: string;
  genre: string;
  tone: string;
  rating: number;
  review_count: string | null;
  badge: string | null;
  format: string | null;
  blurb: string;
  stock: number;
};

function toBook(r: BookRow): Book {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    price: Number(r.price),
    oldPrice: r.old_price != null ? Number(r.old_price) : null,
    category: r.category,
    genre: r.genre ?? '',
    tone: r.tone ?? 'brown',
    rating: Number(r.rating),
    reviewCount: r.review_count ?? '',
    badge: r.badge ?? null,
    format: r.format ?? 'Paperback',
    blurb: r.blurb,
    stock: r.stock ?? 20,
  };
}

function toOrder(r: Record<string, unknown>): Order {
  return {
    id: Number(r.id),
    name: String(r.name ?? ''),
    email: String(r.email ?? ''),
    subtotal: Number(r.subtotal),
    shipping: Number(r.shipping),
    total: Number(r.total),
    discount: Number(r.discount ?? 0),
    method: String(r.method ?? 'card'),
    status: String(r.status ?? 'Processing'),
    phone: String(r.phone ?? ''),
    street: String(r.street ?? ''),
    city: String(r.city ?? ''),
    province: String(r.province ?? ''),
    postal: String(r.postal ?? ''),
    country: String(r.country ?? ''),
    createdAt: String(r.created_at),
    userId: (r.user_id as string | null) ?? null,
  };
}

function toItem(r: Record<string, unknown>): OrderItem {
  return {
    id: Number(r.id),
    orderId: Number(r.order_id),
    bookId: String(r.book_id),
    title: String(r.title),
    price: Number(r.price),
    qty: Number(r.qty),
  };
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(BOOKS);
  const [ready, setReady] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('books').select('*').order('title');
      if (!error && data && data.length > 0) setBooks((data as BookRow[]).map(toBook));
      else setBooks(BOOKS);
    } catch {
      setBooks(BOOKS);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getBook = useCallback((id: string) => books.find((b) => b.id === id), [books]);

  const createOrder: ShopValue['createOrder'] = useCallback(
    async (input) => {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          name: input.name,
          email: input.email,
          subtotal: input.subtotal,
          shipping: input.shipping,
          total: input.total,
          discount: input.discount,
          method: input.method,
          status: input.status ?? 'Processing',
          phone: input.phone ?? '',
          street: input.street ?? '',
          city: input.city ?? '',
          province: input.province ?? '',
          postal: input.postal ?? '',
          country: input.country ?? '',
          user_id: input.userId,
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(error?.message || 'Could not place order.');
      const orderId = Number((data as { id: number }).id);
      const items = input.lines.map((l) => ({
        order_id: orderId,
        book_id: l.book.id,
        title: l.book.title,
        price: l.book.price,
        qty: l.qty,
      }));
      const { error: itemError } = await supabase.from('order_items').insert(items);
      if (itemError) throw new Error(itemError.message);
      // Decrement stock (best effort).
      for (const l of input.lines) {
        const book = books.find((b) => b.id === l.book.id);
        if (book) {
          await supabase
            .from('books')
            .update({ stock: Math.max(0, (book.stock ?? 20) - l.qty) })
            .eq('id', l.book.id);
        }
      }
      await refresh();
      return orderId;
    },
    [books, refresh],
  );

  const listOrders = useCallback(async (userId?: string | null, admin?: boolean) => {
    try {
      let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!admin) {
        q = userId != null ? q.eq('user_id', userId) : q.is('user_id', null);
      }
      const { data, error } = await q;
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map(toOrder);
    } catch {
      return [];
    }
  }, []);

  const getOrder = useCallback(async (id: number) => {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error || !data) return null;
      return toOrder(data as Record<string, unknown>);
    } catch {
      return null;
    }
  }, []);

  const listOrderItems = useCallback(async (orderId: number) => {
    try {
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId).order('id');
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map(toItem);
    } catch {
      return [];
    }
  }, []);

  const refreshWishlist = useCallback(async (userId: string | null) => {
    if (userId == null) {
      setWishlist([]);
      return;
    }
    try {
      const { data, error } = await supabase.from('wishlist').select('book_id').eq('user_id', userId);
      if (error || !data) setWishlist([]);
      else setWishlist((data as { book_id: string }[]).map((r) => r.book_id));
    } catch {
      setWishlist([]);
    }
  }, []);

  const toggleWishlist = useCallback(async (userId: string | null, bookId: string) => {
    if (userId == null) return;
    try {
      const { data } = await supabase.from('wishlist').select('book_id').eq('user_id', userId).eq('book_id', bookId).single();
      if (data) {
        await supabase.from('wishlist').delete().eq('user_id', userId).eq('book_id', bookId);
        setWishlist((prev) => prev.filter((id) => id !== bookId));
      } else {
        const { error } = await supabase.from('wishlist').insert({ user_id: userId, book_id: bookId });
        if (!error) setWishlist((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
      }
    } catch {
      // Non-fatal.
    }
  }, []);

  const isWished = useCallback((bookId: string) => wishlist.includes(bookId), [wishlist]);

  const listReviews = useCallback(async (bookId: string) => {
    try {
      const { data, error } = await supabase.from('reviews').select('*').eq('book_id', bookId).order('created_at', { ascending: false });
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((r) => ({
        id: Number(r.id),
        bookId: String(r.book_id),
        userId: String(r.user_id),
        userName: String(r.user_name),
        rating: Number(r.rating),
        comment: String(r.comment),
        createdAt: String(r.created_at),
      }));
    } catch {
      return [];
    }
  }, []);

  const addReview = useCallback(
    async (bookId: string, userId: string, userName: string, rating: number, comment: string) => {
      const clean = comment.trim();
      const r = Math.min(5, Math.max(1, Math.round(rating) || 5));
      if (!clean) throw new Error('Please write a review.');
      const { error } = await supabase.from('reviews').insert({
        book_id: bookId,
        user_id: userId,
        user_name: userName.trim() || 'Reader',
        rating: r,
        comment: clean,
      });
      if (error) throw new Error(error.message);
      // Sync average rating into the catalogue (best effort).
      const { data } = await supabase.from('reviews').select('rating').eq('book_id', bookId);
      if (data && data.length > 0) {
        const avg = (data as { rating: number }[]).reduce((a, x) => a + Number(x.rating), 0) / data.length;
        await supabase.from('books').update({ rating: Math.round(avg * 10) / 10 }).eq('id', bookId);
        await refresh();
      }
    },
    [refresh],
  );

  const addBook = useCallback(
    async (input: BookInput) => {
      const title = input.title.trim();
      if (!title) throw new Error('Title is required.');
      const id = `b-${Date.now()}`;
      const { error } = await supabase.from('books').insert({
        id,
        title,
        author: input.author.trim() || 'Unknown author',
        price: Math.max(0, Number(input.price) || 0),
        old_price: input.oldPrice != null && Number.isFinite(Number(input.oldPrice)) ? Number(input.oldPrice) : null,
        category: input.category.trim() || 'Fiction',
        genre: input.genre?.trim() || input.category.trim() || 'Fiction',
        tone: input.tone?.trim() || 'brown',
        rating: 5,
        blurb: input.blurb.trim() || 'New arrival at Chapter One Shop.',
        stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
      });
      if (error) throw new Error(error.message);
      await refresh();
      return id;
    },
    [refresh],
  );

  const updateBook = useCallback(
    async (id: string, input: Partial<BookInput>) => {
      if (input.title !== undefined && !input.title.trim()) throw new Error('Title is required.');
      const patch: Record<string, string | number | null> = {};
      if (input.title !== undefined) patch.title = input.title.trim();
      if (input.author !== undefined) patch.author = input.author.trim() || 'Unknown author';
      if (input.price !== undefined) patch.price = Math.max(0, Number(input.price) || 0);
      if (input.oldPrice !== undefined)
        patch.old_price = input.oldPrice != null && Number.isFinite(Number(input.oldPrice)) ? Number(input.oldPrice) : null;
      if (input.category !== undefined) patch.category = input.category.trim() || 'Fiction';
      if (input.genre !== undefined) patch.genre = input.genre;
      if (input.tone !== undefined) patch.tone = input.tone.trim() || 'brown';
      if (input.blurb !== undefined) patch.blurb = input.blurb;
      if (input.stock !== undefined) patch.stock = Math.max(0, Math.floor(Number(input.stock) || 0));
      if (Object.keys(patch).length === 0) return;
      const { error } = await supabase.from('books').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
      await refresh();
    },
    [refresh],
  );

  const deleteBook = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await refresh();
      setWishlist((prev) => prev.filter((b) => b !== id));
    },
    [refresh],
  );

  const listProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        name: String(r.name ?? ''),
        email: String(r.email ?? ''),
        isAdmin: Boolean(r.is_admin),
        createdAt: String(r.created_at),
      }));
    } catch {
      return [];
    }
  }, []);

  const listItems = useCallback(async (limit = 500) => {
    try {
      const { data, error } = await supabase.from('order_items').select('book_id,price,qty').order('id', { ascending: false }).limit(limit);
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((r) => ({
        bookId: String(r.book_id),
        price: Number(r.price),
        qty: Number(r.qty),
      }));
    } catch {
      return [];
    }
  }, []);

  return (
    <ShopContext.Provider
      value={{
        books,
        ready,
        refresh,
        getBook,
        createOrder,
        listOrders,
        getOrder,
        listOrderItems,
        wishlist,
        refreshWishlist,
        toggleWishlist,
        isWished,
        listReviews,
        addReview,
        addBook,
        updateBook,
        deleteBook,
        listProfiles,
        listItems,
      }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}
