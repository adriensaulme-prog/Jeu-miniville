-- Jalon 14 — « Rester dans la légalité »
-- Cahier des charges §26 (anti-triche) : « détection des comportements
-- automatisés et répétitifs ». Décision d'Adrien (questions posées
-- avant de coder, comme pour le Jalon 13) : pas d'heuristique
-- comportementale complexe pour ce jalon — juste un délai minimum entre
-- deux actions du même type, pour bloquer un script qui enchaîne des
-- appels en rafale, sans jamais gêner un humain normal (2 secondes est
-- imperceptible entre deux clics sur des villes différentes).
--
-- Cible : influencer_ville() et lancer_action_antiville(), les deux
-- seules actions répétables plusieurs fois par jour sans délai actuel
-- (Visiter a déjà son propre délai d'une heure depuis le Jalon 13 bis ;
-- les actions hebdomadaires — vote, décision diplomatique — n'ont pas
-- ce risque, une seule par semaine).
--
-- Code d'erreur P0020 partagé entre les deux fonctions (même famille
-- de contrôle) — même principe que P0001, déjà réutilisé pour plusieurs
-- quotas distincts dans ce projet.

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

  update public.cities
    set influence = influence + 1
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
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
  v_population_max_avant integer;
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_aujourdhui integer;
  v_nb_recent integer;
  v_derniere_action timestamptz;
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

  select max(created_at) into v_derniere_action
    from public.actions_antiville
    where attaquant_id = p_attaquant_id;

  if v_derniere_action is not null and v_derniere_action > now() - interval '2 seconds' then
    raise exception 'lancer_action_antiville: actions trop rapprochées' using errcode = 'P0020';
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
