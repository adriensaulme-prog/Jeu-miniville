-- Jalon 18 — Système de développement des villes (2/4) : les effets de
-- l'équilibre. docs/SYSTEME-DEVELOPPEMENT.md §4 (bonus/crises), §5
-- (manifestations), §6 bis (lien AntiVille, nouveaux paliers), bulletin
-- municipal. Le Jalon 17 posait le choix d'activité et les jauges sans
-- aucun effet ; celui-ci les branche.
--
-- Volontairement HORS PÉRIMÈTRE (renvoyé aux Jalons 19/20, ou point
-- ouvert — voir docs/DECISIONS.md §10) :
--   - mégaprojets, stocks (matériaux/revenus), technologies (§6, Jalon
--     20) — donc "grève met en pause le chantier" et les mégaprojets
--     défensifs (Hôpital/Zone logistique/Opéra) n'ont pas encore de
--     sens et ne sont pas implémentés ;
--   - vocation des quartiers / nouveaux bâtiments 3D par activité
--     (Jalon 19) ;
--   - "les gratte-ciel arrêtent de monter" en crise Énergie (effet
--     purement visuel, nécessiterait un nouvel état persistant pour
--     "geler" la hauteur — coût disproportionné pour ce jalon, point
--     ouvert) ;
--   - "fumée visible en 3D" (palier Émeutes) et "le pays est prévenu"
--     (palier Crise) — pas d'infra de notification pays pour l'instant,
--     point ouvert.
--
-- Mécanique de la grève REDÉFINIE par Adrien le 27/09/2026 (le document
-- initial se contredisait entre "bloque 24h, durée modulée par
-- l'Industrie" et "−0,1 % d'influence par attaque, cumulé comme
-- contamination/propagande" — signalé plutôt que tranché seul) :
-- palier selon le nombre CUMULÉ d'actions grève reçues aujourd'hui
-- (tous attaquants), pas par attaquant — 1 action → bloque 1 h,
-- 5 → 2 h, 20 → 5 h (exemples d'Adrien pour un Hameau), ajusté par la
-- taille de la ville ("plus la ville est grosse, plus il faudra
-- d'actions"). Formule retenue pour relier ces trois points
-- (delegated : "faire un ratio selon la catégorie") : racine carrée du
-- nombre d'actions divisé par un facteur de taille — voir
-- duree_blocage_greve_heures() plus bas, à ajuster avec les villes de
-- test. L'Industrie continue de moduler cette durée (jusqu'à -60 % en
-- point fort, +50 % en crise), comme indiqué au §4/§6bis.
--
-- L'ancienne "protection anti-harcèlement" (2 attaques du même
-- attaquant en 24h → effet réduit, 3e bloquée, code P0003) est
-- entièrement remplacée par le nouveau système de paliers cumulés par
-- ville (tous attaquants confondus) : P0003 devient inutilisé, laissé
-- dans le registre plutôt que réutilisé (même précédent que P0005).
--
-- Registre des codes d'erreur (suite des migrations 0006/0023, codes
-- P0001 à P0022 déjà pris) : aucun nouveau code nécessaire, toutes les
-- vérifications de ce jalon réutilisent des codes existants.

-- ---------------------------------------------------------------------
-- city_events : bulletin municipal (manifestations, attaques reçues).
-- Lecture publique comme cities — c'est une information publique sur
-- la ville, jamais écrit depuis le client (uniquement par les fonctions
-- SECURITY DEFINER ci-dessous).
-- ---------------------------------------------------------------------
create table public.city_events (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.cities (id) on delete cascade,
  type text not null check (type in ('manifestation', 'attaque_recue')),
  activite text check (activite is null or activite in
    ('residentiel', 'industrie', 'commerce', 'loisirs', 'services', 'energie', 'recherche')),
  type_action text check (type_action is null or type_action in ('greve', 'contamination', 'propagande')),
  valeur numeric,
  attaquant_ville_id uuid references public.cities (id) on delete set null,
  jour date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);

create index city_events_ville_idx on public.city_events (ville_id, created_at desc);

alter table public.city_events enable row level security;

create policy "city_events_lecture_publique"
  on public.city_events for select
  using (true);

-- Durée de blocage effectivement appliquée pour une grève (en heures),
-- pour affichage dans le bulletin — le montant contamination/propagande
-- reste dans la colonne existante actions_antiville.montant.
alter table public.actions_antiville add column duree_heures numeric;

-- Jalon 17 (choisir_activite_visite) : empêche de créditer deux fois le
-- bonus de solidarité (visite initiale tirée au hasard, puis changement
-- explicite vers l'activité protectrice).
alter table public.visites add column bonus_solidarite_applique boolean not null default false;

-- Idempotence du tirage quotidien de manifestation (verifier_manifestation
-- ci-dessous) : une date plutôt qu'une ligne city_events "à blanc",
-- pour ne jamais polluer le bulletin municipal avec des lignes "rien
-- ne s'est passé".
alter table public.cities add column derniere_verification_manifestation date;

-- ---------------------------------------------------------------------
-- Fonctions utilitaires — pures, réutilisées par plusieurs fonctions
-- ci-dessous.
-- ---------------------------------------------------------------------

-- Jauge d'une seule activité (voir jauges_ville(), migration 0023, pour
-- la formule complète) — évite de dupliquer le calcul de décroissance
-- dans chaque fonction qui a besoin d'une seule jauge.
create or replace function public.jauge_activite(p_ville_id uuid, p_activite text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select jauge from public.jauges_ville(p_ville_id) where activite = p_activite;
$$;

-- Intensité de crise (0 à 1) : 0 à jauge=60 %, 1 à jauge=0 %.
create or replace function public.intensite_crise(p_jauge numeric)
returns numeric
language sql
immutable
as $$
  select case when p_jauge >= 0.6 then 0 else least(1, (0.6 - p_jauge) / 0.6) end;
$$;

-- Intensité de point fort (0 à 1) : 0 à jauge=120 %, 1 à jauge=150 % et
-- au-delà (plafonné, docs/SYSTEME-DEVELOPPEMENT.md §4 "plafonnés").
create or replace function public.intensite_point_fort(p_jauge numeric)
returns numeric
language sql
immutable
as $$
  select case when p_jauge <= 1.2 then 0 else least(1, (p_jauge - 1.2) / 0.3) end;
$$;

-- Activité qui protège contre un type d'attaque (§6 bis, tableau).
create or replace function public.activite_protectrice(p_type_action text)
returns text
language sql
immutable
as $$
  select case p_type_action
    when 'greve' then 'industrie'
    when 'contamination' then 'services'
    when 'propagande' then 'loisirs'
    else null
  end;
$$;

-- Nombre total d'attaques AntiVille reçues par une ville aujourd'hui,
-- tous types et tous attaquants confondus (§6bis : "reçues par la
-- ville dans la journée, tous attaquants confondus").
create or replace function public.attaques_recues_aujourdhui(p_ville_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.actions_antiville
    where ville_id = p_ville_id and jour = (now() at time zone 'utc')::date;
$$;

-- Palier visible selon le nombre d'attaques reçues aujourd'hui (§6bis).
create or replace function public.palier_attaques(p_nb integer)
returns text
language sql
immutable
as $$
  select case
    when p_nb >= 1000 then 'sinistree'
    when p_nb >= 500 then 'crise'
    when p_nb >= 100 then 'emeutes'
    when p_nb >= 10 then 'troubles'
    when p_nb >= 1 then 'incidents'
    else 'calme'
  end;
$$;

-- Facteur de taille pour la grève (Adrien, 27/09/2026 : "plus la ville
-- est grosse, plus il faudra d'actions") — calqué sur l'échelle des
-- seuils de niveau existants (population_vers_niveau, 1 000 à 100 000).
create or replace function public.ratio_taille_ville(p_niveau integer)
returns integer
language sql
immutable
as $$
  select case p_niveau
    when 0 then 1
    when 1 then 2
    when 2 then 5
    when 3 then 10
    when 4 then 25
    else 50
  end;
$$;

-- Durée de blocage de l'influence reçue par la grève, selon le nombre
-- CUMULÉ d'actions grève reçues aujourd'hui (tous attaquants) et le
-- niveau de la ville. Trois points donnés par Adrien pour un Hameau
-- (niveau 0, ratio 1) : 1 action → 1 h, 5 → 2 h, 20 → 5 h — reliés ici
-- par une racine carrée (approximation raisonnable des trois points,
-- delegated à Claude Code, à ajuster avec les villes de test) :
-- √1=1, √5≈2,2, √20≈4,5. Plafonnée à 24 h comme l'ancienne mécanique.
create or replace function public.duree_blocage_greve_heures(p_nb_actions integer, p_niveau integer)
returns numeric
language sql
immutable
as $$
  select least(24, sqrt(greatest(p_nb_actions, 0)::numeric / public.ratio_taille_ville(p_niveau)));
$$;

-- ---------------------------------------------------------------------
-- visiter_ville() : signature inchangée, mais le TYPE DE RETOUR change
-- (jsonb au lieu de public.cities, pour renvoyer le gain réel — plus
-- garanti maintenant que le Résidentiel peut être en crise) : un
-- changement de type de retour nécessite de supprimer l'ancienne
-- fonction avant de la recréer (sinon Postgres lève 42P13 — piège
-- rencontré et documenté depuis le Jalon 8, voir DECISIONS.md §4).
-- ---------------------------------------------------------------------
drop function if exists public.visiter_ville(uuid, uuid);

create function public.visiter_ville(
  p_visiteur_id uuid,
  p_ville_id uuid
)
returns jsonb
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
  v_jauge_residentiel numeric;
  v_jauge_commerce numeric;
  v_probabilite_gain numeric;
  v_gain integer := 0;
  v_bonus_solidarite integer := 0;
  v_dernier_type_action text;
  v_derniere_attaque timestamptz;
  v_palier text;
  v_visite_id uuid;
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

  insert into public.visites (visiteur_id, ville_id, activite) values (p_visiteur_id, p_ville_id, v_activite)
    returning id into v_visite_id;

  -- Jalon 18 §4 : crise du Résidentiel — l'habitant n'est accordé
  -- qu'avec une probabilité jauge ÷ 60 % (formule donnée telle quelle
  -- par le document, pas la formule générique d'intensité).
  v_jauge_residentiel := public.jauge_activite(p_ville_id, 'residentiel');
  v_probabilite_gain := case when v_jauge_residentiel < 0.6 then v_jauge_residentiel / 0.6 else 1 end;

  if random() < v_probabilite_gain then
    v_gain := 1;
    -- Point fort Commerce : jusqu'à +25 % d'habitants par visite —
    -- traité ici comme une chance supplémentaire de +1 (l'habitant est
    -- un entier, pas de fraction possible).
    v_jauge_commerce := public.jauge_activite(p_ville_id, 'commerce');
    if random() < public.intensite_point_fort(v_jauge_commerce) * 0.25 then
      v_gain := v_gain + 1;
    end if;
  end if;

  -- Solidarité (§6bis) : si une attaque a touché cette ville dans les
  -- 24h et que l'activité tirée ici est celle qui protège contre le
  -- type d'attaque le plus récent, +1 habitant de plus (doublé au
  -- palier Émeutes et au-delà). Jamais retiré si l'activité change
  -- ensuite (voir choisir_activite_visite) — bonus_solidarite_applique
  -- empêche seulement un double crédit.
  select type_action, created_at into v_dernier_type_action, v_derniere_attaque
    from public.actions_antiville
    where ville_id = p_ville_id and created_at >= now() - interval '24 hours'
    order by created_at desc limit 1;

  if v_derniere_attaque is not null and public.activite_protectrice(v_dernier_type_action) = v_activite then
    v_palier := public.palier_attaques(public.attaques_recues_aujourdhui(p_ville_id));
    v_bonus_solidarite := case when v_palier in ('emeutes', 'crise', 'sinistree') then 2 else 1 end;
    v_gain := v_gain + v_bonus_solidarite;
    update public.visites set bonus_solidarite_applique = true where id = v_visite_id;
  end if;

  update public.cities
    set population = population + v_gain,
        population_max = greatest(population_max, population + v_gain),
        niveau = public.population_vers_niveau(greatest(population_max, population + v_gain))
    where id = p_ville_id
    returning * into v_ville;

  return jsonb_build_object('ville', to_jsonb(v_ville), 'gain', v_gain, 'activite', v_activite);
end;
$$;

-- ---------------------------------------------------------------------
-- choisir_activite_visite() : signature et type de retour inchangés
-- (toujours public.visites), donc create or replace direct. Ajoute la
-- même vérification de solidarité que visiter_ville() — un joueur qui
-- change explicitement pour l'activité protectrice après coup a droit
-- au même bonus que s'il l'avait tirée au hasard, une seule fois par
-- visite (bonus_solidarite_applique).
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
  v_dernier_type_action text;
  v_derniere_attaque timestamptz;
  v_palier text;
  v_bonus_solidarite integer;
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

  if not v_visite.bonus_solidarite_applique then
    select type_action, created_at into v_dernier_type_action, v_derniere_attaque
      from public.actions_antiville
      where ville_id = p_ville_id and created_at >= now() - interval '24 hours'
      order by created_at desc limit 1;

    if v_derniere_attaque is not null and public.activite_protectrice(v_dernier_type_action) = p_activite then
      v_palier := public.palier_attaques(public.attaques_recues_aujourdhui(p_ville_id));
      v_bonus_solidarite := case when v_palier in ('emeutes', 'crise', 'sinistree') then 2 else 1 end;

      update public.visites set bonus_solidarite_applique = true where id = v_visite.id;
      update public.cities
        set population = population + v_bonus_solidarite,
            population_max = greatest(population_max, population + v_bonus_solidarite),
            niveau = public.population_vers_niveau(greatest(population_max, population + v_bonus_solidarite))
        where id = p_ville_id;
    end if;
  end if;

  return v_visite;
end;
$$;

-- ---------------------------------------------------------------------
-- verifier_manifestation() : tirage quotidien (§5). Pas de tâche
-- planifiée dans ce projet (voir DECISIONS.md §4, Jalon 9,
-- activite_ville()) — appelée à la place de façon opportuniste à
-- chaque affichage de la page d'une ville (comme verifier_president()
-- depuis le Jalon 11), idempotente via la ligne city_events du jour :
-- si elle existe déjà (manifestation survenue OU non), on ne retire
-- jamais deux fois au même jour.
-- ---------------------------------------------------------------------
create or replace function public.verifier_manifestation(p_ville_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jour date := (now() at time zone 'utc')::date;
  v_deja_verifie date;
  v_jauges record;
  v_risque numeric := 0;
  v_jauge_energie numeric;
  v_pire_activite text;
  v_pire_jauge numeric;
  v_population integer;
  v_jauge_loisirs numeric;
  v_perte integer;
begin
  select derniere_verification_manifestation into v_deja_verifie
    from public.cities where id = p_ville_id;
  if v_deja_verifie is not distinct from v_jour then
    return;
  end if;

  -- Marque la vérification du jour tout de suite : deux appels
  -- concurrents sur la même ville le même jour ne doivent jamais
  -- tirer deux fois.
  update public.cities set derniere_verification_manifestation = v_jour where id = p_ville_id;

  v_pire_jauge := null;
  for v_jauges in select * from public.jauges_ville(p_ville_id) loop
    if v_jauges.jauge < 0.6 then
      v_risque := v_risque + case when v_jauges.activite = 'energie' then 20 else 10 end;
      if v_pire_jauge is null or v_jauges.jauge < v_pire_jauge then
        v_pire_jauge := v_jauges.jauge;
        v_pire_activite := v_jauges.activite;
      end if;
    end if;
  end loop;

  if v_pire_activite is null then
    -- Ville équilibrée : jamais de manifestation (§5).
    return;
  end if;

  -- Point fort Énergie : risque de manifestation divisé par 2 (§4),
  -- progressif comme tous les autres effets de ce jalon.
  v_jauge_energie := public.jauge_activite(p_ville_id, 'energie');
  v_risque := v_risque * (1 - 0.5 * public.intensite_point_fort(v_jauge_energie));

  if random() >= v_risque / 100.0 then
    return;
  end if;

  select population into v_population from public.cities where id = p_ville_id;
  v_jauge_loisirs := public.jauge_activite(p_ville_id, 'loisirs');
  v_perte := greatest(
    1,
    round(
      v_population * 0.01
        * (1 - 0.5 * public.intensite_point_fort(v_jauge_loisirs) + 0.5 * public.intensite_crise(v_jauge_loisirs))
    )
  );

  update public.cities set population = greatest(population - v_perte, 1) where id = p_ville_id;

  insert into public.city_events (ville_id, type, activite, valeur, jour)
    values (p_ville_id, 'manifestation', v_pire_activite, v_perte, v_jour);
end;
$$;

-- ---------------------------------------------------------------------
-- lancer_action_antiville() : refonte complète (§6bis) — signature et
-- type de retour (jsonb) inchangés, create or replace direct.
--
-- Remplace l'ancienne "protection anti-harcèlement" (par attaquant, 2
-- attaques → effet réduit, 3e bloquée) par le nouveau système de
-- paliers CUMULÉS par ville (tous attaquants confondus, voir
-- attaques_recues_aujourdhui()/palier_attaques()) : une attaque isolée
-- pèse peu (effet unitaire minuscule), une attaque massive coordonnée
-- pèse lourd (effets qui s'additionnent, plafond 10 %/jour pour
-- contamination et propagande). L'ancien quota par attaquant (3/jour)
-- et l'anti-rafale (2 s entre deux actions du même attaquant, Jalon 14)
-- restent inchangés — ce sont des protections différentes (contre UN
-- attaquant trop actif), pas remplacées par le nouveau système (qui
-- protège la VILLE CIBLÉE contre une coalition).
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
  v_influence_avant integer;
  v_niveau integer;
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_aujourdhui integer;
  v_derniere_action timestamptz;
  v_activite_defense text;
  v_jauge_defense numeric;
  v_multiplicateur_defense numeric;
  v_perte integer;
  v_perte_existante numeric;
  v_plafond integer;
  v_duree_heures numeric;
  v_nb_greve_aujourdhui integer;
  v_attaquant_ville_id uuid;
  v_ville public.cities;
begin
  if p_type_action not in ('greve', 'contamination', 'propagande') then
    raise exception 'lancer_action_antiville: type d''action invalide : %', p_type_action
      using errcode = 'P0006';
  end if;

  if auth.uid() is not null and auth.uid() <> p_attaquant_id then
    raise exception 'lancer_action_antiville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select c.owner_id, c.population, c.influence, public.population_vers_niveau(c.population_max)
    into v_owner_id, v_population_avant, v_influence_avant, v_niveau
    from public.cities c where c.id = p_ville_id;
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

  select max(created_at) into v_derniere_action
    from public.actions_antiville
    where attaquant_id = p_attaquant_id;

  if v_derniere_action is not null and v_derniere_action > now() - interval '2 seconds' then
    raise exception 'lancer_action_antiville: actions trop rapprochées' using errcode = 'P0020';
  end if;

  -- Défense (§4/§6bis) : l'activité qui protège contre ce type
  -- d'attaque réduit son effet jusqu'à -50 % en point fort côté
  -- CIBLE, l'aggrave jusqu'à +50 % en crise.
  v_activite_defense := public.activite_protectrice(p_type_action);
  v_jauge_defense := public.jauge_activite(p_ville_id, v_activite_defense);
  v_multiplicateur_defense := 1 - 0.5 * public.intensite_point_fort(v_jauge_defense)
                                 + 0.5 * public.intensite_crise(v_jauge_defense);

  if p_type_action = 'contamination' then
    v_perte := greatest(1, round(v_population_avant * 0.0001 * v_multiplicateur_defense));
    select coalesce(sum(montant), 0) into v_perte_existante
      from public.actions_antiville
      where ville_id = p_ville_id and type_action = 'contamination' and jour = v_jour;
    -- greatest(1, ...) : sans ce plancher, une ville à très faible
    -- population aurait un plafond de 0 (10 % de presque rien arrondi
    -- à 0), ce qui bloquerait même la toute première attaque du jour —
    -- bug trouvé en vérifiant cette migration après application.
    v_plafond := greatest(1, ceil(v_population_avant * 0.10));
    v_perte := greatest(0, least(v_perte, v_plafond - v_perte_existante::integer));

  elsif p_type_action = 'propagande' then
    v_perte := greatest(1, round(v_influence_avant * 0.001 * v_multiplicateur_defense));
    select coalesce(sum(montant), 0) into v_perte_existante
      from public.actions_antiville
      where ville_id = p_ville_id and type_action = 'propagande' and jour = v_jour;
    -- Même correctif : une ville à 0 influence (très fréquent, ville
    -- neuve ou déjà propagandée à 0) aurait sinon un plafond de 0,
    -- devenant immunisée contre toute nouvelle propagande.
    v_plafond := greatest(1, ceil(v_influence_avant * 0.10));
    v_perte := greatest(0, least(v_perte, v_plafond - v_perte_existante::integer));

  else -- greve : durée selon le nombre cumulé d'actions grève
    -- aujourd'hui (celle-ci comprise) et le niveau de la ville, modulée
    -- par l'Industrie (Adrien, 27/09/2026 — voir en-tête de fichier).
    select count(*) into v_nb_greve_aujourdhui
      from public.actions_antiville
      where ville_id = p_ville_id and type_action = 'greve' and jour = v_jour;
    v_duree_heures := public.duree_blocage_greve_heures(v_nb_greve_aujourdhui + 1, v_niveau) * v_multiplicateur_defense;
  end if;

  insert into public.actions_antiville (attaquant_id, ville_id, type_action, montant, duree_heures)
  values (
    p_attaquant_id, p_ville_id, p_type_action,
    case when p_type_action in ('contamination', 'propagande') then v_perte else null end,
    case when p_type_action = 'greve' then v_duree_heures else null end
  );

  if p_type_action = 'contamination' then
    update public.cities
      set population = greatest(population - v_perte, 1)
      where id = p_ville_id
      returning * into v_ville;

  elsif p_type_action = 'propagande' then
    update public.cities
      set influence = greatest(influence - v_perte, 0)
      where id = p_ville_id
      returning * into v_ville;

  else -- greve
    update public.cities
      set greve_jusqua = now() + (v_duree_heures::text || ' hours')::interval
      where id = p_ville_id
      returning * into v_ville;
  end if;

  select city_id into v_attaquant_ville_id from public.users where id = p_attaquant_id;
  insert into public.city_events (ville_id, type, activite, type_action, valeur, attaquant_ville_id, jour)
    values (
      p_ville_id, 'attaque_recue', v_activite_defense, p_type_action,
      case when p_type_action = 'greve' then v_duree_heures else v_perte end,
      v_attaquant_ville_id, v_jour
    );

  return jsonb_build_object(
    'ville', to_jsonb(v_ville),
    'palier', public.palier_attaques(public.attaques_recues_aujourdhui(p_ville_id)),
    'perte', v_perte,
    'duree_heures', v_duree_heures
  );
end;
$$;

-- ---------------------------------------------------------------------
-- reclamer_bonus_jumelages() : signature et type de retour inchangés,
-- create or replace direct. Ajoute la crise du Commerce (§4 : "crise :
-- pas de bonus des jumelages") — effet binaire, pas progressif (le
-- document ne dit pas "jusqu'à" pour cette case) : sous 60 % de jauge
-- Commerce, CETTE ville ne touche pas le bonus ce jour-là (l'autre
-- ville du jumelage peut quand même toucher le sien si son propre
-- Commerce va bien — chaque ville a sa propre jauge).
-- ---------------------------------------------------------------------
create or replace function public.reclamer_bonus_jumelages(p_joueur_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma_ville_id uuid;
  v_jour date := (now() at time zone 'utc')::date;
  v_jumelage record;
  v_autre_ville_id uuid;
  v_autre_owner_id uuid;
  v_moi_actif boolean;
  v_autre_actif boolean;
  v_nb_bonus_accordes integer := 0;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'reclamer_bonus_jumelages: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select city_id into v_ma_ville_id from public.users where id = p_joueur_id;
  if v_ma_ville_id is null then
    return jsonb_build_object('bonus_accordes', 0);
  end if;

  v_moi_actif := exists(
    select 1 from public.visites where visiteur_id = p_joueur_id and jour = v_jour
    union all
    select 1 from public.actions_influence where joueur_id = p_joueur_id and jour = v_jour
    union all
    select 1 from public.actions_antiville where attaquant_id = p_joueur_id and jour = v_jour
  );

  if not v_moi_actif then
    return jsonb_build_object('bonus_accordes', 0);
  end if;

  for v_jumelage in
    select * from public.jumelages
    where statut = 'actif'
      and (ville_proposante_id = v_ma_ville_id or ville_ciblee_id = v_ma_ville_id)
  loop
    v_autre_ville_id := case
      when v_jumelage.ville_proposante_id = v_ma_ville_id then v_jumelage.ville_ciblee_id
      else v_jumelage.ville_proposante_id
    end;

    select owner_id into v_autre_owner_id from public.cities where id = v_autre_ville_id;

    v_autre_actif := exists(
      select 1 from public.visites where visiteur_id = v_autre_owner_id and jour = v_jour
      union all
      select 1 from public.actions_influence where joueur_id = v_autre_owner_id and jour = v_jour
      union all
      select 1 from public.actions_antiville where attaquant_id = v_autre_owner_id and jour = v_jour
    );

    if not v_autre_actif then
      continue;
    end if;

    begin
      insert into public.jumelage_bonus (jumelage_id, jour) values (v_jumelage.id, v_jour);
    exception when unique_violation then
      continue; -- déjà accordé aujourd'hui pour ce jumelage
    end;

    if public.jauge_activite(v_ma_ville_id, 'commerce') >= 0.6 then
      update public.cities
        set population = population + 1,
            population_max = greatest(population_max, population + 1),
            niveau = public.population_vers_niveau(greatest(population_max, population + 1))
        where id = v_ma_ville_id;
    end if;
    if public.jauge_activite(v_autre_ville_id, 'commerce') >= 0.6 then
      update public.cities
        set population = population + 1,
            population_max = greatest(population_max, population + 1),
            niveau = public.population_vers_niveau(greatest(population_max, population + 1))
        where id = v_autre_ville_id;
    end if;
    v_nb_bonus_accordes := v_nb_bonus_accordes + 1;
  end loop;

  return jsonb_build_object('bonus_accordes', v_nb_bonus_accordes);
end;
$$;

-- ---------------------------------------------------------------------
-- influencer_ville() : signature et type de retour inchangés, create
-- or replace direct. Point fort Recherche (§4) : chaque influence
-- envoyée a jusqu'à 50 % de chance de compter double — jauge de la
-- ville CIBLÉE (celle qui a investi en Recherche défend/profite mieux
-- de l'influence qu'elle reçoit, même logique que les autres effets
-- "défensifs" du tableau).
-- ---------------------------------------------------------------------
create or replace function public.influencer_ville(
  p_joueur_id uuid,
  p_ville_id uuid
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_greve_jusqua timestamptz;
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_actions integer;
  v_derniere_action timestamptz;
  v_jauge_recherche numeric;
  v_gain integer := 1;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'influencer_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, greve_jusqua into v_owner_id, v_greve_jusqua
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'influencer_ville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id = p_joueur_id then
    raise exception 'influencer_ville: impossible d''influencer sa propre ville' using errcode = 'P0005';
  end if;

  if v_greve_jusqua is not null and v_greve_jusqua > now() then
    raise exception 'influencer_ville: cette ville est en grève, l''influence est bloquée'
      using errcode = 'P0002';
  end if;

  select count(*) into v_nb_actions
    from public.actions_influence
    where joueur_id = p_joueur_id and jour = v_jour;

  if v_nb_actions >= 5 then
    raise exception 'influencer_ville: quota quotidien d''actions d''influence atteint (5)'
      using errcode = 'P0001';
  end if;

  select max(created_at) into v_derniere_action
    from public.actions_influence
    where joueur_id = p_joueur_id;

  if v_derniere_action is not null and v_derniere_action > now() - interval '2 seconds' then
    raise exception 'influencer_ville: actions trop rapprochées' using errcode = 'P0020';
  end if;

  insert into public.actions_influence (joueur_id, ville_id) values (p_joueur_id, p_ville_id);

  v_jauge_recherche := public.jauge_activite(p_ville_id, 'recherche');
  if random() < public.intensite_point_fort(v_jauge_recherche) * 0.5 then
    v_gain := 2;
  end if;

  update public.cities
    set influence = influence + v_gain
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;
