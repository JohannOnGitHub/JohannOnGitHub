-- One row per family (= one signed-in parent account) holding the kids' progress.
create table if not exists public.marmotte_families (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.marmotte_families enable row level security;

create policy "Families read their own row" on public.marmotte_families
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Families insert their own row" on public.marmotte_families
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Families update their own row" on public.marmotte_families
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Families delete their own row" on public.marmotte_families
  for delete to authenticated using ((select auth.uid()) = user_id);
