-- Plafond de visites quotidien : 3 -> 8 par jour et par ville visitée
-- (docs/A-INTEGRER.md §27 A, demande d'Adrien du 02/10/2026).
--
-- Le plafond était un littéral `3` recopié dans chaque redéfinition de
-- visiter_ville() (migrations 0003 à 0024, la dernière — 0024, celle du
-- Jalon 18 — étant la seule qui compte). Il vit désormais à UN seul
-- endroit : plafond_visites_quotidien(), et visiter_ville() est recréée
-- à l'identique de 0024 en l'appelant. Miroir côté TypeScript :
-- src/lib/game/visites.ts (QUOTA_VISITE_QUOTIDIEN), à tenir synchronisé
-- (test de parité tests/unit/visites.test.ts, qui lit cette migration).
--
-- Inchangé : le délai d'une heure entre deux visites de la même ville
-- par le même joueur (P0018). Avec 8 visites max et 1 h de délai, une
-- ville ne peut de toute façon pas recevoir plus de 8 visites du même
-- joueur en 24 h. Même code d'erreur P0019 ; aucun texte joueur ne
-- mentionne le chiffre (l'erreur est absorbée côté client).
--
-- Signature et type de retour de visiter_ville() inchangés (jsonb), donc
-- create or replace direct (pas de drop).

create or replace function public.plafond_visites_quotidien()
returns integer
language sql
immutable
as $$
  select 8;
$$;

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

  return jsonb_build_object('ville', to_jsonb(v_ville), 'gain', v_gain, 'activite', v_activite);
end;
$$;
