-- Notification « une ville de ton pays est en crise » (docs/DECISIONS.md §10
-- point 35, décision d'Adrien du 02/10/2026 : notification seulement, pas de
-- fumée 3D). Le palier AntiVille « Crise » (500 attaques reçues dans la même
-- journée par une ville, tous attaquants confondus — Jalon 18) n'avait pas de
-- notification faute d'infrastructure ; le centre de notifications (0042)
-- existe maintenant.
--
-- notifications_joueur() est recréée à l'identique de la 0043 avec une branche
-- de plus (type ville_en_crise : toute ville du pays du joueur, la sienne
-- comprise, `valeur` = nombre d'attaques de la journée). Index ajouté sur
-- actions_antiville (ville_id, jour) : cette branche et attaques_recues_aujourdhui()
-- comptent par ville et par jour, sans index elles balayaient toute la table.
-- Aucun nouveau code d'erreur.

create index if not exists actions_antiville_ville_jour_idx
  on public.actions_antiville (ville_id, jour);

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

    union all
    -- Ma ville devient la n°1 du monde.
    select 'premier_acquis:' || m.id::text, 'premier_mondial_acquis', m.debut, m.ville_id, c.nom, c.country_id,
           null, prec.nom, null, null, null, null
    from public.premiers_mondiaux m
    join public.cities c on c.id = m.ville_id
    left join lateral (
      select c2.nom from public.premiers_mondiaux m2 join public.cities c2 on c2.id = m2.ville_id
      where m2.debut < m.debut and m2.ville_id <> m.ville_id order by m2.debut desc limit 1
    ) prec on true
    where m.ville_id = v_ville and m.debut >= v_depuis

    union all
    -- Ma ville perd la première place mondiale.
    select 'premier_perdu:' || m.id::text, 'premier_mondial_perdu', m.fin, m.ville_id, c.nom, c.country_id,
           null, suiv.nom, null, null, null, null
    from public.premiers_mondiaux m
    join public.cities c on c.id = m.ville_id
    left join lateral (
      select c2.nom from public.premiers_mondiaux m2 join public.cities c2 on c2.id = m2.ville_id
      where m2.debut >= m.fin and m2.ville_id <> m.ville_id order by m2.debut asc limit 1
    ) suiv on true
    where m.ville_id = v_ville and m.fin is not null and m.fin >= v_depuis

    union all
    -- Une ville de mon pays (la mienne comprise) atteint le palier « Crise »
    -- AntiVille : 500 attaques reçues dans la même journée. L'instant est celui
    -- de la 500ᵉ attaque.
    select 'crise:' || g.ville_id::text || ':' || g.jour::text, 'ville_en_crise',
           (select a2.created_at from public.actions_antiville a2
             where a2.ville_id = g.ville_id and a2.jour = g.jour
             order by a2.created_at offset 499 limit 1),
           g.ville_id, c.nom, c.country_id, null, null, g.nb::numeric, null, null, null
    from (
      select a.ville_id, a.jour, count(*) as nb
      from public.actions_antiville a
      join public.cities c1 on c1.id = a.ville_id
      where c1.country_id = v_pays and a.jour >= v_depuis::date
      group by a.ville_id, a.jour
      having count(*) >= 500
    ) g
    join public.cities c on c.id = g.ville_id
  ) n
  order by n.quand desc
  limit greatest(1, least(coalesce(p_limite, 50), 200));
end;
$$;
