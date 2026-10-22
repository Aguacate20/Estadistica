-- Arena de Pruebas · tablas en Supabase (SQL Editor → New query → Run)
create table if not exists public.arena_kv (
  k text primary key,
  v text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.arena_hash (
  k text not null,
  f text not null,
  v text not null,
  updated_at timestamptz not null default now(),
  primary key (k, f)
);
-- Las funciones del servidor usan la service role key (salta RLS). Activar RLS evita que
-- alguien con la anon key lea las partidas desde el navegador.
alter table public.arena_kv enable row level security;
alter table public.arena_hash enable row level security;
-- Limpieza opcional de partidas viejas (más de 2 días):
-- delete from public.arena_kv where updated_at < now() - interval '2 days';
-- delete from public.arena_hash where updated_at < now() - interval '2 days';
