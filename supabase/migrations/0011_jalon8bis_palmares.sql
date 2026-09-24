-- Jalon 8bis — « Les palmarès »
-- Cahier des charges : docs/CLASSEMENTS.md §3-5 (classements annexes par
-- période et par échelle). Voir docs/DECISIONS.md §4 pour le journal
-- complet et le raisonnement de la décision ci-dessous.
--
-- Écart assumé par rapport à CLASSEMENTS.md §4 : la spécification
-- proposait une table `city_stats_jour` remplie au fil des événements
-- puis agrégée par pg_cron. Constat en écrivant ce jalon : les jalons
-- précédents journalisent déjà tout ce dont les 7 palmarès ont besoin
-- (visites, actions_influence, actions_antiville, jumelage_bonus, tous
-- avec une colonne `jour`), sauf le *montant* perdu par une action
-- AntiVille (seul le type d'action était journalisé). Plutôt qu'une
-- nouvelle table à tenir à jour en plus des logs existants, ce jalon
-- ajoute une seule colonne (`actions_antiville.montant`) et calcule
-- chaque palmarès par une requête directe sur les logs existants — même
-- philosophie que le choix, déjà fait au Jalon 8, de ne pas mettre de
-- vue matérialisée/pg_cron pour les classements principaux tant que
-- l'échelle réelle (quelques dizaines de villes) ne le justifie pas.
-- Décision prise sans attendre Adrien, à contester si besoin.

-- ---------------------------------------------------------------------
-- montant : quantité perdue par l'action AntiVille au moment où elle
-- s'est produite (habitants pour une contamination, points d'influence
-- pour une propagande, nul pour une grève qui ne retire rien
-- directement). Sans cette colonne, impossible de reconstituer plus
-- tard "combien" une ville a perdu — seul le fait qu'une action a eu
-- lieu était gardé. Nullable : les lignes déjà existantes avant ce
-- jalon n'ont pas cette information et resteront exclues du palmarès
-- « Plus éprouvées » pour la période où elles sont tombées.
-- ---------------------------------------------------------------------
alter table public.actions_antiville add column montant integer;

-- ---------------------------------------------------------------------
-- lancer_action_antiville (Jalon 4, redéfinie au Jalon 6) : identique,
-- renseigne juste `montant` au moment de l'insertion.
-- ---------------------------------------------------------------------
create or replace function public.lancer_action_antiville(
  p_attaquant_id uuid,
  p_ville_id uuid,
  p_type_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_population_avant integer;
  v_population_max_avant integer;
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_aujourdhui integer;
  v_nb_recent integer;
  v_multiplicateur numeric;
  v_perte integer;
  v_montant integer;
  v_ville public.cities;
begin
  if p_type_action not in ('greve', 'contamination', 'propagande') then
    raise exception 'lancer_action_antiville: type d''action invalide : %', p_type_action
      using errcode = 'P0006';
  end if;

  if auth.uid() is not null and auth.uid() <> p_attaquant_id then
    raise exception 'lancer_action_antiville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, population, population_max
    into v_owner_id, v_population_avant, v_population_max_avant
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'lancer_action_antiville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id = p_attaquant_id then
    raise exception 'lancer_action_antiville: impossible de s''attaquer soi-même'
      using errcode = 'P0005';
  end if;

  select count(*) into v_nb_aujourdhui
    from public.actions_antiville
    where attaquant_id = p_attaquant_id and jour = v_jour;

  if v_nb_aujourdhui >= 3 then
    raise exception 'lancer_action_antiville: quota quotidien d''actions AntiVille atteint (3)'
      using errcode = 'P0001';
  end if;

  select count(*) into v_nb_recent
    from public.actions_antiville
    where attaquant_id = p_attaquant_id
      and ville_id = p_ville_id
      and created_at >= now() - interval '24 hours';

  if v_nb_recent >= 2 then
    raise exception 'lancer_action_antiville: protection anti-harcèlement active sur cette ville'
      using errcode = 'P0003';
  end if;

  v_multiplicateur := case when v_nb_recent = 0 then 1.0 else 0.5 end;

  if p_type_action = 'contamination' then
    v_perte := floor(greatest(v_population_avant * 0.10, 1) * v_multiplicateur);
    v_montant := v_perte;
  elsif p_type_action = 'propagande' then
    v_montant := floor(2 * v_multiplicateur);
  else
    v_montant := null;
  end if;

  insert into public.actions_antiville (attaquant_id, ville_id, type_action, montant)
  values (p_attaquant_id, p_ville_id, p_type_action, v_montant);

  if p_type_action = 'contamination' then
    -- population_max et niveau ne bougent pas : la ville ne perd jamais
    -- de bâtiments visuellement.
    update public.cities
      set population = greatest(population - v_perte, 1)
      where id = p_ville_id
      returning * into v_ville;

  elsif p_type_action = 'propagande' then
    update public.cities
      set influence = greatest(influence - v_montant, 0)
      where id = p_ville_id
      returning * into v_ville;

  else -- greve
    update public.cities
      set greve_jusqua = now() + (interval '24 hours' * v_multiplicateur)
      where id = p_ville_id
      returning * into v_ville;
  end if;

  return jsonb_build_object(
    'ville', to_jsonb(v_ville),
    'effet_reduit', v_multiplicateur < 1.0
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Les 7 palmarès. Toutes les fonctions ont la même forme :
--   (p_depuis date default null, p_country_id text default null, p_region_id text default null)
-- p_depuis nul = "depuis toujours" ; le calcul des 4 périodes (jour,
-- semaine, mois, toujours) en dates se fait côté application. Une seule
-- échelle à la fois est filtrée (comme /classement au Jalon 8) : passer
-- p_country_id pour national, p_region_id pour régional, aucun des deux
-- pour mondial.
--
-- Chaque fonction renvoie tous les sujets avec une valeur > 0 (pas de
-- LIMIT), classés, avec leur rang exact via row_number() — l'appelant
-- affiche le haut du classement et retrouve "ma position" dans la même
-- liste sans requête séparée. Pas de LIMIT 100 arbitraire : à l'échelle
-- actuelle (quelques dizaines de villes), la liste entière des sujets
-- actifs sur la période est déjà petite.
-- security definer nécessaire : visites/actions_influence/
-- actions_antiville/jumelage_bonus ont une RLS limitée aux lignes du
-- joueur connecté (creer_ville et consorts, jalons précédents) ; ces
-- fonctions doivent agréger toutes les lignes.
-- ---------------------------------------------------------------------

create or replace function public.palmares_croissance(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (ville_id uuid, nom text, valeur bigint, rang bigint)
language sql
stable
security definer
set search_path = public
as $$
  with visites_gagnees as (
    select v.ville_id, count(*)::bigint as n
    from public.visites v
    where (p_depuis is null or v.jour >= p_depuis)
    group by v.ville_id
  ),
  bonus_gagnes as (
    select x.ville_id, count(*)::bigint as n
    from (
      select j.ville_proposante_id as ville_id, jb.jour
      from public.jumelage_bonus jb join public.jumelages j on j.id = jb.jumelage_id
      union all
      select j.ville_ciblee_id as ville_id, jb.jour
      from public.jumelage_bonus jb join public.jumelages j on j.id = jb.jumelage_id
    ) x
    where (p_depuis is null or x.jour >= p_depuis)
    group by x.ville_id
  ),
  totaux as (
    select c.id as ville_id, c.nom,
      (coalesce(vg.n, 0) + coalesce(bg.n, 0)) as valeur
    from public.cities c
    left join visites_gagnees vg on vg.ville_id = c.id
    left join bonus_gagnes bg on bg.ville_id = c.id
    where (p_country_id is null or c.country_id = p_country_id)
      and (p_region_id is null or c.region_id = p_region_id)
  )
  select ville_id, nom, valeur, row_number() over (order by valeur desc, nom asc) as rang
  from totaux
  where valeur > 0
  order by valeur desc, nom asc;
$$;

create or replace function public.palmares_pertes(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (ville_id uuid, nom text, valeur bigint, rang bigint)
language sql
stable
security definer
set search_path = public
as $$
  with pertes as (
    select a.ville_id, sum(coalesce(a.montant, 0))::bigint as n
    from public.actions_antiville a
    where a.type_action = 'contamination'
      and (p_depuis is null or a.jour >= p_depuis)
    group by a.ville_id
  ),
  totaux as (
    select c.id as ville_id, c.nom, coalesce(p.n, 0) as valeur
    from public.cities c
    left join pertes p on p.ville_id = c.id
    where (p_country_id is null or c.country_id = p_country_id)
      and (p_region_id is null or c.region_id = p_region_id)
  )
  select ville_id, nom, valeur, row_number() over (order by valeur desc, nom asc) as rang
  from totaux
  where valeur > 0
  order by valeur desc, nom asc;
$$;

create or replace function public.palmares_influence(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (ville_id uuid, nom text, valeur bigint, rang bigint)
language sql
stable
security definer
set search_path = public
as $$
  with gains as (
    select a.ville_id, count(*)::bigint as n
    from public.actions_influence a
    where (p_depuis is null or a.jour >= p_depuis)
    group by a.ville_id
  ),
  totaux as (
    select c.id as ville_id, c.nom, coalesce(g.n, 0) as valeur
    from public.cities c
    left join gains g on g.ville_id = c.id
    where (p_country_id is null or c.country_id = p_country_id)
      and (p_region_id is null or c.region_id = p_region_id)
  )
  select ville_id, nom, valeur, row_number() over (order by valeur desc, nom asc) as rang
  from totaux
  where valeur > 0
  order by valeur desc, nom asc;
$$;

create or replace function public.palmares_visites(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (ville_id uuid, nom text, valeur bigint, rang bigint)
language sql
stable
security definer
set search_path = public
as $$
  with recues as (
    select v.ville_id, count(*)::bigint as n
    from public.visites v
    where (p_depuis is null or v.jour >= p_depuis)
    group by v.ville_id
  ),
  totaux as (
    select c.id as ville_id, c.nom, coalesce(r.n, 0) as valeur
    from public.cities c
    left join recues r on r.ville_id = c.id
    where (p_country_id is null or c.country_id = p_country_id)
      and (p_region_id is null or c.region_id = p_region_id)
  )
  select ville_id, nom, valeur, row_number() over (order by valeur desc, nom asc) as rang
  from totaux
  where valeur > 0
  order by valeur desc, nom asc;
$$;

create or replace function public.palmares_attaques(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (ville_id uuid, nom text, valeur bigint, rang bigint)
language sql
stable
security definer
set search_path = public
as $$
  with recues as (
    select a.ville_id, count(*)::bigint as n
    from public.actions_antiville a
    where (p_depuis is null or a.jour >= p_depuis)
    group by a.ville_id
  ),
  totaux as (
    select c.id as ville_id, c.nom, coalesce(r.n, 0) as valeur
    from public.cities c
    left join recues r on r.ville_id = c.id
    where (p_country_id is null or c.country_id = p_country_id)
      and (p_region_id is null or c.region_id = p_region_id)
  )
  select ville_id, nom, valeur, row_number() over (order by valeur desc, nom asc) as rang
  from totaux
  where valeur > 0
  order by valeur desc, nom asc;
$$;

-- Classement de JOUEURS (pas de villes) : l'échelle (pays/région) filtre
-- sur la ville du joueur qui donne, pas sur celle qu'il visite.
create or replace function public.palmares_generosite(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (joueur_id uuid, pseudo text, valeur bigint, rang bigint)
language sql
stable
security definer
set search_path = public
as $$
  with dons as (
    select v.visiteur_id, count(*)::bigint as n
    from public.visites v
    where (p_depuis is null or v.jour >= p_depuis)
    group by v.visiteur_id
  ),
  totaux as (
    select u.id as joueur_id, u.pseudo, coalesce(d.n, 0) as valeur
    from public.users u
    left join public.cities pc on pc.id = u.city_id
    left join dons d on d.visiteur_id = u.id
    where (p_country_id is null or pc.country_id = p_country_id)
      and (p_region_id is null or pc.region_id = p_region_id)
  )
  select joueur_id, pseudo, valeur, row_number() over (order by valeur desc, pseudo asc) as rang
  from totaux
  where valeur > 0
  order by valeur desc, pseudo asc;
$$;

-- Classement de PAIRES jumelées (pas de villes individuelles) : une
-- paire compte dans l'échelle si l'une de ses deux villes en fait
-- partie (un jumelage peut traverser une frontière de pays/région).
create or replace function public.palmares_jumelages(
  p_depuis date default null,
  p_country_id text default null,
  p_region_id text default null
)
returns table (
  jumelage_id uuid,
  ville_a_id uuid,
  ville_a_nom text,
  ville_b_id uuid,
  ville_b_nom text,
  valeur bigint,
  rang bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with bonus as (
    select jb.jumelage_id, count(*)::bigint as n
    from public.jumelage_bonus jb
    where (p_depuis is null or jb.jour >= p_depuis)
    group by jb.jumelage_id
  ),
  totaux as (
    select j.id as jumelage_id,
      j.ville_proposante_id as ville_a_id, ca.nom as ville_a_nom,
      j.ville_ciblee_id as ville_b_id, cb.nom as ville_b_nom,
      coalesce(b.n, 0) as valeur
    from public.jumelages j
    join public.cities ca on ca.id = j.ville_proposante_id
    join public.cities cb on cb.id = j.ville_ciblee_id
    left join bonus b on b.jumelage_id = j.id
    where j.statut = 'actif'
      and (p_country_id is null or ca.country_id = p_country_id or cb.country_id = p_country_id)
      and (p_region_id is null or ca.region_id = p_region_id or cb.region_id = p_region_id)
  )
  select jumelage_id, ville_a_id, ville_a_nom, ville_b_id, ville_b_nom, valeur,
    row_number() over (order by valeur desc) as rang
  from totaux
  where valeur > 0
  order by valeur desc;
$$;
