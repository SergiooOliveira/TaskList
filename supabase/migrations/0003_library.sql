alter table items alter column url drop not null;
alter table items alter column store drop not null;

alter table items
  add column collection text check (collection in ('book','manga')),
  add column author text,
  add column series text,
  add column series_number numeric,
  add column genres text[],
  add column pages integer,
  add column language text,
  add column form text,
  add column rating smallint check (rating between 1 and 5),
  add column bought_on date;

update items set collection = 'book', category = null
  where lower(trim(category)) in ('book','books','livro','livros');
update items set collection = 'manga', category = null
  where lower(trim(category)) in ('manga');

create table reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  item_id uuid not null references items on delete cascade,
  started_on date,
  finished_on date,
  before_app boolean not null default false
);

alter table reads enable row level security;

create policy "own reads" on reads
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on reads to authenticated;
