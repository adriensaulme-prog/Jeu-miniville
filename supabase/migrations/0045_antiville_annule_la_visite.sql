-- Une action AntiVille ne doit pas compter comme une visite (docs/A-INTEGRER.md
-- §34, demande d'Adrien du 02/10/2026) : « si je clique sur une action antiville,
-- je veux que la visite ne soit pas comptabilisée ». Depuis la visite
-- automatique (§15), ouvrir la page d'une ville pour l'attaquer compte une
-- visite — un geste de soutien — au bout de 2,5 s. Choix d'Adrien : suspendre
-- la visite automatique au premier geste vers AntiVille (côté navigateur) ET
-- annuler la visite déjà comptée si l'attaque a lieu dans la minute qui suit
-- (cette migration).
--
-- Pour annuler une visite il faut savoir ce qu'elle a rapporté :
--   * visites.gain : habitants gagnés par la visite (0 par défaut, y compris pour
--     les visites d'avant cette migration, qu'on annulera donc sans reprendre
--     d'habitants) ; visiter_ville() l'enregistre, choisir_activite_visite() y
--     ajoute le bonus de solidarité éventuel.
--   * lancer_action_antiville() supprime la visite de l'attaquant sur cette ville
--     si elle date de moins d'une minute, reprend son gain et renvoie
--     'visite_annulee' (true/false) pour que l'interface le dise au joueur.
-- Les trois fonctions sont recréées à l'identique (migrations 0039, 0027 et 0030
-- respectivement), aux quelques lignes marquées A-INTEGRER §34 près. Aucun
-- nouveau code d'erreur.

alter table public.visites
  add column gain integer not null default 0;

create or replace function public.visiter_ville(
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

  if v_nb_aujourdhui >= public.plafond_visites_quotidien() then
    raise exception 'visiter_ville: plafond quotidien de visites atteint (%)', public.plafond_visites_quotidien()
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

  -- A-INTEGRER §34 : on retient le gain réel de la visite, pour pouvoir l'annuler
  -- si le joueur attaque la ville dans la foulée.
  update public.visites set gain = v_gain where id = v_visite_id;

  return jsonb_build_object('ville', to_jsonb(v_ville), 'gain', v_gain, 'activite', v_activite);
end;
$$;

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

  select * into v_visite
    from public.visites
    where visiteur_id = p_visiteur_id and ville_id = p_ville_id
      and created_at >= now() - interval '5 minutes'
    order by created_at desc
    limit 1;

  if v_visite.id is null then
    raise exception 'choisir_activite_visite: aucune visite récente à modifier' using errcode = 'P0021';
  end if;

  if v_visite.activite_verrouillee then
    raise exception 'choisir_activite_visite: choix déjà verrouillé pour cette visite' using errcode = 'P0023';
  end if;

  update public.visites
    set activite = p_activite,
        activite_verrouillee = true
    where id = v_visite.id
    returning * into v_visite;

  if not v_visite.bonus_solidarite_applique then
    select type_action, created_at into v_dernier_type_action, v_derniere_attaque
      from public.actions_antiville
      where ville_id = p_ville_id and created_at >= now() - interval '24 hours'
      order by created_at desc limit 1;

    if v_derniere_attaque is not null and public.activite_protectrice(v_dernier_type_action) = p_activite then
      v_palier := public.palier_attaques(public.attaques_recues_aujourdhui(p_ville_id));
      v_bonus_solidarite := case when v_palier in ('emeutes', 'crise', 'sinistree') then 2 else 1 end;

      update public.visites set bonus_solidarite_applique = true, gain = gain + v_bonus_solidarite where id = v_visite.id;
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
  v_visite_annulee boolean := false;
  v_visite_id uuid;
  v_gain_visite integer;
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

  -- A-INTEGRER §34 (demande d'Adrien, 02/10/2026) : ouvrir la page d'une ville pour
  -- l'attaquer ne doit pas compter comme une visite (action de soutien). La visite
  -- automatique se déclenche au bout de quelques secondes ; si l'attaquant a visité
  -- cette ville dans la dernière minute, cette visite est annulée : ligne supprimée
  -- (donc quota du jour et délai d'une heure rendus, activité retirée des jauges) et
  -- gain d'habitants repris. population_max, un record qui ne décroît jamais, ne bouge pas.
  select v.id, v.gain into v_visite_id, v_gain_visite
    from public.visites v
    where v.visiteur_id = p_attaquant_id and v.ville_id = p_ville_id
      and v.created_at >= now() - interval '1 minute'
    order by v.created_at desc
    limit 1;
  if v_visite_id is not null then
    delete from public.visites where id = v_visite_id;
    update public.cities set population = greatest(population - coalesce(v_gain_visite, 0), 1)
      where id = p_ville_id;
    select population into v_population_avant from public.cities where id = p_ville_id;
    v_visite_annulee := true;
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
    'duree_heures', v_duree_heures,
    'visite_annulee', v_visite_annulee
  );
end;
$$;
