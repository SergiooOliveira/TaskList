create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  url text not null,
  title text not null,
  image_url text,
  store text not null,
  price_cents integer,
  previous_price_cents integer,
  price_checked_at timestamptz,
  bought boolean not null default false,
  created_at timestamptz not null default now()
);

alter table items enable row level security;

create policy "own items" on items
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Explicit so logged-in users can reach the table through the API even if the project does not grant it by default.
grant select, insert, update, delete on items to authenticated;
