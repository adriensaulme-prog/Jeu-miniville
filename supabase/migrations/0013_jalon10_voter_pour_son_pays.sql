-- Jalon 10 — « Voter pour son pays »
-- Cahier des charges §2/§30 : "Vote hebdomadaire de ressource, résultat
-- proportionnel aux votes. Ressources nationales." Voir docs/ROADMAP.md
-- (Industrie / Techno / Culture / Commerce) et docs/DECISIONS.md §4
-- pour le raisonnement complet.
--
-- Portée assumée, décidée sans attendre Adrien (à contester si
-- besoin) : le cahier des charges ne précise pas ce que les ressources
-- nationales *font* une fois accumulées (bonus aux villes ? condition
-- pour les décisions diplomatiques des Jalons 12/13 ?). Ce jalon
-- construit le vote lui-même et l'accumulation des ressources —
-- brique testable et utile seule, affichée sur /pays — sans inventer
-- un effet de gameplay qui n'est décrit nulle part. Même logique que
-- le Jalon 6 (données d'abord, effet ensuite) ou l'"activité" du
-- Jalon 9 (calculée et affichée avant d'avoir un usage). Point ouvert
-- noté dans DECISIONS.md §10.

-- ---------------------------------------------------------------------
-- votes_pays : une ligne par (joueur, semaine) — un vote par joueur et
-- par semaine ISO (lundi à dimanche, UTC), quel que soit le pays (un
-- joueur ne vote que pour le sien, résolu côté serveur dans
-- voter_pays()). "Résultat proportionnel aux votes" : chaque vote
-- compte pour 1, la répartition entre catégories EST le résultat, pas
-- besoin d'une formule séparée à pondérer.
-- ---------------------------------------------------------------------
create table public.votes_pays (
  id uuid primary key default gen_random_uuid(),
  joueur_id uuid not null references public.users (id) on delete cascade,
  country_id text not null references public.countries (id),
  categorie text not null check (categorie in ('industrie', 'techno', 'culture', 'commerce')),
  semaine date not null,
  created_at timestamptz not null default now(),
  unique (joueur_id, semaine)
);

alter table public.votes_pays enable row level security;

create policy "votes_pays_lecture_propre"
  on public.votes_pays for select
  using (auth.uid() = joueur_id);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par voter_pays() ci-dessous (anti-triche, comme les autres
-- actions de jalons précédents).

-- ---------------------------------------------------------------------
-- voter_pays : point d'entrée unique. Le pays n'est jamais reçu du
-- client — résolu depuis users.country_id, comme "ma ville" dans
-- proposer_jumelage() (Jalon 5). "Semaine" = lundi de la semaine ISO
-- courante (UTC), via date_trunc('week', ...), même principe que "jour"
-- (UTC) pour les actions quotidiennes.
-- ---------------------------------------------------------------------
create or replace function public.voter_pays(
  p_joueur_id uuid,
  p_categorie text
)
returns public.votes_pays
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id text;
  v_semaine date := date_trunc('week', now() at time zone 'utc')::date;
  v_vote public.votes_pays;
begin
  if p_categorie not in ('industrie', 'techno', 'culture', 'commerce') then
    raise exception 'voter_pays: catégorie invalide : %', p_categorie
      using errcode = 'P0012';
  end if;

  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'voter_pays: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select country_id into v_country_id from public.users where id = p_joueur_id;
  if v_country_id is null then
    raise exception 'voter_pays: profil introuvable' using errcode = 'P0004';
  end if;

  -- Lève une erreur unique_violation (23505) si déjà voté cette semaine.
  insert into public.votes_pays (joueur_id, country_id, categorie, semaine)
  values (p_joueur_id, v_country_id, p_categorie, v_semaine)
  returning * into v_vote;

  return v_vote;
end;
$$;

-- ---------------------------------------------------------------------
-- resultats_vote_semaine : nombre de votes et pourcentage par
-- catégorie, pour une semaine donnée (nulle = semaine courante). Les 4
-- catégories sont toujours renvoyées, même à 0 vote, dans un ordre
-- stable — plus simple à afficher en barres qu'une liste qui varie
-- selon ce qui a été voté.
-- ---------------------------------------------------------------------
create or replace function public.resultats_vote_semaine(
  p_country_id text,
  p_semaine date default null
)
returns table (categorie text, nb_votes bigint, pourcentage numeric)
language sql
stable
security definer
set search_path = public
as $$
  with semaine_cible as (
    select coalesce(p_semaine, date_trunc('week', now() at time zone 'utc')::date) as s
  ),
  categories as (
    select unnest(array['industrie', 'techno', 'culture', 'commerce']) as categorie
  ),
  comptes as (
    select v.categorie, count(*)::bigint as n
    from public.votes_pays v, semaine_cible sc
    where v.country_id = p_country_id and v.semaine = sc.s
    group by v.categorie
  ),
  total as (
    select coalesce(sum(n), 0) as n from comptes
  )
  select
    c.categorie,
    coalesce(cm.n, 0) as nb_votes,
    case when t.n = 0 then 0 else round(coalesce(cm.n, 0) * 100.0 / t.n, 1) end as pourcentage
  from categories c
  left join comptes cm on cm.categorie = c.categorie
  cross join total t
  order by array_position(array['industrie', 'techno', 'culture', 'commerce'], c.categorie);
$$;

-- ---------------------------------------------------------------------
-- ressources_pays : stock cumulé par catégorie depuis le premier vote
-- (toutes les semaines confondues) — "ressources nationales" du cahier
-- des charges, additives comme population/influence ailleurs dans le
-- jeu (chaque vote = +1 dans sa catégorie, définitivement).
-- ---------------------------------------------------------------------
create or replace function public.ressources_pays(p_country_id text)
returns table (categorie text, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  with categories as (
    select unnest(array['industrie', 'techno', 'culture', 'commerce']) as categorie
  ),
  comptes as (
    select v.categorie, count(*)::bigint as n
    from public.votes_pays v
    where v.country_id = p_country_id
    group by v.categorie
  )
  select c.categorie, coalesce(cm.n, 0) as total
  from categories c
  left join comptes cm on cm.categorie = c.categorie
  order by array_position(array['industrie', 'techno', 'culture', 'commerce'], c.categorie);
$$;
