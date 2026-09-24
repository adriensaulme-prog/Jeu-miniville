-- Jalon 9 — « Naissance d'un pays »
-- Cahier des charges : page pays, agrégation des statistiques
-- nationales (population, influence, activité) à partir des villes
-- membres (voir docs/ROADMAP.md). Pas de vote (Jalon 10) ni de
-- président (Jalon 11) dans ce jalon.
--
-- Définition de "activité", tranchée par Claude Code (décision prise
-- sans attendre Adrien, à contester si besoin) : la colonne
-- `cities.activite` existe depuis le Jalon 1 mais n'a jamais eu de
-- définition réelle (toujours 0 pour une vraie ville, seules les
-- villes de test ont une valeur, arbitraire, voir docs/DECISIONS.md §4
-- journal du Jalon 6). Ce jalon la définit enfin : le nombre de jours,
-- sur les 7 derniers jours, où le propriétaire de la ville a été
-- "actif" — même notion d'activité qu'utilise déjà
-- reclamer_bonus_jumelages() (Jalon 5) pour une seule journée (au moins
-- une visite donnée, une action d'influence ou une action AntiVille),
-- étendue ici sur une fenêtre de 7 jours. Calculée à la volée (comme
-- les palmarès du Jalon 8bis), pas stockée : la colonne
-- `cities.activite` reste donc inutilisée par ce jalon (pas supprimée,
-- juste plus lue) — nettoyage possible plus tard si personne ne s'en
-- sert.

-- ---------------------------------------------------------------------
-- activite_7j_de : nombre de jours actifs (0 à 7) d'un joueur sur les
-- 7 derniers jours (aujourd'hui inclus). Brique de base réutilisée par
-- activite_ville() et stats_pays() ci-dessous.
-- ---------------------------------------------------------------------
create or replace function public.activite_7j_de(p_owner_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct jour)::integer
  from (
    select jour from public.visites
      where visiteur_id = p_owner_id and jour >= (now() at time zone 'utc')::date - 6
    union
    select jour from public.actions_influence
      where joueur_id = p_owner_id and jour >= (now() at time zone 'utc')::date - 6
    union
    select jour from public.actions_antiville
      where attaquant_id = p_owner_id and jour >= (now() at time zone 'utc')::date - 6
  ) jours;
$$;

-- ---------------------------------------------------------------------
-- activite_ville : activité (7j) de la ville, pour la tuile "Activité"
-- de /ville (jusqu'ici toujours à 0, colonne cities.activite jamais
-- mise à jour par une vraie partie).
-- ---------------------------------------------------------------------
create or replace function public.activite_ville(p_ville_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select public.activite_7j_de(owner_id) from public.cities where id = p_ville_id;
$$;

-- ---------------------------------------------------------------------
-- stats_pays : agrégation nationale à partir des villes membres —
-- nombre de villes, population totale, influence totale, et activité
-- moyenne (moyenne de activite_7j_de sur les propriétaires des villes
-- du pays, arrondie à 1 décimale).
-- ---------------------------------------------------------------------
create or replace function public.stats_pays(p_country_id text)
returns table (
  nb_villes bigint,
  population_totale bigint,
  influence_totale bigint,
  activite_moyenne numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::bigint as nb_villes,
    coalesce(sum(c.population), 0)::bigint as population_totale,
    coalesce(sum(c.influence), 0)::bigint as influence_totale,
    coalesce(round(avg(public.activite_7j_de(c.owner_id)), 1), 0) as activite_moyenne
  from public.cities c
  where c.country_id = p_country_id;
$$;
