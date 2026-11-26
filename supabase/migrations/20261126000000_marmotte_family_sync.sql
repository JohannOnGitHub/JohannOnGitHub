-- Family sync for "Les Aventures de Pépette".
-- Each family shares a secret family code (80 random bits, typed on each phone).
-- Only a SHA-256 hash of the code is stored. The table is not reachable directly:
-- the app can only call the two functions below, which require the code.

create table if not exists public.marmotte_family_sync (
  code_hash text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.marmotte_family_sync enable row level security;
-- No policies on purpose: no direct reads or writes for anon/authenticated.
revoke all on public.marmotte_family_sync from anon, authenticated;

create or replace function public.marmotte_get(family_code text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select s.data
  from public.marmotte_family_sync s
  where length(family_code) >= 16
    and s.code_hash = encode(sha256(convert_to(family_code, 'UTF8')), 'hex');
$$;

create or replace function public.marmotte_save(family_code text, payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(family_code) < 16 then
    raise exception 'family code too short';
  end if;
  if pg_column_size(payload) > 200000 then
    raise exception 'payload too large';
  end if;
  insert into public.marmotte_family_sync (code_hash, data, updated_at)
  values (encode(sha256(convert_to(family_code, 'UTF8')), 'hex'), payload, now())
  on conflict (code_hash) do update set data = excluded.data, updated_at = now();
end;
$$;

revoke all on function public.marmotte_get(text) from public;
revoke all on function public.marmotte_save(text, jsonb) from public;
grant execute on function public.marmotte_get(text) to anon, authenticated;
grant execute on function public.marmotte_save(text, jsonb) to anon, authenticated;
