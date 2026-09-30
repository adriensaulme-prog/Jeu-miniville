-- Jalon 20 (3/3) — Système de développement des villes (4/4), dernier
-- sous-jalon : les monuments d'influence (docs/A-INTEGRER.md §19,
-- décision d'Adrien du 27/09/2026). Contrairement aux mégaprojets
-- (1/3) et aux technologies (2/3), un catalogue **fini** de 16 paliers
-- (pas de "puis ×2" au-delà) : 10, 25, 50, 100, 250, 500, 1 000,
-- 2 500, 5 000, 10 000, 25 000, 50 000, 100 000, 250 000, 500 000,
-- 1 000 000. Purement cosmétique/prestige (§19 : "pas de bonus de
-- gameplay"), aucun choix du maire, aucun financement — débloqués
-- automatiquement dès que le RECORD d'influence (`influence_max`,
-- jamais décroissant même si `influence` rebaisse ensuite — même
-- principe que `population_max`) franchit le palier.
--
-- Registre des codes d'erreur : aucun nouveau (rien n'est appelable
-- directement par un joueur, tout est automatique comme
-- assigner_vocations_blocs()/avancer_technologies()).

-- ---------------------------------------------------------------------
-- influence_max : record historique d'influence, jamais décroissant.
-- Seules deux fonctions modifient `cities.influence` aujourd'hui
-- (influencer_ville() et lancer_action_antiville(), branche
-- propagande) — les deux recréées ci-dessous pour maintenir
-- `influence_max` en même temps, même geste que `population_max`
-- partout où `population` change (pas de trigger : ce projet
-- maintient ces records en ligne, explicitement, dans chaque fonction
-- anti-triche — cohérent avec le reste du code plutôt qu'un mécanisme
-- caché).
-- ---------------------------------------------------------------------
alter table public.cities add column influence_max integer not null default 0;
update public.cities set influence_max = influence;

-- influencer_ville() : signature et type de retour inchangés depuis la
-- migration 0024, donc create or replace direct.
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
    set influence = influence + v_gain,
        influence_max = greatest(influence_max, influence + v_gain)
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;

-- lancer_action_antiville() : signature et type de retour inchangés
-- depuis la migration 0024, donc create or replace direct. Seul
-- changement par rapport à la version du Jalon 20 1/3 (migration
-- 0028) : la branche propagande maintient aussi influence_max.
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
      -- influence_max ne bouge pas ici : une perte ne peut jamais
      -- augmenter le record, greatest(influence_max, ...) serait un
      -- no-op — inutile de l'écrire.
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
-- Catalogue fixe des 16 paliers (§19 du document, repris tel quel).
-- ---------------------------------------------------------------------
create or replace function public.monument_catalogue()
returns table(palier integer, seuil integer, type text)
language sql
immutable
as $$
  select * from (values
    (0, 10, 'borne_commemorative'),
    (1, 25, 'banc_public'),
    (2, 50, 'fontaine_simple'),
    (3, 100, 'buste'),
    (4, 250, 'obelisque'),
    (5, 500, 'arc_triomphe_miniature'),
    (6, 1000, 'horloge_municipale'),
    (7, 2500, 'fontaine_monumentale'),
    (8, 5000, 'statue_equestre'),
    (9, 10000, 'mur_remerciements'),
    (10, 25000, 'arche_monumentale'),
    (11, 50000, 'tour_observatoire'),
    (12, 100000, 'statue_emblematique'),
    (13, 250000, 'temple_national'),
    (14, 500000, 'statue_geante'),
    (15, 1000000, 'monument_ultime')
  ) as t(palier, seuil, type);
$$;

-- ---------------------------------------------------------------------
-- monuments : un palier, un monument, jamais retiré une fois débloqué
-- (même philosophie que city_blocks/megaprojets/technologies) — "jamais
-- retiré... même si l'influence courante rebaisse" (§19). Lecture
-- publique, jamais écrite depuis le client.
-- ---------------------------------------------------------------------
create table public.monuments (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.cities (id) on delete cascade,
  palier integer not null,
  debloque_le timestamptz not null default now(),
  unique (ville_id, palier)
);

create index monuments_ville_idx on public.monuments (ville_id);

alter table public.monuments enable row level security;

create policy "monuments_lecture_publique"
  on public.monuments for select
  using (true);

-- city_events.type : nouvelle valeur 'monument_debloque', pour le
-- bulletin municipal (même principe que 'megaprojet_construit' et
-- 'technologie_debloquee').
alter table public.city_events drop constraint if exists city_events_type_check;
alter table public.city_events
  add constraint city_events_type_check
  check (type in (
    'manifestation', 'attaque_recue', 'megaprojet_construit',
    'technologie_debloquee', 'monument_debloque'
  ));

-- ---------------------------------------------------------------------
-- avancer_monuments() : débloque les paliers déjà atteints (catalogue
-- fini de 16, contrairement aux mégaprojets/technologies). Appelée de
-- façon opportuniste à chaque affichage d'une ville. Idempotente.
-- ---------------------------------------------------------------------
create or replace function public.avancer_monuments(p_ville_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_influence_max integer;
  v_catalogue record;
begin
  select influence_max into v_influence_max from public.cities where id = p_ville_id;
  if v_influence_max is null then
    return;
  end if;

  for v_catalogue in select * from public.monument_catalogue() order by palier loop
    if v_influence_max < v_catalogue.seuil then
      exit; -- paliers croissants : rien de plus à débloquer ensuite
    end if;
    if not exists (
      select 1 from public.monuments where ville_id = p_ville_id and palier = v_catalogue.palier
    ) then
      insert into public.monuments (ville_id, palier) values (p_ville_id, v_catalogue.palier);
      insert into public.city_events (ville_id, type, valeur, jour)
        values (p_ville_id, 'monument_debloque', v_catalogue.palier, (now() at time zone 'utc')::date);
    end if;
  end loop;
end;
$$;
