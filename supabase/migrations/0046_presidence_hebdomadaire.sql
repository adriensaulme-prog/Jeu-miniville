-- Présidence à la semaine (docs/A-INTEGRER.md §31, précision d'Adrien du
-- 02/10/2026) : « le président d'un pays est attribué chaque semaine, à heure
-- fixe » ; un historique jour par jour n'a aucun sens. Jusqu'ici
-- verifier_president() (Jalon 11) était réconciliée EN DIRECT à chaque
-- affichage de page : la présidence pouvait changer plusieurs fois par jour dès
-- qu'une ville en dépassait une autre.
--
-- Bascule retenue par Adrien (02/10/2026) : la même que le vote de ressource et la
-- décision diplomatique, c'est-à-dire la semaine ISO (lundi 00 h UTC). La note du
-- §31 parlait de « dimanche 20 h » mais aucun mécanisme du code ne bascule à cette
-- heure ; Adrien a choisi de garder l'instant existant plutôt que de décaler les
-- trois mécaniques.
--
-- Principe :
--   * public.presidents_semaine : une ligne par pays et par semaine = LA ville
--     présidente de cette semaine, figée dès qu'elle est enregistrée.
--   * verifier_president() n'enregistre une présidente que s'il n'y en a pas encore
--     pour la semaine en cours : la première lecture de la semaine désigne la ville
--     n°1 du pays À CET INSTANT, puis plus rien ne bouge jusqu'au lundi suivant. Ce
--     n'est pas un instantané exact du lundi 00 h (l'ancien classement n'a jamais
--     été archivé) : si personne ne consulte le jeu avant le mercredi, c'est le n°1
--     du mercredi qui est désigné, daté du lundi.
--   * public.presidents (les mandats, Jalon 11) suit la présidente de la semaine :
--     un mandat commence et se termine le lundi 00 h UTC.
--   * Si la ville présidente est supprimée en cours de semaine, une nouvelle est
--     désignée à la prochaine lecture (le pays ne reste pas sans président).
--   * Le badge « Président » en direct (rang n°1, Jalon 7) n'est pas touché : il
--     indique qui serait président à l'instant, la présidence officielle est celle
--     de la semaine.
--   * historique_pays() gagne le président de chaque semaine passée (une entrée par
--     semaine, jamais par jour).
-- Transition : les présidents actuels sont reconduits pour la semaine en cours (aucun
-- changement brutal le jour de la migration). Aucun nouveau code d'erreur.

create table public.presidents_semaine (
  country_id text not null references public.countries (id),
  semaine date not null,
  ville_id uuid not null references public.cities (id) on delete cascade,
  primary key (country_id, semaine)
);

alter table public.presidents_semaine enable row level security;

create policy "presidents_semaine_lecture_publique"
  on public.presidents_semaine for select
  using (true);

-- Aucune policy insert/update/delete : tout passe par verifier_president().

insert into public.presidents_semaine (country_id, semaine, ville_id)
  select p.country_id, date_trunc('week', now() at time zone 'utc')::date, p.ville_id
  from public.presidents p
  where p.fin is null
  on conflict do nothing;

create or replace function public.verifier_president(p_country_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_semaine date := date_trunc('week', now() at time zone 'utc')::date;
  v_debut_semaine timestamptz := date_trunc('week', now() at time zone 'utc') at time zone 'utc';
  v_officielle uuid;
  v_ville_actuelle uuid;
  v_mandat_ouvert record;
begin
  select ville_id into v_officielle
    from public.presidents_semaine
    where country_id = p_country_id and semaine = v_semaine;

  if v_officielle is null then
    -- Première lecture de la semaine : la ville n°1 du pays désigne la présidente.
    -- Égalité de population : la plus ancienne reste en tête (pas d'oscillation).
    select id into v_ville_actuelle
      from public.cities
      where country_id = p_country_id
      order by population desc, created_at asc
      limit 1;

    if v_ville_actuelle is null then
      return; -- aucune ville dans ce pays pour l'instant
    end if;

    insert into public.presidents_semaine (country_id, semaine, ville_id)
      values (p_country_id, v_semaine, v_ville_actuelle)
      on conflict do nothing;

    select ville_id into v_officielle
      from public.presidents_semaine
      where country_id = p_country_id and semaine = v_semaine;
  end if;

  select * into v_mandat_ouvert
    from public.presidents
    where country_id = p_country_id and fin is null;

  if v_mandat_ouvert is null then
    insert into public.presidents (country_id, ville_id, debut)
      values (p_country_id, v_officielle, v_debut_semaine)
      on conflict do nothing;
    return;
  end if;

  if v_mandat_ouvert.ville_id = v_officielle then
    return; -- la même présidente que la semaine dernière : le mandat continue
  end if;

  update public.presidents set fin = greatest(v_debut_semaine, v_mandat_ouvert.debut) where id = v_mandat_ouvert.id;
  insert into public.presidents (country_id, ville_id, debut)
    values (p_country_id, v_officielle, greatest(v_debut_semaine, v_mandat_ouvert.debut))
    on conflict do nothing;
end;
$$;

drop function if exists public.historique_pays(text, integer);

create function public.historique_pays(
  p_country_id text,
  p_nb_semaines integer default 12
)
returns table (
  semaine date,
  vote_categorie text,
  vote_nb bigint,
  decision_categorie text,
  decision_cible text,
  decision_adoptee boolean,
  decision_pour bigint,
  decision_contre bigint,
  conflit_id uuid,
  conflit_role text,
  conflit_adversaire text,
  conflit_statut text,
  conflit_resultat text,
  pertes_pays bigint,
  pertes_adversaire bigint,
  president_ville_id uuid,
  president_ville_nom text
)
language sql
stable
security definer
set search_path = public
as $$
  with courante as (
    select date_trunc('week', now() at time zone 'utc')::date as s
  ),
  votes as (
    select v.semaine, v.categorie, count(*)::bigint as n
    from public.votes_pays v, courante c
    where v.country_id = p_country_id and v.semaine < c.s
    group by v.semaine, v.categorie
  ),
  vote_gagnant as (
    select distinct on (semaine) semaine, categorie, n
    from votes
    order by semaine, n desc,
      array_position(array['industrie', 'techno', 'culture', 'commerce'], categorie)
  ),
  decisions as (
    select p.semaine, r.categorie, r.pays_cible_id, r.adoptee, r.nb_pour, r.nb_contre
    from public.propositions_diplomatiques p
    join public.resultats_diplomatiques r on r.proposition_id = p.id
    cross join courante c
    where p.country_id = p_country_id and p.semaine < c.s
  ),
  conflits_pays as (
    select
      date_trunc('week', k.debut at time zone 'utc')::date as semaine,
      k.id, k.statut, k.resultat,
      case when k.pays_attaquant_id = p_country_id then 'attaquant' else 'defenseur' end as role,
      case when k.pays_attaquant_id = p_country_id then k.pays_defenseur_id else k.pays_attaquant_id end as adversaire,
      coalesce((
        select sum(e.valeur)::bigint
        from public.city_events e join public.cities ci on ci.id = e.ville_id
        where e.conflit_id = k.id and ci.country_id = p_country_id
      ), 0) as pertes_pays,
      coalesce((
        select sum(e.valeur)::bigint
        from public.city_events e join public.cities ci on ci.id = e.ville_id
        where e.conflit_id = k.id and ci.country_id <> p_country_id
      ), 0) as pertes_adversaire
    from public.conflits k, courante c
    where (k.pays_attaquant_id = p_country_id or k.pays_defenseur_id = p_country_id)
      and date_trunc('week', k.debut at time zone 'utc')::date < c.s
  ),
  presidence as (
    select ps.semaine, ps.ville_id, ci.nom
    from public.presidents_semaine ps
    join public.cities ci on ci.id = ps.ville_id
    cross join courante c
    where ps.country_id = p_country_id and ps.semaine < c.s
  ),
  semaines as (
    select semaine from vote_gagnant
    union select semaine from decisions
    union select semaine from conflits_pays
    union select semaine from presidence
  )
  select
    s.semaine,
    vg.categorie, vg.n,
    d.categorie, d.pays_cible_id, d.adoptee, d.nb_pour, d.nb_contre,
    k.id, k.role, k.adversaire, k.statut, k.resultat, k.pertes_pays, k.pertes_adversaire,
    pr.ville_id, pr.nom
  from semaines s
  left join presidence pr on pr.semaine = s.semaine
  left join vote_gagnant vg on vg.semaine = s.semaine
  left join decisions d on d.semaine = s.semaine
  left join conflits_pays k on k.semaine = s.semaine
  order by s.semaine desc, k.id
  limit greatest(1, p_nb_semaines);
$$;
