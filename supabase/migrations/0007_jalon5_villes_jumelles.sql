-- Jalon 5 — « Villes jumelles »
-- Cahier des charges §6 (jumelages). Le nombre de jumelages actifs
-- était un point ouvert explicite (docs/DECISIONS.md §10 point 3,
-- "délégation possible si souhaité") ; tranché ici par Claude Code dans
-- le même esprit que le Jalon 4 — raisonnement complet dans
-- docs/DECISIONS.md §4, journal du Jalon 5.

-- ---------------------------------------------------------------------
-- jumelages : une ligne par relation proposée entre deux villes.
-- ville_min_id/ville_max_id (colonnes générées) servent uniquement à
-- l'index unique ci-dessous — peu importe qui a proposé, on ne veut
-- jamais deux relations "en_attente"/"actif" en même temps entre la
-- même paire de villes, dans un sens ou dans l'autre.
-- ---------------------------------------------------------------------
create table public.jumelages (
  id uuid primary key default gen_random_uuid(),
  ville_proposante_id uuid not null references public.cities (id) on delete cascade,
  ville_ciblee_id uuid not null references public.cities (id) on delete cascade,
  ville_min_id uuid generated always as (least(ville_proposante_id, ville_ciblee_id)) stored,
  ville_max_id uuid generated always as (greatest(ville_proposante_id, ville_ciblee_id)) stored,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'actif', 'refuse', 'annule')),
  created_at timestamptz not null default now(),
  accepte_le timestamptz,
  check (ville_proposante_id <> ville_ciblee_id)
);

create unique index jumelages_paire_active_unique
  on public.jumelages (ville_min_id, ville_max_id)
  where statut in ('en_attente', 'actif');

alter table public.jumelages enable row level security;

create policy "jumelages_lecture_des_deux_parties"
  on public.jumelages for select
  using (
    exists (
      select 1 from public.cities c
      where c.id in (ville_proposante_id, ville_ciblee_id)
        and c.owner_id = auth.uid()
    )
  );

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par proposer_jumelage() / repondre_jumelage() / annuler_jumelage()
-- ci-dessous.

-- ---------------------------------------------------------------------
-- jumelage_bonus : garde-fou anti-triche pour "un jumelage actif peut
-- donner un petit bonus quotidien" — une ligne = un bonus déjà accordé
-- pour ce jumelage ce jour-là, jamais deux fois. Table purement interne
-- (RLS activée sans aucune policy : ni le client anon/authenticated ni
-- une lecture directe n'y ont accès, seule la clé service_role via
-- reclamer_bonus_jumelages() la touche).
-- ---------------------------------------------------------------------
create table public.jumelage_bonus (
  id uuid primary key default gen_random_uuid(),
  jumelage_id uuid not null references public.jumelages (id) on delete cascade,
  jour date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (jumelage_id, jour)
);

alter table public.jumelage_bonus enable row level security;

-- ---------------------------------------------------------------------
-- proposer_jumelage : le joueur propose un jumelage entre sa ville et
-- une autre. Quota : 3 jumelages actifs maximum par ville (cahier des
-- charges : "sans transformer le système en gestion complexe" — voir
-- DECISIONS.md §4 pour le raisonnement du nombre).
-- ---------------------------------------------------------------------
create or replace function public.proposer_jumelage(
  p_proposant_id uuid,
  p_ville_ciblee_id uuid
)
returns public.jumelages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma_ville_id uuid;
  v_ville_ciblee_existe boolean;
  v_nb_actifs integer;
  v_jumelage public.jumelages;
begin
  if auth.uid() is not null and auth.uid() <> p_proposant_id then
    raise exception 'proposer_jumelage: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select city_id into v_ma_ville_id from public.users where id = p_proposant_id;
  if v_ma_ville_id is null then
    raise exception 'proposer_jumelage: profil ou ville introuvable' using errcode = 'P0004';
  end if;

  if v_ma_ville_id = p_ville_ciblee_id then
    raise exception 'proposer_jumelage: impossible de se jumeler avec sa propre ville'
      using errcode = 'P0005';
  end if;

  select exists(select 1 from public.cities where id = p_ville_ciblee_id)
    into v_ville_ciblee_existe;
  if not v_ville_ciblee_existe then
    raise exception 'proposer_jumelage: ville cible introuvable' using errcode = 'P0004';
  end if;

  select count(*) into v_nb_actifs
    from public.jumelages
    where statut = 'actif'
      and (ville_proposante_id = v_ma_ville_id or ville_ciblee_id = v_ma_ville_id);
  if v_nb_actifs >= 3 then
    raise exception 'proposer_jumelage: quota de jumelages actifs atteint (3)'
      using errcode = 'P0008';
  end if;

  -- Lève une erreur unique_violation (23505) si une relation
  -- en_attente/actif existe déjà avec cette ville, dans un sens ou
  -- l'autre (index jumelages_paire_active_unique).
  insert into public.jumelages (ville_proposante_id, ville_ciblee_id)
  values (v_ma_ville_id, p_ville_ciblee_id)
  returning * into v_jumelage;

  return v_jumelage;
end;
$$;

-- ---------------------------------------------------------------------
-- repondre_jumelage : seule la ville ciblée peut accepter ou refuser
-- une proposition en attente. Le quota de 3 est revérifié pour la
-- ville qui accepte (sa situation a pu changer depuis la proposition).
-- ---------------------------------------------------------------------
create or replace function public.repondre_jumelage(
  p_joueur_id uuid,
  p_jumelage_id uuid,
  p_accepter boolean
)
returns public.jumelages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma_ville_id uuid;
  v_jumelage public.jumelages;
  v_nb_actifs integer;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'repondre_jumelage: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select city_id into v_ma_ville_id from public.users where id = p_joueur_id;

  select * into v_jumelage from public.jumelages where id = p_jumelage_id;
  if v_jumelage is null or v_jumelage.ville_ciblee_id <> v_ma_ville_id then
    raise exception 'repondre_jumelage: jumelage introuvable pour ce joueur' using errcode = 'P0009';
  end if;
  if v_jumelage.statut <> 'en_attente' then
    raise exception 'repondre_jumelage: ce jumelage n''est plus en attente' using errcode = 'P0010';
  end if;

  if p_accepter then
    select count(*) into v_nb_actifs
      from public.jumelages
      where statut = 'actif'
        and (ville_proposante_id = v_ma_ville_id or ville_ciblee_id = v_ma_ville_id);
    if v_nb_actifs >= 3 then
      raise exception 'repondre_jumelage: quota de jumelages actifs atteint (3)'
        using errcode = 'P0008';
    end if;

    update public.jumelages
      set statut = 'actif', accepte_le = now()
      where id = p_jumelage_id
      returning * into v_jumelage;
  else
    update public.jumelages
      set statut = 'refuse'
      where id = p_jumelage_id
      returning * into v_jumelage;
  end if;

  return v_jumelage;
end;
$$;

-- ---------------------------------------------------------------------
-- annuler_jumelage : l'une ou l'autre ville peut mettre fin à un
-- jumelage actif ou retirer une proposition en attente — cahier des
-- charges : "le joueur peut modifier ses jumelages et remplacer une
-- ville par une autre" (ça libère la place pour une nouvelle proposition
-- vers la même ville aussi, grâce à l'index partiel).
-- ---------------------------------------------------------------------
create or replace function public.annuler_jumelage(
  p_joueur_id uuid,
  p_jumelage_id uuid
)
returns public.jumelages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma_ville_id uuid;
  v_jumelage public.jumelages;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'annuler_jumelage: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select city_id into v_ma_ville_id from public.users where id = p_joueur_id;

  select * into v_jumelage from public.jumelages where id = p_jumelage_id;
  if v_jumelage is null
     or (v_jumelage.ville_proposante_id <> v_ma_ville_id
         and v_jumelage.ville_ciblee_id <> v_ma_ville_id) then
    raise exception 'annuler_jumelage: jumelage introuvable pour ce joueur' using errcode = 'P0009';
  end if;
  if v_jumelage.statut not in ('en_attente', 'actif') then
    raise exception 'annuler_jumelage: ce jumelage est déjà terminé' using errcode = 'P0010';
  end if;

  update public.jumelages
    set statut = 'annule'
    where id = p_jumelage_id
    returning * into v_jumelage;

  return v_jumelage;
end;
$$;

-- ---------------------------------------------------------------------
-- reclamer_bonus_jumelages : à appeler à chaque affichage de /ville ou
-- /jumelages. Pour chaque jumelage actif du joueur, accorde +1
-- population aux deux villes si les deux propriétaires ont été actifs
-- aujourd'hui (au moins une visite, une action d'influence ou une
-- action AntiVille lancée) et si le bonus du jour n'a pas déjà été
-- accordé pour ce jumelage. Idempotent : sans effet si rappelé plusieurs
-- fois le même jour.
--
-- Simplification assumée (voir DECISIONS.md §4, Jalon 5) : "actif"
-- est défini à partir des actions déjà journalisées par les jalons
-- précédents (visites, influence, AntiVille), pas d'une notion de
-- connexion/login séparée qui n'existe pas encore dans le jeu.
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

    update public.cities
      set population = population + 1,
          niveau = public.population_vers_niveau(population + 1)
      where id = v_ma_ville_id;
    update public.cities
      set population = population + 1,
          niveau = public.population_vers_niveau(population + 1)
      where id = v_autre_ville_id;
    v_nb_bonus_accordes := v_nb_bonus_accordes + 1;
  end loop;

  return jsonb_build_object('bonus_accordes', v_nb_bonus_accordes);
end;
$$;
