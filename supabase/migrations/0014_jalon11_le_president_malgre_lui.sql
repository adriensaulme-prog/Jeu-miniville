-- Jalon 11 — « Le président malgré lui »
-- Cahier des charges §2/§30 : "Président = ville #1 du pays." et
-- l'historique des présidents (docs/ROADMAP.md). Voir docs/DECISIONS.md
-- §4 pour le raisonnement complet.
--
-- Le badge "Président" existe déjà depuis le Jalon 7 (rang #1 du pays,
-- calculé en direct sur /ville et /villes) — ce jalon n'y touche pas,
-- il reste la source de vérité pour "qui est président *maintenant*"
-- (toujours exact, jamais périmé). Ce qui manquait : la mémoire de
-- *depuis quand* et des mandats précédents. C'est tout ce que ce jalon
-- ajoute : une table d'historique, tenue à jour par une fonction
-- appelée à chaque affichage de /ville ou /pays (même principe que
-- reclamer_bonus_jumelages() au Jalon 5 — pas de cron, pas de trigger
-- sur chaque action qui change la population, juste une réconciliation
-- opportuniste et idempotente).

-- ---------------------------------------------------------------------
-- presidents : un mandat par ligne. fin nulle = mandat en cours. Au
-- plus un mandat ouvert par pays (index unique partiel), même principe
-- que jumelages_paire_active_unique (Jalon 5).
-- ---------------------------------------------------------------------
create table public.presidents (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries (id),
  ville_id uuid not null references public.cities (id) on delete cascade,
  debut timestamptz not null default now(),
  fin timestamptz
);

create unique index presidents_mandat_ouvert_unique
  on public.presidents (country_id)
  where fin is null;

alter table public.presidents enable row level security;

create policy "presidents_lecture_publique"
  on public.presidents for select
  using (true);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par verifier_president() ci-dessous.

-- ---------------------------------------------------------------------
-- verifier_president : idempotente, sans effet si la ville n°1 du pays
-- n'a pas changé depuis le dernier appel. Égalité de population entre
-- deux villes : départage par created_at (la plus ancienne reste
-- présidente) — comportement stable, jamais d'oscillation entre deux
-- villes à égalité.
-- ---------------------------------------------------------------------
create or replace function public.verifier_president(p_country_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ville_actuelle uuid;
  v_mandat_ouvert record;
begin
  select id into v_ville_actuelle
    from public.cities
    where country_id = p_country_id
    order by population desc, created_at asc
    limit 1;

  if v_ville_actuelle is null then
    return; -- aucune ville dans ce pays pour l'instant
  end if;

  select * into v_mandat_ouvert
    from public.presidents
    where country_id = p_country_id and fin is null;

  if v_mandat_ouvert is null then
    insert into public.presidents (country_id, ville_id) values (p_country_id, v_ville_actuelle);
    return;
  end if;

  if v_mandat_ouvert.ville_id = v_ville_actuelle then
    return; -- toujours la même ville en tête, rien à faire
  end if;

  update public.presidents set fin = now() where id = v_mandat_ouvert.id;
  insert into public.presidents (country_id, ville_id) values (p_country_id, v_ville_actuelle);
end;
$$;
