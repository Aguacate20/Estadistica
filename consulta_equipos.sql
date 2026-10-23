-- Arena de Pruebas · revisar una partida en Supabase (SQL Editor → New query → Run)
-- Reemplace XXXX por el código de la arena (4 letras).
with t as (
  select f as team_id, v::jsonb as j
  from public.arena_hash
  where k = 'g:XXXX:teams'
)
select
  j->>'name'                                   as equipo,
  (j->>'pts')::int                             as puntos,
  (j->>'step')::int                            as retos_hechos,
  jsonb_array_length(coalesce(j->'log','[]'))  as envios,
  to_timestamp((j->>'joinedAt')::bigint/1000) at time zone 'America/Bogota' as entro,
  to_timestamp((j->>'lastAt')::bigint/1000)   at time zone 'America/Bogota' as ultimo_envio,
  round(((j->>'lastAt')::bigint - (j->>'joinedAt')::bigint)/60000.0, 1) as minutos_jugando,
  round((j->>'pts')::int / greatest(((j->>'lastAt')::bigint - (j->>'joinedAt')::bigint)/60000.0, 0.1), 0) as puntos_por_minuto,
  (select count(*) from jsonb_array_elements(coalesce(j->'log','[]')) e where (e->>'pts')::int >= 100) as retos_perfectos,
  j->'log'                                     as detalle
from t
order by puntos desc;
