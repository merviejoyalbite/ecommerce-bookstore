# E-commerce Bookstore — Chapter1 (React Native + Expo SDK 57 + Supabase)

Functional bookstore for: https://www.figma.com/make/kmOga5owMXu3c6jIzR3347/E-commerce-Bookstore-Website-Design
Design reference (published): https://query-gush-01955823.figma.site

## Stack
- React Native 0.86.3 + React 19.2.3
- Expo SDK 57 (~57.0.25) + Expo Router (file-based)
- Supabase (Postgres + Auth) via `@supabase/supabase-js` — one backend for native + web
- TypeScript strict

## Database (Supabase)
- Schema + RLS + seed catalogue: `supabase/schema.sql`
- Tables: `books`, `profiles`, `orders`, `order_items`, `wishlist`, `reviews`, `cart_items`
- Auth: Supabase Auth (email/password); a trigger auto-creates `profiles` rows

### Setup
1. Create a free project at https://supabase.com
2. Dashboard → SQL Editor → paste + run `supabase/schema.sql`
3. Dashboard → Authentication → Sign In/Up: turn **off** "Confirm email" (for local demo)
4. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_SUPABASE_URL` (Project Settings → Data API → Project URL)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API Keys → anon public)
5. Restart the app. Sign up in the app, then make yourself admin:
   ```sql
   update profiles set is_admin = true where email = 'you@example.com';
   ```
- Without `.env`, the app still boots on the built-in seed catalogue and shows a notice on the Account tab.

## Demo accounts (after setup)
- Sign up with any email, then grant `is_admin` via the SQL above for the Admin tab.

## Routes
- `app/(tabs)/index.tsx` Chapter1 landing (hero, arrivals, editor's choice, bestsellers, promise, newsletter, footer)
- `app/(tabs)/catalog.tsx` search + category filter (`?q=`, `?cat=`)
- `app/(tabs)/cart.tsx` persistent per-user cart (Supabase; guests in-memory)
- `app/(tabs)/wishlist.tsx` saved books (login required)
- `app/(tabs)/orders.tsx` my orders (admin sees all)
- `app/(tabs)/admin.tsx` catalogue management (admin only)
- `app/(tabs)/account.tsx` sign in / sign up / sign out
- `app/book/[id].tsx` detail + wishlist + reviews
- `app/checkout.tsx` writes order + items, decrements stock (free shipping over $40)
- `app/order/[id].tsx` order detail (owner/admin only)
- `app/order-success.tsx` shows saved order id

## Run
```bash
cd ecommerce-bookstore
npx expo install --fix
npx expo start        # press w for web, a/i for native (Expo Go)
npx expo export --platform web   # static site in dist/
npx --yes serve@latest dist --listen 8095
```

## Verify
```bash
npx tsc --noEmit
npx expo lint
```
