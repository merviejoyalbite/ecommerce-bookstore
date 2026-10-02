-- BookNook schema for Supabase (Postgres). Run once in Dashboard → SQL Editor.
-- Then: sign up in the app, and grant yourself admin with the UPDATE at the bottom.

-- ── Tables ────────────────────────────────────────────────────────────────
create table if not exists books (
  id text primary key,
  title text not null,
  author text not null,
  price numeric not null,
  old_price numeric,
  category text not null,
  genre text not null default '',
  tone text not null default 'brown',
  rating numeric not null default 5,
  review_count text not null default '',
  badge text,
  format text not null default 'Paperback',
  blurb text not null default '',
  stock integer not null default 20
);

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subtotal numeric not null,
  shipping numeric not null,
  total numeric not null,
  discount numeric not null default 0,
  method text not null default 'card',
  status text not null default 'Processing',
  phone text not null default '',
  street text not null default '',
  city text not null default '',
  province text not null default '',
  postal text not null default '',
  country text not null default '',
  status text not null default 'Processing',
  phone text not null default '',
  street text not null default '',
  city text not null default '',
  province text not null default '',
  postal text not null default '',
  country text not null default '',
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null
);

create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders (id) on delete cascade,
  book_id text not null,
  title text not null,
  price numeric not null,
  qty integer not null
);

create table if not exists wishlist (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists reviews (
  id bigint generated always as identity primary key,
  book_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists cart_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  qty integer not null,
  primary key (user_id, book_id)
);

-- ── Auto-create a profile on signup (name comes from user metadata) ───────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', 'Reader'), new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Admin helper (used by RLS policies) ───────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ── Row Level Security ────────────────────────────────────────────────────
alter table books enable row level security;
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wishlist enable row level security;
alter table reviews enable row level security;
alter table cart_items enable row level security;

-- books: readable by everyone; catalogue edits need a signed-in user
-- (the app only exposes this to admins).
drop policy if exists "books readable by all" on books;
create policy "books readable by all" on books for select using (true);
drop policy if exists "books editable by signed-in users" on books;
create policy "books editable by signed-in users" on books
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- profiles: users read/update their own; admins read all.
drop policy if exists "profiles own read" on profiles;
create policy "profiles own read" on profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles own update" on profiles;
create policy "profiles own update" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and (is_admin = false or public.is_admin()));

-- orders: anyone can place (guest orders have null user_id);
-- users read their own + guest orders; admins read all.
drop policy if exists "orders insertable by all" on orders;
create policy "orders insertable by all" on orders for insert with check (true);
drop policy if exists "orders readable scoped" on orders;
create policy "orders readable scoped" on orders for select
  using (user_id is null or auth.uid() = user_id or public.is_admin());

-- order_items: insertable by all (checkout); readable by all
-- (line items are meaningless without an order id).
drop policy if exists "order_items insertable by all" on order_items;
create policy "order_items insertable by all" on order_items for insert with check (true);
drop policy if exists "order_items readable by all" on order_items;
create policy "order_items readable by all" on order_items for select using (true);

-- wishlist / cart_items: owners only (+ admins).
drop policy if exists "wishlist owner access" on wishlist;
create policy "wishlist owner access" on wishlist
  for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id);
drop policy if exists "cart owner access" on cart_items;
create policy "cart owner access" on cart_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reviews: readable by all; written by signed-in users; owners/admins edit.
drop policy if exists "reviews readable by all" on reviews;
create policy "reviews readable by all" on reviews for select using (true);
drop policy if exists "reviews insertable by signed-in" on reviews;
create policy "reviews insertable by signed-in" on reviews
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);
drop policy if exists "reviews editable by owner or admin" on reviews;
create policy "reviews editable by owner or admin" on reviews
  for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

-- ── Seed catalogue (matches the Figma Make prototype) ────────────────────
insert into books (id, title, author, price, old_price, category, genre, tone, rating, review_count, badge, format, blurb, stock) values
  ('1', 'The Secret Garden', 'Frances Hodgson Burnett', 895.00, 1095.00, 'Kids', 'A timeless classic', 'sage', 4.9, '3.8k', 'Best seller', 'Hardcover', 'A lonely girl discovers a locked garden and a world that grows back to life with her.', 20),
  ('2', 'Letters to a Young Poet', 'Rainer Maria Rilke', 775.00, null, 'Self-help', 'Poetry & letters', 'clay', 4.8, '1.1k', null, 'Paperback', 'Ten letters of counsel on writing, solitude and learning to live the questions.', 20),
  ('3', 'The Art of Stillness', 'Pico Iyer', 1050.00, null, 'Self-help', 'Mindful living', 'cream', 4.7, '964', null, 'Hardcover', 'A meditation on slowing down and finding adventure in quiet places.', 20),
  ('4', 'Wildwood Stories', 'Elena Marlowe', 860.00, null, 'Fiction', 'Modern fiction', 'forest', 4.9, '1.5k', null, 'Paperback', 'Interwoven tales from a town at the edge of the woods, where small lives loom large.', 14),
  ('5', 'A Room of One''s Own', 'Virginia Woolf', 795.00, null, 'Fiction', 'Literary essay', 'umber', 4.8, '2.1k', null, 'Paperback', 'Woolf''s landmark essay on women, fiction and the space a writer needs.', 20),
  ('6', 'The Little Prince', 'Antoine de Saint-Exupéry', 725.00, null, 'Kids', 'Beloved classic', 'gold', 5.0, '5.6k', 'Best seller', 'Hardcover', 'A pilot, a prince and a rose — the fable about what is essential and invisible.', 20),
  ('7', 'The Creative Act', 'Rick Rubin', 1200.00, null, 'Self-help', 'Creativity', 'night', 4.7, '1.9k', null, 'Hardcover', 'A way of being for artists and makers — attention, openness and the source of creativity.', 20),
  ('8', 'Braiding Sweetgrass', 'Robin Wall Kimmerer', 985.00, null, 'Non-fiction', 'Nature writing', 'moss', 4.9, '2.7k', null, 'Paperback', 'Indigenous wisdom and plant science braided into essays on reciprocity with the living world.', 9),
  ('9', 'The Midnight Library', 'Matt Haig', 749.00, null, 'Fantasy', 'Modern fiction', 'night', 4.8, '2.4k', 'Best seller', 'Hardcover', 'Between life and death there is a library where every book is a life you could have lived.', 20),
  ('10', 'The Secret History', 'Donna Tartt', 899.00, 999.00, 'Mystery', 'Dark academia', 'umber', 4.7, '1.8k', null, 'Hardcover', 'A group of classics students drifts past the line between intellect and transgression.', 12),
  ('11', 'A Little Life', 'Hanya Yanagihara', 829.00, null, 'Fiction', 'Modern fiction', 'clay', 4.6, '3.1k', 'New', 'Paperback', 'Four friends, three decades — an unforgettable story of love and survival in New York.', 20),
  ('12', 'Before the Coffee Gets Cold', 'Toshikazu Kawaguchi', 679.00, null, 'Fiction', 'Modern fiction', 'cream', 4.9, '892', 'Best seller', 'Paperback', 'In a small Tokyo café, visitors can travel back in time — but only until their coffee cools.', 20),
  ('13', 'The Goldfinch', 'Donna Tartt', 920.00, null, 'Mystery', 'Literary fiction', 'gold', 4.5, '724', null, 'Hardcover', 'A stolen painting pulls a boy through loss, obsession and the art underworld.', 8),
  ('14', 'Piranesi', 'Susanna Clarke', 699.00, 799.00, 'Fantasy', 'Fantasy', 'forest', 4.8, '1.2k', 'New', 'Paperback', 'Piranesi lives in an endless house of statues and tides — until messages appear.', 15),
  ('15', 'Normal People', 'Sally Rooney', 639.00, null, 'Romance', 'Modern fiction', 'sage', 4.6, '4.2k', null, 'Paperback', 'Connell and Marianne orbit each other from small-town Ireland to Trinity College.', 20),
  ('16', 'The Song of Achilles', 'Madeline Miller', 789.00, null, 'Romance', 'Mythology', 'brown', 4.9, '2.9k', 'Best seller', 'Paperback', 'Achilles and Patroclus — a retelling of the Iliad as a story of devotion.', 0)
on conflict (id) do nothing;

-- ── Make yourself admin (after signing up in the app) ─────────────────────
-- update profiles set is_admin = true where email = 'you@example.com';
