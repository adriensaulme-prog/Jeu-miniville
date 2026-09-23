-- Correctif Jalon 4 — collision de codes d'erreur.
--
-- Bug trouvé en vérifiant lancer_action_antiville() contre le projet
-- réel (voir docs/DECISIONS.md §4, Jalon 4) : un RAISE EXCEPTION sans
-- "using errcode" prend par défaut le code P0001 en PL/pgSQL — exactement
-- le code choisi à la main pour "quota atteint". Résultat : une ville
-- introuvable, une auto-attaque ou un type d'action invalide étaient
-- tous rapportés côté client comme "quota atteint" au lieu d'une vraie
-- erreur inattendue, puisque src/app/villes/actions.ts ne distingue que
-- sur error.code.
--
-- Registre des codes utilisés dans ce fichier (tenir à jour si un
-- nouveau cas est ajouté) :
--   P0001  quota quotidien atteint (influence : 5/jour: AntiVille : 3/jour)
--   P0002  ville en grève (influencer_ville)
--   P0003  protection anti-harcèlement active (lancer_action_antiville)
--   P0004  ville introuvable
--   P0005  cible = soi-même (auto-visite / auto-influence / auto-attaque)
--   P0006  type d'action AntiVille invalide
--   P0007  utilisateur non autorisé (garde-fou defense-in-depth, ne
--          devrait jamais se déclencher tant que seule la clé
--          service_role appelle ces fonctions)

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
    raise exception 'visiter_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'visiter_ville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id = p_visiteur_id then
    raise exception 'visiter_ville: impossible de visiter sa propre ville' using errcode = 'P0005';
  end if;

  insert into public.visites (visiteur_id, ville_id) values (p_visiteur_id, p_ville_id);

  update public.cities
    set population = population + 1,
        niveau = public.population_vers_niveau(population + 1)
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;

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
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_aujourdhui integer;
  v_nb_recent integer;
  v_multiplicateur numeric;
  v_perte integer;
  v_ville public.cities;
begin
  if p_type_action not in ('greve', 'contamination', 'propagande') then
    raise exception 'lancer_action_antiville: type d''action invalide : %', p_type_action
      using errcode = 'P0006';
  end if;

  if auth.uid() is not null and auth.uid() <> p_attaquant_id then
    raise exception 'lancer_action_antiville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id, population into v_owner_id, v_population_avant
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

  insert into public.actions_antiville (attaquant_id, ville_id, type_action)
  values (p_attaquant_id, p_ville_id, p_type_action);

  if p_type_action = 'contamination' then
    v_perte := floor(greatest(v_population_avant * 0.10, 1) * v_multiplicateur);
    update public.cities
      set population = greatest(population - v_perte, 1),
          niveau = public.population_vers_niveau(greatest(population - v_perte, 1))
      where id = p_ville_id
      returning * into v_ville;

  elsif p_type_action = 'propagande' then
    update public.cities
      set influence = greatest(influence - floor(2 * v_multiplicateur), 0)
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
