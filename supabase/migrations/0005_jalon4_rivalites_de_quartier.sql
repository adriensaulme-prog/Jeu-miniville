-- Jalon 4 — « Rivalités de quartier »
-- Cahier des charges §5 (actions AntiVille + protection progressive
-- contre le harcèlement). Paramètres d'équilibrage tranchés par Claude
-- Code sur délégation explicite d'Adrien (docs/DECISIONS.md §10,
-- "tranche selon tes reco" — détail complet et raisonnement dans
-- docs/DECISIONS.md §4, journal du Jalon 4). Provisoires, comme les
-- seuils d'évolution visuelle du Jalon 2 : à ajuster après recette.

-- ---------------------------------------------------------------------
-- greve_jusqua : une ville "en grève" ne peut pas recevoir d'influence
-- (influencer_ville, redéfinie plus bas) tant que cette date n'est pas
-- passée. Nullable = jamais en grève / grève expirée.
-- ---------------------------------------------------------------------
alter table public.cities add column greve_jusqua timestamptz;

-- ---------------------------------------------------------------------
-- actions_antiville : journal de toutes les actions AntiVille lancées,
-- quel que soit le résultat (sert à la fois au quota quotidien global
-- et au calcul de la protection anti-harcèlement par cible).
-- ---------------------------------------------------------------------
create table public.actions_antiville (
  id uuid primary key default gen_random_uuid(),
  attaquant_id uuid not null references public.users (id) on delete cascade,
  ville_id uuid not null references public.cities (id) on delete cascade,
  type_action text not null check (type_action in ('greve', 'contamination', 'propagande')),
  jour date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);

alter table public.actions_antiville enable row level security;

create policy "actions_antiville_lecture_propre"
  on public.actions_antiville for select
  using (auth.uid() = attaquant_id);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par lancer_action_antiville() ci-dessous.

-- ---------------------------------------------------------------------
-- influencer_ville (Jalon 3) redéfinie : une ville en grève ne peut
-- plus recevoir d'influence tant que greve_jusqua n'est pas passée.
-- L'action échoue avant de consommer le quota du joueur qui tentait
-- d'influencer (il peut réessayer sur une autre ville).
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
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'influencer_ville: utilisateur non autorisé';
  end if;

  select owner_id, greve_jusqua into v_owner_id, v_greve_jusqua
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'influencer_ville: ville introuvable';
  end if;
  if v_owner_id = p_joueur_id then
    raise exception 'influencer_ville: impossible d''influencer sa propre ville';
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

-- ---------------------------------------------------------------------
-- lancer_action_antiville : point d'entrée unique des trois actions.
--
-- Règles (voir docs/DECISIONS.md §4, Jalon 4, pour le raisonnement
-- complet) :
--  - Quota global : 3 actions AntiVille par attaquant et par jour
--    (tous types et toutes cibles confondus).
--  - Protection anti-harcèlement, par paire (attaquant, cible), sur une
--    fenêtre glissante de 24h, tous types d'action confondus :
--      0 action récente  -> effet plein (multiplicateur 1.0)
--      1 action récente  -> effet réduit de moitié (0.5)
--      2 actions ou plus -> action bloquée (protection déclenchée)
--  - Contamination : perte proportionnelle à la population
--    (10%, minimum 1 au plein effet), jamais sous population = 1
--    (pas de destruction permanente — cahier des charges §1 point 4).
--  - Propagande : -2 influence au plein effet, jamais sous 0.
--  - Grève : bloque la réception d'influence pendant 24h au plein
--    effet (12h à effet réduit) — voir influencer_ville() ci-dessus.
--
-- Simplification assumée : le cahier des charges évoque aussi une
-- protection liée à "la fréquence des attaques reçues" en général (tous
-- attaquants confondus), en plus de "du même attaquant". Ce jalon ne
-- couvre que la version par paire (attaquant, cible), qui correspond à
-- l'exemple de principe donné par le cahier des charges. La version
-- "toutes attaques confondues" est un raffinement possible pour plus
-- tard, pas oublié — noté en point ouvert.
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
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_aujourdhui integer;
  v_nb_recent integer;
  v_multiplicateur numeric;
  v_perte integer;
  v_ville public.cities;
begin
  if p_type_action not in ('greve', 'contamination', 'propagande') then
    raise exception 'lancer_action_antiville: type d''action invalide : %', p_type_action;
  end if;

  if auth.uid() is not null and auth.uid() <> p_attaquant_id then
    raise exception 'lancer_action_antiville: utilisateur non autorisé';
  end if;

  select owner_id, population into v_owner_id, v_population_avant
    from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'lancer_action_antiville: ville introuvable';
  end if;
  if v_owner_id = p_attaquant_id then
    raise exception 'lancer_action_antiville: impossible de s''attaquer soi-même';
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
