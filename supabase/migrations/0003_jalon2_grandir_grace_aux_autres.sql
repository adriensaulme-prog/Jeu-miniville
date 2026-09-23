-- Jalon 2 — « Grandir grâce aux autres »
-- Cahier des charges §3 (population et connexions) et §2 (évolution
-- visuelle). Voir docs/DECISIONS.md §4 pour le journal complet.

-- ---------------------------------------------------------------------
-- population_vers_niveau : seuils d'évolution visuelle, provisoires
-- ("seuils à équilibrer pendant les tests" — cahier des charges §2,
-- docs/DECISIONS.md §10 point 2). Mise à jour en écho de
-- src/lib/game/niveauVille.ts (SEUILS_NIVEAU) — les deux doivent
-- rester synchronisés si les seuils changent.
-- ---------------------------------------------------------------------
create or replace function public.population_vers_niveau(p_population integer)
returns integer
language sql
immutable
as $$
  select case
    when p_population >= 120 then 5 -- Métropole
    when p_population >= 60  then 4 -- Grande ville
    when p_population >= 30  then 3 -- Ville
    when p_population >= 15  then 2 -- Bourg
    when p_population >= 5   then 1 -- Village
    else 0                          -- Hameau
  end;
$$;

-- creer_ville() (migration 0001) fixait niveau à sa valeur par défaut
-- (0) : remplacée ici par un appel à population_vers_niveau(), pour ne
-- pas dépendre d'une coïncidence si les seuils changent plus tard.
create or replace function public.creer_ville(
  p_owner_id uuid,
  p_pseudo text,
  p_country_id text,
  p_nom_ville text
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'creer_ville: utilisateur non autorisé';
  end if;

  if exists (select 1 from public.users where id = p_owner_id) then
    raise exception 'creer_ville: ce compte a déjà un profil' using errcode = '23505';
  end if;

  insert into public.users (id, pseudo, country_id)
  values (p_owner_id, p_pseudo, p_country_id);

  insert into public.cities (nom, owner_id, country_id, niveau)
  values (p_nom_ville, p_owner_id, p_country_id, public.population_vers_niveau(1))
  returning * into v_ville;

  update public.users set city_id = v_ville.id where id = p_owner_id;

  return v_ville;
end;
$$;

-- ---------------------------------------------------------------------
-- visites : une ligne par (visiteur, ville, jour). La contrainte unique
-- est l'anti-triche (cahier des charges §3 : "une même personne ne peut
-- contribuer qu'une seule fois par jour à une même ville").
-- ---------------------------------------------------------------------
create table public.visites (
  id uuid primary key default gen_random_uuid(),
  visiteur_id uuid not null references public.users (id) on delete cascade,
  ville_id uuid not null references public.cities (id) on delete cascade,
  jour date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (visiteur_id, ville_id, jour)
);

alter table public.visites enable row level security;

create policy "visites_lecture_propre"
  on public.visites for select
  using (auth.uid() = visiteur_id);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par visiter_ville() ci-dessous (anti-triche, comme creer_ville
-- au Jalon 1).

-- ---------------------------------------------------------------------
-- visiter_ville : point d'entrée unique du Jalon 2. +1 population et
-- recalcule le niveau visuel dans la même transaction que
-- l'enregistrement de la visite — jamais depuis le client.
-- ---------------------------------------------------------------------
create or replace function public.visiter_ville(
  p_visiteur_id uuid,
  p_ville_id uuid
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_visiteur_id then
    raise exception 'visiter_ville: utilisateur non autorisé';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'visiter_ville: ville introuvable';
  end if;
  if v_owner_id = p_visiteur_id then
    raise exception 'visiter_ville: impossible de visiter sa propre ville';
  end if;

  -- Lève une erreur unique_violation (23505) si déjà visitée aujourd'hui
  -- — c'est l'anti-abus, pas une erreur applicative à traiter à part.
  insert into public.visites (visiteur_id, ville_id) values (p_visiteur_id, p_ville_id);

  update public.cities
    set population = population + 1,
        niveau = public.population_vers_niveau(population + 1)
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;
