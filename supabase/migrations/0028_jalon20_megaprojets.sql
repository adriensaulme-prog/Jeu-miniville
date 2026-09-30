-- Jalon 20 (1/3) — Système de développement des villes (4/4), premier
-- sous-jalon : les mégaprojets du maire (docs/SYSTEME-DEVELOPPEMENT.md
-- §6). Chaque palier de population débloque un choix parmi 3-4 projets
-- (financement collectif via les stocks de matériaux/revenus et les
-- points de l'activité du thème) ; une fois construit, un bâtiment
-- unique apparaît et — pour les 4 projets où le document donne un
-- chiffre précis — un bonus permanent s'applique. Les technologies de
-- Recherche (même §6) et les monuments d'influence (A-INTEGRER.md §19)
-- restent pour de prochains sous-jalons, comme demandé par Adrien
-- (27/09/2026, "un sous-jalon à la fois").
--
-- Portée assumée, à signaler dans le rapport : seuls 4 des ~18 projets
-- du catalogue ont un effet numérique câblé (Stade, Centrale
-- solaire/Parc éolien/Centrale, Hôpital, Opéra — ceux où le document
-- donne un chiffre exact) ; les autres (dont Zone logistique, dont le
-- bonus dépend d'un mécanisme de "pause pendant la grève" qui n'existe
-- pas encore côté stocks) sont pour l'instant purement cosmétiques,
-- comme les monuments d'influence. Catalogue de la Mégapole (palier 4)
-- et au-delà inventé par Claude Code ("peuvent reprendre des variantes
-- des paliers précédents en attendant", réponse d'Adrien du
-- 26/09/2026) : grand_stade (loisirs), centrale_nouvelle_generation
-- (energie), siege_international (commerce).
--
-- Registre des codes d'erreur : nouveaux P0024 (palier de mégaprojet
-- pas encore débloqué), P0025 (palier déjà choisi), P0026 (type
-- invalide pour ce palier).

-- ---------------------------------------------------------------------
-- Stocks : cumul jamais décroissant (contrairement à l'élan des
-- jauges, qui décroît) — "ils s'accumulent et se dépensent dans les
-- mégaprojets" (§6). Calculé à la volée depuis visites.activite (même
-- logique que jauges_ville()/activite_ville() : pas de compteur à
-- part), sans fenêtre de 180 jours cette fois (les stocks ne décroissent
-- jamais). Seule la dépense (à la construction d'un mégaprojet) est
-- mémorisée, sur cities.
-- ---------------------------------------------------------------------
alter table public.cities
  add column materiaux_depenses integer not null default 0,
  add column revenus_depenses integer not null default 0;

-- city_events.type : nouvelle valeur 'megaprojet_construit', pour le
-- bulletin municipal (BulletinMunicipal.tsx affichera ce nouveau type).
alter table public.city_events drop constraint if exists city_events_type_check;
alter table public.city_events
  add constraint city_events_type_check
  check (type in ('manifestation', 'attaque_recue', 'megaprojet_construit'));

create or replace function public.stock_ville(p_ville_id uuid, p_activite text)
returns integer
language sql
stable
as $$
  select count(*)::integer from public.visites
    where ville_id = p_ville_id and activite = p_activite;
$$;

-- ---------------------------------------------------------------------
-- Catalogue et seuils. Palier 0 = Bourg (5 000) ... palier 4 = Mégapole
-- (250 000), puis un palier de plus tous les 50 000 habitants
-- (§6 : "puis tous les 50 000 : nouveaux choix, coûts ×1,5"),
-- réutilisant le catalogue du palier 4 (least(palier, 4) ci-dessous).
-- ---------------------------------------------------------------------
create or replace function public.megaprojet_options(p_palier integer)
returns table(type text, activite text)
language sql
immutable
as $$
  select t.type, t.activite from (values
    (0, 'grande_ecole', 'services'),
    (0, 'parc_sports', 'loisirs'),
    (0, 'marche_couvert', 'commerce'),
    (1, 'hopital', 'services'),
    (1, 'stade', 'loisirs'),
    (1, 'centrale_solaire', 'energie'),
    (1, 'zone_logistique', 'industrie'),
    (2, 'technopole', 'recherche'),
    (2, 'gare_tgv', 'commerce'),
    (2, 'parc_eolien', 'energie'),
    (2, 'opera', 'loisirs'),
    (3, 'tour_emblematique', 'residentiel'),
    (3, 'aeroport', 'commerce'),
    (3, 'centre_recherche', 'recherche'),
    (3, 'centrale', 'energie'),
    (4, 'grand_stade', 'loisirs'),
    (4, 'centrale_nouvelle_generation', 'energie'),
    (4, 'siege_international', 'commerce')
  ) as t(palier, type, activite)
  where t.palier = least(p_palier, 4);
$$;

create or replace function public.seuil_megaprojet(p_palier integer)
returns integer
language sql
immutable
as $$
  select case
    when p_palier <= 0 then 5000
    when p_palier = 1 then 15000
    when p_palier = 2 then 40000
    when p_palier = 3 then 100000
    when p_palier = 4 then 250000
    else 250000 + 50000 * (p_palier - 4)
  end;
$$;

create or replace function public.nb_megaprojets_ouverts(p_population integer)
returns integer
language sql
immutable
as $$
  select case
    when p_population < 5000 then 0
    when p_population < 15000 then 1
    when p_population < 40000 then 2
    when p_population < 100000 then 3
    when p_population < 250000 then 4
    else 5 + floor((p_population - 250000)::numeric / 50000)::integer
  end;
$$;

create or replace function public.cout_megaprojet(p_palier integer)
returns table(materiaux integer, revenus integer, points integer)
language sql
immutable
as $$
  select
    round(case
      when p_palier <= 0 then 400
      when p_palier = 1 then 1200
      when p_palier = 2 then 3200
      when p_palier = 3 then 8000
      else 12000 * power(1.5::numeric, greatest(p_palier - 4, 0))
    end)::integer as materiaux,
    round(case
      when p_palier <= 0 then 400
      when p_palier = 1 then 1200
      when p_palier = 2 then 3200
      when p_palier = 3 then 8000
      else 12000 * power(1.5::numeric, greatest(p_palier - 4, 0))
    end)::integer as revenus,
    round(case
      when p_palier <= 0 then 250
      when p_palier = 1 then 750
      when p_palier = 2 then 2000
      when p_palier = 3 then 5000
      else 7500 * power(1.5::numeric, greatest(p_palier - 4, 0))
    end)::integer as points;
$$;

-- ---------------------------------------------------------------------
-- megaprojets : un palier, un projet, jamais retouché une fois choisi
-- (même philosophie que city_blocks, Jalon 19). Lecture publique
-- (visiteurs et maire voient le chantier en cours) ; jamais écrite
-- depuis le client.
-- ---------------------------------------------------------------------
create table public.megaprojets (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.cities (id) on delete cascade,
  palier integer not null,
  type text not null,
  statut text not null default 'en_chantier' check (statut in ('en_chantier', 'construit')),
  choisi_le timestamptz not null default now(),
  construit_le timestamptz,
  unique (ville_id, palier)
);

create index megaprojets_ville_idx on public.megaprojets (ville_id);

alter table public.megaprojets enable row level security;

create policy "megaprojets_lecture_publique"
  on public.megaprojets for select
  using (true);

-- ---------------------------------------------------------------------
-- choisir_megaprojet() : réservé au maire (propriétaire de la ville),
-- un seul choix par palier, jamais modifiable ensuite.
-- ---------------------------------------------------------------------
create or replace function public.choisir_megaprojet(
  p_owner_id uuid,
  p_ville_id uuid,
  p_palier integer,
  p_type text
)
returns public.megaprojets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_population_max integer;
  v_megaprojet public.megaprojets;
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'choisir_megaprojet: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, population_max into v_owner_id, v_population_max
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'choisir_megaprojet: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id <> p_owner_id then
    raise exception 'choisir_megaprojet: réservé au maire de la ville' using errcode = 'P0007';
  end if;

  if p_palier >= public.nb_megaprojets_ouverts(v_population_max) then
    raise exception 'choisir_megaprojet: palier % pas encore débloqué', p_palier
      using errcode = 'P0024';
  end if;

  if exists (select 1 from public.megaprojets where ville_id = p_ville_id and palier = p_palier) then
    raise exception 'choisir_megaprojet: palier % déjà choisi', p_palier using errcode = 'P0025';
  end if;

  if not exists (select 1 from public.megaprojet_options(p_palier) o where o.type = p_type) then
    raise exception 'choisir_megaprojet: type invalide pour le palier % : %', p_palier, p_type
      using errcode = 'P0026';
  end if;

  insert into public.megaprojets (ville_id, palier, type)
    values (p_ville_id, p_palier, p_type)
    returning * into v_megaprojet;

  return v_megaprojet;
end;
$$;

-- ---------------------------------------------------------------------
-- avancer_megaprojets() : construit les chantiers financés. Appelée de
-- façon opportuniste à chaque affichage d'une ville, même logique que
-- assigner_vocations_blocs()/verifier_manifestation(). Idempotente :
-- un chantier déjà construit n'est jamais retouché.
-- ---------------------------------------------------------------------
create or replace function public.avancer_megaprojets(p_ville_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chantier record;
  v_activite_theme text;
  v_cout record;
  v_points integer;
  v_materiaux_dispo integer;
  v_revenus_dispo integer;
begin
  for v_chantier in
    select * from public.megaprojets where ville_id = p_ville_id and statut = 'en_chantier'
  loop
    select activite into v_activite_theme
      from public.megaprojet_options(v_chantier.palier) where type = v_chantier.type;

    select count(*)::integer into v_points
      from public.visites
      where ville_id = p_ville_id
        and activite = v_activite_theme
        and created_at >= v_chantier.choisi_le;

    select * into v_cout from public.cout_megaprojet(v_chantier.palier);

    select public.stock_ville(p_ville_id, 'industrie') - c.materiaux_depenses into v_materiaux_dispo
      from public.cities c where c.id = p_ville_id;
    select public.stock_ville(p_ville_id, 'commerce') - c.revenus_depenses into v_revenus_dispo
      from public.cities c where c.id = p_ville_id;

    if v_points >= v_cout.points and v_materiaux_dispo >= v_cout.materiaux and v_revenus_dispo >= v_cout.revenus then
      update public.cities
        set materiaux_depenses = materiaux_depenses + v_cout.materiaux,
            revenus_depenses = revenus_depenses + v_cout.revenus
        where id = p_ville_id;

      update public.megaprojets
        set statut = 'construit', construit_le = now()
        where id = v_chantier.id;

      insert into public.city_events (ville_id, type, activite, valeur, jour)
        values (p_ville_id, 'megaprojet_construit', v_activite_theme, v_chantier.palier, (now() at time zone 'utc')::date);
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- etat_megaprojets() : lecture pour l'affichage (progression des
-- chantiers en cours et déjà construits) — le maire voit ça sur
-- "Ma ville" (avec les boutons de choix pour les paliers pas encore
-- choisis, calculés côté client à partir de nb_megaprojets_ouverts()
-- et de cette liste), les visiteurs le voient en lecture seule sur
-- "Villes" pour savoir quoi financer.
-- ---------------------------------------------------------------------
create or replace function public.etat_megaprojets(p_ville_id uuid)
returns table(
  palier integer,
  type text,
  activite text,
  statut text,
  points integer,
  cout_points integer,
  materiaux integer,
  cout_materiaux integer,
  revenus integer,
  cout_revenus integer
)
language sql
stable
as $$
  select
    m.palier,
    m.type,
    o.activite,
    m.statut,
    (
      select count(*)::integer from public.visites v
      where v.ville_id = p_ville_id and v.activite = o.activite and v.created_at >= m.choisi_le
    ) as points,
    c.points as cout_points,
    public.stock_ville(p_ville_id, 'industrie') - ci.materiaux_depenses as materiaux,
    c.materiaux as cout_materiaux,
    public.stock_ville(p_ville_id, 'commerce') - ci.revenus_depenses as revenus,
    c.revenus as cout_revenus
  from public.megaprojets m
  join public.megaprojet_options(m.palier) o on o.type = m.type
  cross join lateral public.cout_megaprojet(m.palier) c
  join public.cities ci on ci.id = p_ville_id
  where m.ville_id = p_ville_id
  order by m.palier;
$$;

-- ---------------------------------------------------------------------
-- Bonus des 4 mégaprojets à effet numérique documenté (§6/§6bis) :
-- Centrale solaire / Parc éolien / Centrale (+20 % élan Énergie,
-- cumulatif s'il y en a plusieurs), Hôpital (contamination divisée par
-- 2 en plus de la défense existante), Opéra (propagande divisée par
-- 2). Stade (-25 % pertes de manifestation) est câblé directement dans
-- verifier_manifestation() ci-dessous, pas ici : la fonction n'a pas
-- besoin d'un helper séparé pour un seul type.
-- ---------------------------------------------------------------------
create or replace function public.nb_megaprojets_construits(p_ville_id uuid, p_types text[])
returns integer
language sql
stable
as $$
  select count(*)::integer from public.megaprojets
    where ville_id = p_ville_id and statut = 'construit' and type = any(p_types);
$$;

-- jauges_ville() : signature et type de retour inchangés depuis la
-- migration 0023, donc create or replace direct. Seul changement :
-- l'élan Énergie est multiplié par 1,2 pour chaque Centrale
-- solaire/Parc éolien/Centrale construite dans cette ville.
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
    select
      p.activite,
      p.part_cible,
      coalesce(e.elan, 0)
        * case
            when p.activite = 'energie'
              then 1 + 0.2 * public.nb_megaprojets_construits(
                p_ville_id, array['centrale_solaire', 'parc_eolien', 'centrale', 'centrale_nouvelle_generation']
              )
            else 1
          end as elan
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

-- verifier_manifestation() : signature et type de retour inchangés
-- depuis la migration 0024, donc create or replace direct. Seul
-- changement : Stade construit → pertes de manifestation ×0,75.
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
    return;
  end if;

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

  if public.nb_megaprojets_construits(p_ville_id, array['stade', 'grand_stade']) > 0 then
    v_perte := greatest(1, round(v_perte * 0.75));
  end if;

  update public.cities set population = greatest(population - v_perte, 1) where id = p_ville_id;

  insert into public.city_events (ville_id, type, activite, valeur, jour)
    values (p_ville_id, 'manifestation', v_pire_activite, v_perte, v_jour);
end;
$$;

-- lancer_action_antiville() : signature et type de retour inchangés
-- depuis la migration 0024, donc create or replace direct. Seul
-- changement : Hôpital construit → contamination ÷2 en plus de la
-- défense existante ; Opéra construit → propagande ÷2 en plus de la
-- défense existante (appliqué avant le plafond quotidien).
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

  v_activite_defense := public.activite_protectrice(p_type_action);
  v_jauge_defense := public.jauge_activite(p_ville_id, v_activite_defense);
  v_multiplicateur_defense := 1 - 0.5 * public.intensite_point_fort(v_jauge_defense)
                                 + 0.5 * public.intensite_crise(v_jauge_defense);

  if p_type_action = 'contamination' then
    v_perte := greatest(1, round(v_population_avant * 0.0001 * v_multiplicateur_defense));
    if public.nb_megaprojets_construits(p_ville_id, array['hopital']) > 0 then
      v_perte := greatest(1, round(v_perte * 0.5));
    end if;
    select coalesce(sum(montant), 0) into v_perte_existante
      from public.actions_antiville
      where ville_id = p_ville_id and type_action = 'contamination' and jour = v_jour;
    v_plafond := greatest(1, ceil(v_population_avant * 0.10));
    v_perte := greatest(0, least(v_perte, v_plafond - v_perte_existante::integer));

  elsif p_type_action = 'propagande' then
    v_perte := greatest(1, round(v_influence_avant * 0.001 * v_multiplicateur_defense));
    if public.nb_megaprojets_construits(p_ville_id, array['opera']) > 0 then
      v_perte := greatest(1, round(v_perte * 0.5));
    end if;
    select coalesce(sum(montant), 0) into v_perte_existante
      from public.actions_antiville
      where ville_id = p_ville_id and type_action = 'propagande' and jour = v_jour;
    v_plafond := greatest(1, ceil(v_influence_avant * 0.10));
    v_perte := greatest(0, least(v_perte, v_plafond - v_perte_existante::integer));

  else -- greve
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
