-- Refonte de l'onglet Pays (docs/A-INTEGRER.md §23, demande d'Adrien du
-- 02/10/2026) : statut de la semaine + historique hebdomadaire complet
-- (décision diplomatique, vote de ressource, résultat de conflit).
--
-- Choix de conception (Claude Code, §23 laissait le choix) : PAS de
-- table de synthèse hebdomadaire. Tout est déjà conservé avec sa
-- semaine — propositions_diplomatiques/resultats_diplomatiques (une
-- ligne par pays et par semaine), conflits, city_events (pertes de
-- population par conflit, Jalon 21), votes_pays — et le volume est
-- minuscule. Recalculer à la demande évite une deuxième source de
-- vérité qui pourrait diverger de la première. À revoir seulement si
-- l'historique devenait lent (des années de semaines).
--
-- SECURITY DEFINER pour la même raison que les autres agrégats
-- (jauges_ville, stock_ville, visites_recues_aujourdhui...) :
-- votes_pays n'est lisible que par son auteur (votes_pays_lecture_propre).

-- ---------------------------------------------------------------------
-- historique_pays : une ligne par semaine PASSÉE où il s'est passé
-- quelque chose pour ce pays, la plus récente d'abord.
--   - vote de ressource : catégorie la plus votée (égalité : ordre
--     industrie, techno, culture, commerce) et nombre de votes ;
--   - décision diplomatique proposée par CE pays cette semaine-là (une
--     fois résolue) : catégorie, pays cible, adoptée ou non, pour/contre ;
--   - conflit commencé cette semaine-là (semaine de son début) auquel ce
--     pays a pris part, comme attaquant ou défenseur, avec son résultat
--     et les pertes de population subies par chaque camp.
-- Une semaine sans vote, sans décision et sans conflit n'apparaît pas.
-- ---------------------------------------------------------------------
create or replace function public.historique_pays(
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
  pertes_adversaire bigint
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
  semaines as (
    select semaine from vote_gagnant
    union select semaine from decisions
    union select semaine from conflits_pays
  )
  select
    s.semaine,
    vg.categorie, vg.n,
    d.categorie, d.pays_cible_id, d.adoptee, d.nb_pour, d.nb_contre,
    k.id, k.role, k.adversaire, k.statut, k.resultat, k.pertes_pays, k.pertes_adversaire
  from semaines s
  left join vote_gagnant vg on vg.semaine = s.semaine
  left join decisions d on d.semaine = s.semaine
  left join conflits_pays k on k.semaine = s.semaine
  order by s.semaine desc, k.id
  limit greatest(1, p_nb_semaines);
$$;

-- ---------------------------------------------------------------------
-- statut_pays_semaine : statut diplomatique de la semaine en cours.
--   'guerre'  : un conflit en cours oppose ce pays à un autre (le
--               pays_lie est l'adversaire) ;
--   'allie'   : sinon, une alliance adoptée la semaine dernière (les
--               décisions sont résolues en fin de semaine) par ce pays
--               ou par un pays qui le vise ;
--   'paix'    : sinon (rien d'adopté, ou paix/embargo adoptés).
-- ---------------------------------------------------------------------
create or replace function public.statut_pays_semaine(p_country_id text)
returns table (statut text, pays_lie text)
language sql
stable
security definer
set search_path = public
as $$
  with courante as (
    select date_trunc('week', now() at time zone 'utc')::date as s
  ),
  guerre as (
    select case when k.pays_attaquant_id = p_country_id then k.pays_defenseur_id else k.pays_attaquant_id end as lie
    from public.conflits k
    where k.statut = 'en_cours' and (k.pays_attaquant_id = p_country_id or k.pays_defenseur_id = p_country_id)
    order by k.created_at desc
    limit 1
  ),
  alliance as (
    select case when p.country_id = p_country_id then p.pays_cible_id else p.country_id end as lie
    from public.resultats_diplomatiques r
    join public.propositions_diplomatiques p on p.id = r.proposition_id
    cross join courante c
    where r.adoptee and r.categorie = 'alliance'
      and p.semaine = c.s - 7
      and (p.country_id = p_country_id or p.pays_cible_id = p_country_id)
    order by r.resolved_at desc
    limit 1
  )
  select 'guerre'::text, (select lie from guerre) where exists (select 1 from guerre)
  union all
  select 'allie'::text, (select lie from alliance)
    where not exists (select 1 from guerre) and exists (select 1 from alliance)
  union all
  select 'paix'::text, null::text
    where not exists (select 1 from guerre) and not exists (select 1 from alliance);
$$;
