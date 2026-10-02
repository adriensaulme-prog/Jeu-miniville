-- Journal mondial et centre de notifications (docs/A-INTEGRER.md §26 A et
-- B, cahier des charges §22 et §23).
--
-- Constat en préparant ces deux chantiers : les faits qui les alimentent
-- sont DÉJÀ enregistrés de façon durable —
--   * public.presidents      : chaque mandat (debut / fin) de la ville n°1 d'un pays ;
--   * public.conflits        : chaque guerre (debut, fin, résultat) ;
--   * public.resultats_diplomatiques : chaque décision adoptée (alliances) ;
--   * public.city_events     : réussites et événements d'une ville (mégaprojet,
--                              technologie, monument, attaques reçues, manifestations).
-- Aucune table d'événements ne s'ajoute donc : le journal et les
-- notifications sont des LECTURES agrégées de ces tables (l'historique
-- existant est disponible d'emblée, aucun doublon à garder cohérent).
-- Seule nouveauté de stockage : users.notifications_vues_le, la date à
-- laquelle le joueur a consulté ses notifications pour la dernière fois
-- (ce qui est plus récent est « non lu »).
--
-- Limite connue (hors périmètre de cette migration) : un « passage au rang
-- n°1 mondial » ou une « perte de la première place » ne sont pas
-- enregistrés (seul le rang n°1 d'un PAYS l'est, via presidents) ; les
-- ajouter suppose de journaliser les changements de rang mondial.
--
-- Fonctions :
--   journal_monde(p_limite)                 : fil public du monde entier.
--   notifications_joueur(p_joueur_id, ...)  : ce qui concerne la ville et le
--                                             pays d'un joueur, avec « non lue ».
--   nb_notifications_non_lues(p_joueur_id)  : pastille de la barre du haut.
--   marquer_notifications_lues(p_joueur_id) : « tout est lu ».
-- Aucun nouveau code d'erreur (P0007 : joueur non autorisé, P0004 : profil introuvable).

alter table public.users
  add column notifications_vues_le timestamptz;

-- ---------------------------------------------------------------------
-- journal_monde : le fil public. Retient les faits qui comptent à l'échelle
-- du monde : changements de présidence (un mandat qui a un prédécesseur),
-- guerres déclarées et terminées, alliances adoptées, mégaprojets construits
-- et les grands monuments (palier 8 et au-delà, sur 16). Les technologies
-- de ville, attaques, manifestations restent à l'échelle de la ville.
-- ---------------------------------------------------------------------
create or replace function public.journal_monde(p_limite integer default 50)
returns table (
  id text,
  type text,
  quand timestamptz,
  ville_id uuid,
  ville_nom text,
  country_id text,
  cible_country_id text,
  autre_ville_nom text,
  valeur numeric,
  activite text,
  type_action text,
  resultat text
)
language sql
stable
security definer
set search_path = public
as $$
  select j.id, j.type, j.quand, j.ville_id, j.ville_nom, j.country_id, j.cible_country_id,
         j.autre_ville_nom, j.valeur, j.activite, j.type_action, j.resultat
  from (
    select 'president:' || p.id::text as id, 'president'::text as type, p.debut as quand,
           p.ville_id as ville_id, c.nom as ville_nom, p.country_id as country_id,
           null::text as cible_country_id, prec.nom as autre_ville_nom,
           null::numeric as valeur, null::text as activite, null::text as type_action, null::text as resultat
    from public.presidents p
    join public.cities c on c.id = p.ville_id
    join lateral (
      select c2.nom
      from public.presidents p2
      join public.cities c2 on c2.id = p2.ville_id
      where p2.country_id = p.country_id and p2.debut < p.debut
      order by p2.debut desc
      limit 1
    ) prec on true

    union all
    select 'guerre:' || k.id::text, 'guerre_declaree', k.debut, null, null, k.pays_attaquant_id,
           k.pays_defenseur_id, null, null, null, null, null
    from public.conflits k

    union all
    select 'guerre_fin:' || k.id::text, 'guerre_terminee', k.fin, null, null, k.pays_attaquant_id,
           k.pays_defenseur_id, null, null, null, null, k.resultat
    from public.conflits k
    where k.statut = 'termine'

    union all
    select 'alliance:' || r.id::text, 'alliance', r.resolved_at, null, null, r.country_id,
           r.pays_cible_id, null, null, null, null, null
    from public.resultats_diplomatiques r
    where r.adoptee and r.categorie = 'alliance'

    union all
    select 'ev:' || e.id::text, e.type, e.created_at, e.ville_id, c.nom, c.country_id,
           null, null, e.valeur, e.activite, e.type_action, null
    from public.city_events e
    join public.cities c on c.id = e.ville_id
    where e.type = 'megaprojet_construit' or (e.type = 'monument_debloque' and e.valeur >= 8)
  ) j
  order by j.quand desc
  limit greatest(1, least(coalesce(p_limite, 50), 200));
$$;

-- ---------------------------------------------------------------------
-- notifications_joueur : ce qui concerne le joueur — sa ville (tous ses
-- événements, attaques et manifestations comprises) et son pays (guerres,
-- alliances), plus les changements de présidence de sa ville. Seulement les
-- 30 derniers jours et rien d'antérieur à la création du compte. `non_lue`
-- vaut vrai pour ce qui est plus récent que la dernière consultation.
-- ---------------------------------------------------------------------
create or replace function public.notifications_joueur(p_joueur_id uuid, p_limite integer default 50)
returns table (
  id text,
  type text,
  quand timestamptz,
  ville_id uuid,
  ville_nom text,
  country_id text,
  cible_country_id text,
  autre_ville_nom text,
  valeur numeric,
  activite text,
  type_action text,
  resultat text,
  non_lue boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_ville uuid;
  v_pays text;
  v_vues timestamptz;
  v_creation timestamptz;
  v_depuis timestamptz;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'notifications_joueur: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select u.city_id, u.country_id, u.notifications_vues_le, u.created_at
    into v_ville, v_pays, v_vues, v_creation
    from public.users u where u.id = p_joueur_id;
  if v_creation is null then
    raise exception 'notifications_joueur: profil introuvable' using errcode = 'P0004';
  end if;

  v_depuis := greatest(v_creation, now() - interval '30 days');

  return query
  select n.id, n.type, n.quand, n.ville_id, n.ville_nom, n.country_id, n.cible_country_id,
         n.autre_ville_nom, n.valeur, n.activite, n.type_action, n.resultat,
         (n.quand > coalesce(v_vues, v_creation)) as non_lue
  from (
    -- Les événements de ma ville (hors manifestation sans perte).
    select 'ev:' || e.id::text as id, e.type as type, e.created_at as quand,
           e.ville_id as ville_id, c.nom as ville_nom, c.country_id as country_id,
           null::text as cible_country_id, null::text as autre_ville_nom,
           e.valeur as valeur, e.activite as activite, e.type_action as type_action, null::text as resultat
    from public.city_events e
    join public.cities c on c.id = e.ville_id
    where e.ville_id = v_ville
      and e.created_at >= v_depuis
      and not (e.type = 'manifestation' and coalesce(e.valeur, 0) <= 0)

    union all
    -- Ma ville devient présidente de son pays.
    select 'president_acquis:' || p.id::text, 'president_acquis', p.debut, p.ville_id, c.nom, p.country_id,
           null, prec.nom, null, null, null, null
    from public.presidents p
    join public.cities c on c.id = p.ville_id
    left join lateral (
      select c2.nom from public.presidents p2 join public.cities c2 on c2.id = p2.ville_id
      where p2.country_id = p.country_id and p2.debut < p.debut order by p2.debut desc limit 1
    ) prec on true
    where p.ville_id = v_ville and p.debut >= v_depuis

    union all
    -- Ma ville perd la présidence.
    select 'president_perdu:' || p.id::text, 'president_perdu', p.fin, p.ville_id, c.nom, p.country_id,
           null, suiv.nom, null, null, null, null
    from public.presidents p
    join public.cities c on c.id = p.ville_id
    left join lateral (
      select c2.nom from public.presidents p2 join public.cities c2 on c2.id = p2.ville_id
      where p2.country_id = p.country_id and p2.debut >= p.fin order by p2.debut asc limit 1
    ) suiv on true
    where p.ville_id = v_ville and p.fin is not null and p.fin >= v_depuis

    union all
    -- Guerres où mon pays est impliqué.
    select 'guerre:' || k.id::text, 'guerre_declaree', k.debut, null, null, k.pays_attaquant_id,
           k.pays_defenseur_id, null, null, null, null, null
    from public.conflits k
    where (k.pays_attaquant_id = v_pays or k.pays_defenseur_id = v_pays) and k.debut >= v_depuis

    union all
    select 'guerre_fin:' || k.id::text, 'guerre_terminee', k.fin, null, null, k.pays_attaquant_id,
           k.pays_defenseur_id, null, null, null, null, k.resultat
    from public.conflits k
    where k.statut = 'termine' and (k.pays_attaquant_id = v_pays or k.pays_defenseur_id = v_pays)
      and k.fin >= v_depuis

    union all
    -- Alliances adoptées qui concernent mon pays.
    select 'alliance:' || r.id::text, 'alliance', r.resolved_at, null, null, r.country_id,
           r.pays_cible_id, null, null, null, null, null
    from public.resultats_diplomatiques r
    where r.adoptee and r.categorie = 'alliance'
      and (r.country_id = v_pays or r.pays_cible_id = v_pays) and r.resolved_at >= v_depuis
  ) n
  order by n.quand desc
  limit greatest(1, least(coalesce(p_limite, 50), 200));
end;
$$;

create or replace function public.nb_notifications_non_lues(p_joueur_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_nb integer;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'nb_notifications_non_lues: utilisateur non autorisé' using errcode = 'P0007';
  end if;
  select count(*)::integer into v_nb
    from public.notifications_joueur(p_joueur_id, 100) n
    where n.non_lue;
  return v_nb;
end;
$$;

create or replace function public.marquer_notifications_lues(p_joueur_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'marquer_notifications_lues: utilisateur non autorisé' using errcode = 'P0007';
  end if;
  update public.users set notifications_vues_le = now() where id = p_joueur_id;
end;
$$;
