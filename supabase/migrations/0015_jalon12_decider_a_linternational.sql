-- Jalon 12 — « Décider à l'international »
-- Cahier des charges §2/§30 : "Décision diplomatique hebdomadaire
-- (alliance, paix, attaque/rivalité, embargo éventuel), agrégation des
-- votes citoyens, le président peut proposer sans décider seul." Voir
-- docs/DECISIONS.md §4 pour le raisonnement complet.
--
-- Portée, comme au Jalon 10 (vote des ressources) : ce jalon construit
-- la proposition et le vote de soutien, pas ce que la décision *fait*
-- une fois soutenue (aucune règle de jeu ne dépend encore d'une
-- alliance, d'un embargo, etc.) — laissé au Jalon 13 ("France contre
-- Allemagne"), premier scénario concret qui donnera un sens réel à ces
-- catégories. Décision de scinder ainsi prise sans attendre Adrien (à
-- contester si besoin), voir DECISIONS.md §10.
--
-- Un seul pays cible par semaine (tranché avec Adrien avant de coder) :
-- seule la présidente en exercice (table `presidents`, Jalon 11) peut
-- proposer, une fois par semaine ISO pour son pays. Les citoyens
-- votent leur soutien à cette proposition, pas de vote de rejet séparé
-- — l'absence de soutien suffit à mesurer le désaccord.

-- ---------------------------------------------------------------------
-- propositions_diplomatiques : une proposition par (pays, semaine ISO).
-- ---------------------------------------------------------------------
create table public.propositions_diplomatiques (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries (id),
  pays_cible_id text not null references public.countries (id),
  categorie text not null check (categorie in ('alliance', 'paix', 'rivalite', 'embargo')),
  semaine date not null,
  proposee_par_ville_id uuid not null references public.cities (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (country_id, semaine),
  check (country_id <> pays_cible_id)
);

alter table public.propositions_diplomatiques enable row level security;

create policy "propositions_diplomatiques_lecture_publique"
  on public.propositions_diplomatiques for select
  using (true);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par proposer_decision_diplomatique() ci-dessous.

-- ---------------------------------------------------------------------
-- votes_diplomatie : un soutien par (joueur, semaine ISO) — soutient
-- forcément la proposition en cours de son pays, il ne peut pas y en
-- avoir deux à la fois (unique (country_id, semaine) ci-dessus).
-- ---------------------------------------------------------------------
create table public.votes_diplomatie (
  id uuid primary key default gen_random_uuid(),
  joueur_id uuid not null references public.users (id) on delete cascade,
  country_id text not null references public.countries (id),
  semaine date not null,
  created_at timestamptz not null default now(),
  unique (joueur_id, semaine)
);

alter table public.votes_diplomatie enable row level security;

create policy "votes_diplomatie_lecture_propre"
  on public.votes_diplomatie for select
  using (auth.uid() = joueur_id);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par soutenir_decision_diplomatique() ci-dessous.

-- ---------------------------------------------------------------------
-- proposer_decision_diplomatique : seule la présidente en exercice
-- (mandat ouvert dans `presidents`, Jalon 11) peut proposer, une fois
-- par pays et par semaine ISO.
-- ---------------------------------------------------------------------
create or replace function public.proposer_decision_diplomatique(
  p_president_id uuid,
  p_pays_cible_id text,
  p_categorie text
)
returns public.propositions_diplomatiques
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id text;
  v_ma_ville_id uuid;
  v_est_presidente boolean;
  v_semaine date := date_trunc('week', now() at time zone 'utc')::date;
  v_proposition public.propositions_diplomatiques;
begin
  if p_categorie not in ('alliance', 'paix', 'rivalite', 'embargo') then
    raise exception 'proposer_decision_diplomatique: catégorie invalide : %', p_categorie
      using errcode = 'P0014';
  end if;

  if auth.uid() is not null and auth.uid() <> p_president_id then
    raise exception 'proposer_decision_diplomatique: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select country_id, city_id into v_country_id, v_ma_ville_id
    from public.users where id = p_president_id;
  if v_country_id is null then
    raise exception 'proposer_decision_diplomatique: profil introuvable' using errcode = 'P0004';
  end if;

  if v_country_id = p_pays_cible_id or not exists (select 1 from public.countries where id = p_pays_cible_id) then
    raise exception 'proposer_decision_diplomatique: pays cible invalide' using errcode = 'P0015';
  end if;

  select exists(
    select 1 from public.presidents
    where country_id = v_country_id and ville_id = v_ma_ville_id and fin is null
  ) into v_est_presidente;
  if not v_est_presidente then
    raise exception 'proposer_decision_diplomatique: seule la présidente en exercice peut proposer'
      using errcode = 'P0013';
  end if;

  -- Lève une erreur unique_violation (23505) si ce pays a déjà proposé
  -- cette semaine.
  insert into public.propositions_diplomatiques (country_id, pays_cible_id, categorie, semaine, proposee_par_ville_id)
  values (v_country_id, p_pays_cible_id, p_categorie, v_semaine, v_ma_ville_id)
  returning * into v_proposition;

  return v_proposition;
end;
$$;

-- ---------------------------------------------------------------------
-- soutenir_decision_diplomatique : soutient la proposition en cours de
-- son propre pays, une fois par semaine ISO.
-- ---------------------------------------------------------------------
create or replace function public.soutenir_decision_diplomatique(p_joueur_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id text;
  v_semaine date := date_trunc('week', now() at time zone 'utc')::date;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'soutenir_decision_diplomatique: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select country_id into v_country_id from public.users where id = p_joueur_id;
  if v_country_id is null then
    raise exception 'soutenir_decision_diplomatique: profil introuvable' using errcode = 'P0004';
  end if;

  if not exists (
    select 1 from public.propositions_diplomatiques
    where country_id = v_country_id and semaine = v_semaine
  ) then
    raise exception 'soutenir_decision_diplomatique: aucune proposition cette semaine pour ce pays'
      using errcode = 'P0016';
  end if;

  -- Lève une erreur unique_violation (23505) si déjà soutenu cette semaine.
  insert into public.votes_diplomatie (joueur_id, country_id, semaine) values (p_joueur_id, v_country_id, v_semaine);
end;
$$;

-- ---------------------------------------------------------------------
-- resultat_decision_semaine : la proposition de la semaine pour un
-- pays (nulle = semaine courante) et son nombre de soutiens. Ligne vide
-- si aucune proposition n'a été faite cette semaine-là.
-- ---------------------------------------------------------------------
create or replace function public.resultat_decision_semaine(
  p_country_id text,
  p_semaine date default null
)
returns table (
  proposition_id uuid,
  pays_cible_id text,
  categorie text,
  proposee_par_ville_id uuid,
  nb_soutiens bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with semaine_cible as (
    select coalesce(p_semaine, date_trunc('week', now() at time zone 'utc')::date) as s
  )
  select
    pd.id,
    pd.pays_cible_id,
    pd.categorie,
    pd.proposee_par_ville_id,
    (
      select count(*)::bigint from public.votes_diplomatie v, semaine_cible sc
      where v.country_id = pd.country_id and v.semaine = sc.s
    ) as nb_soutiens
  from public.propositions_diplomatiques pd, semaine_cible sc
  where pd.country_id = p_country_id and pd.semaine = sc.s;
$$;
