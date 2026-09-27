-- Jalon 17 — Système de développement des villes (1/4) : choix
-- d'activité et jauges, sans effet de jeu.
-- docs/SYSTEME-DEVELOPPEMENT.md §9 point 1 : les 7 jauges, le choix
-- d'activité à la visite, la recommandation du maire, l'affichage des
-- jauges. Aucun bonus/malus encore (§4/§5/§6 bis : Jalon 18).
--
-- Deux points du document initial (23/09) contredisaient des décisions
-- prises depuis (Jalon 13 ter, 26/09 : visite automatique et
-- auto-visite autorisée) — tranchés par Adrien le 27/09/2026, pas par
-- Claude Code seul (voir docs/DECISIONS.md §4) :
--   - la visite reste 100 % automatique pour la population ; le choix
--     d'activité vient APRÈS coup (choisir_activite_visite ci-dessous),
--     et si le visiteur ne choisit rien, une activité est tirée au sort
--     dès la visite (pas d'état "en attente" à gérer côté serveur) ;
--   - se visiter soi-même suit exactement la même règle qu'une autre
--     ville (déjà vrai depuis le Jalon 13 ter) : pas de "contribution
--     de maire" séparée, l'idée est abandonnée.
--
-- Registre des codes d'erreur (suite du registre de la migration 0006,
-- codes P0001 à P0020 déjà pris) :
--   P0021  aucune visite récente à modifier (choisir_activite_visite,
--          fenêtre de grâce de 5 minutes écoulée ou jamais visité)
--   P0022  activité invalide ou non débloquée pour le niveau de la ville

-- ---------------------------------------------------------------------
-- Activité choisie à chaque visite. Nullable : les visites d'avant ce
-- jalon n'en ont pas (elles sortent de la fenêtre de 180 jours prise en
-- compte par jauges_ville() de toute façon, voir plus bas), et une
-- ligne sans activité n'entre jamais dans le calcul d'une jauge.
-- ---------------------------------------------------------------------
alter table public.visites add column activite text
  check (activite is null or activite in
    ('residentiel', 'industrie', 'commerce', 'loisirs', 'services', 'energie', 'recherche'));

-- Recommandation du maire, affichée à tous les visiteurs (docs
-- SYSTEME-DEVELOPPEMENT.md §2). Null = pas de recommandation active.
alter table public.cities add column recommandation_activite text
  check (recommandation_activite is null or recommandation_activite in
    ('residentiel', 'industrie', 'commerce', 'loisirs', 'services', 'energie', 'recherche'));

-- ---------------------------------------------------------------------
-- visiter_ville() : signature et type de retour inchangés depuis la
-- migration 0022, donc create or replace direct. Ajoute uniquement le
-- tirage au sort de l'activité parmi celles débloquées pour le niveau
-- de la ville (docs/SYSTEME-DEVELOPPEMENT.md §10 point 8 : Résidentiel
-- et Loisirs dès le Hameau, Commerce et Services dès Village (1 000),
-- Industrie et Énergie dès Bourg (5 000), Recherche dès Ville
-- (15 000)) — le gain de population reste un flat +1, inchangé.
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
  v_population_max integer;
  v_niveau integer;
  v_activites text[];
  v_activite text;
  v_jour date := (now() at time zone 'utc')::date;
  v_derniere_visite timestamptz;
  v_nb_aujourdhui integer;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_visiteur_id then
    raise exception 'visiter_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, population_max into v_owner_id, v_population_max
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'visiter_ville: ville introuvable' using errcode = 'P0004';
  end if;

  select max(created_at) into v_derniere_visite
    from public.visites
    where visiteur_id = p_visiteur_id and ville_id = p_ville_id;

  if v_derniere_visite is not null and v_derniere_visite > now() - interval '1 hour' then
    raise exception 'visiter_ville: délai minimum d''une heure non écoulé'
      using errcode = 'P0018';
  end if;

  select count(*) into v_nb_aujourdhui
    from public.visites
    where visiteur_id = p_visiteur_id and ville_id = p_ville_id and jour = v_jour;

  if v_nb_aujourdhui >= 3 then
    raise exception 'visiter_ville: plafond quotidien de visites atteint (3)'
      using errcode = 'P0019';
  end if;

  v_niveau := public.population_vers_niveau(v_population_max);
  v_activites := array['residentiel', 'loisirs'];
  if v_niveau >= 1 then v_activites := v_activites || array['commerce', 'services']; end if;
  if v_niveau >= 2 then v_activites := v_activites || array['industrie', 'energie']; end if;
  if v_niveau >= 3 then v_activites := v_activites || array['recherche']; end if;
  select a into v_activite from unnest(v_activites) as a order by random() limit 1;

  insert into public.visites (visiteur_id, ville_id, activite) values (p_visiteur_id, p_ville_id, v_activite);

  update public.cities
    set population = population + 1,
        population_max = greatest(population_max, population + 1),
        niveau = public.population_vers_niveau(greatest(population_max, population + 1))
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;

-- ---------------------------------------------------------------------
-- choisir_activite_visite() : remplace l'activité tirée au sort par le
-- choix explicite du visiteur, sur sa toute dernière visite de cette
-- ville (fenêtre de grâce de 5 minutes — largement assez pour le délai
-- de 2,5 s de VisiteAutomatique côté client, sans laisser un joueur
-- modifier une visite ancienne).
-- ---------------------------------------------------------------------
create or replace function public.choisir_activite_visite(
  p_visiteur_id uuid,
  p_ville_id uuid,
  p_activite text
)
returns public.visites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_population_max integer;
  v_niveau integer;
  v_activites text[];
  v_visite public.visites;
begin
  if auth.uid() is not null and auth.uid() <> p_visiteur_id then
    raise exception 'choisir_activite_visite: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select population_max into v_population_max from public.cities where id = p_ville_id;
  if v_population_max is null then
    raise exception 'choisir_activite_visite: ville introuvable' using errcode = 'P0004';
  end if;

  v_niveau := public.population_vers_niveau(v_population_max);
  v_activites := array['residentiel', 'loisirs'];
  if v_niveau >= 1 then v_activites := v_activites || array['commerce', 'services']; end if;
  if v_niveau >= 2 then v_activites := v_activites || array['industrie', 'energie']; end if;
  if v_niveau >= 3 then v_activites := v_activites || array['recherche']; end if;

  if not (p_activite = any(v_activites)) then
    raise exception 'choisir_activite_visite: activité invalide ou non débloquée : %', p_activite
      using errcode = 'P0022';
  end if;

  update public.visites
    set activite = p_activite
    where id = (
      select id from public.visites
      where visiteur_id = p_visiteur_id and ville_id = p_ville_id
        and created_at >= now() - interval '5 minutes'
      order by created_at desc
      limit 1
    )
    returning * into v_visite;

  if v_visite.id is null then
    raise exception 'choisir_activite_visite: aucune visite récente à modifier' using errcode = 'P0021';
  end if;

  return v_visite;
end;
$$;

-- ---------------------------------------------------------------------
-- definir_recommandation() : le maire (propriétaire) choisit
-- l'activité recommandée aux visiteurs, ou l'efface (p_activite null).
-- ---------------------------------------------------------------------
create or replace function public.definir_recommandation(
  p_owner_id uuid,
  p_ville_id uuid,
  p_activite text
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_population_max integer;
  v_niveau integer;
  v_activites text[];
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'definir_recommandation: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, population_max into v_owner_id, v_population_max
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'definir_recommandation: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id <> p_owner_id then
    raise exception 'definir_recommandation: seul le maire peut définir la recommandation'
      using errcode = 'P0007';
  end if;

  if p_activite is not null then
    v_niveau := public.population_vers_niveau(v_population_max);
    v_activites := array['residentiel', 'loisirs'];
    if v_niveau >= 1 then v_activites := v_activites || array['commerce', 'services']; end if;
    if v_niveau >= 2 then v_activites := v_activites || array['industrie', 'energie']; end if;
    if v_niveau >= 3 then v_activites := v_activites || array['recherche']; end if;

    if not (p_activite = any(v_activites)) then
      raise exception 'definir_recommandation: activité invalide ou non débloquée : %', p_activite
        using errcode = 'P0022';
    end if;
  end if;

  update public.cities
    set recommandation_activite = p_activite
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;

-- ---------------------------------------------------------------------
-- jauges_ville() : jauge de chaque activité (docs/SYSTEME-DEVELOPPEMENT.md
-- §3). "Élan" = somme des points pondérée par une décroissance
-- exponentielle de 3,3 %/jour (demi-vie ~3 semaines) — calculée à la
-- volée depuis les visites plutôt que maintenue dans un compteur à part
-- (même logique que activite_ville(), Jalon 9 : pas de job planifié
-- nécessaire). Fenêtre de 180 jours : au-delà, le poids résiduel
-- (0,967^180 ≈ 0,3 %) est négligeable, ça borne le coût de la requête
-- pour une vieille ville très active.
-- ---------------------------------------------------------------------
create or replace function public.jauges_ville(p_ville_id uuid)
returns table (activite text, part_cible numeric, elan numeric, jauge numeric)
language sql
stable
security definer
set search_path = public
as $$
  with parts (activite, part_cible) as (
    values
      ('residentiel', 0.30),
      ('industrie', 0.12),
      ('commerce', 0.14),
      ('loisirs', 0.12),
      ('services', 0.12),
      ('energie', 0.12),
      ('recherche', 0.08)
  ),
  elans as (
    select v.activite, sum(power(0.967::numeric, (current_date - v.jour)::numeric)) as elan
    from public.visites v
    where v.ville_id = p_ville_id
      and v.activite is not null
      and v.jour >= current_date - 180
    group by v.activite
  ),
  jointes as (
    select p.activite, p.part_cible, coalesce(e.elan, 0) as elan
    from parts p left join elans e on e.activite = p.activite
  ),
  total as (
    select sum(elan) as elan_total from jointes
  )
  select j.activite, j.part_cible, j.elan,
    (j.elan + 20 * j.part_cible) / (t.elan_total + 20) / j.part_cible as jauge
  from jointes j cross join total t
  order by j.activite;
$$;
