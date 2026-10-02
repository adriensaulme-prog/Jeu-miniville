-- Rang n°1 MONDIAL journalisé (docs/A-INTEGRER.md §26 A/B, suite de la
-- migration 0042) : le journal du monde et les notifications ne savaient
-- pas dire « tu viens de perdre ta place n°1 » (cahier des charges §23),
-- parce que seul le n°1 d'un PAYS était enregistré (public.presidents).
-- Même mécanisme, à l'échelle du monde :
--   * public.premiers_mondiaux : un mandat par ligne (fin nulle = en cours),
--     au plus un mandat ouvert (index unique partiel), lecture publique ;
--   * verifier_premier_mondial() : réconciliation opportuniste et
--     idempotente, appelée à chaque affichage de « Ma ville » (comme
--     verifier_president, Jalon 11 — pas de tâche planifiée). Égalité de
--     population : la ville la plus ancienne reste en tête (pas
--     d'oscillation). Le premier appel ouvre un mandat sans passé : on ne
--     reconstitue pas l'histoire, qui n'a jamais été enregistrée.
-- journal_monde() et notifications_joueur() sont recréées à l'identique de
-- la 0042 avec une branche de plus (types premier_mondial,
-- premier_mondial_acquis, premier_mondial_perdu). Aucun nouveau code d'erreur.

create table public.premiers_mondiaux (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.cities (id) on delete cascade,
  debut timestamptz not null default now(),
  fin timestamptz
);

create unique index premiers_mondiaux_mandat_ouvert_unique
  on public.premiers_mondiaux ((true))
  where fin is null;

alter table public.premiers_mondiaux enable row level security;

create policy "premiers_mondiaux_lecture_publique"
  on public.premiers_mondiaux for select
  using (true);

-- Aucune policy insert/update/delete : tout passe par verifier_premier_mondial().

create or replace function public.verifier_premier_mondial()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ville_actuelle uuid;
  v_mandat_ouvert record;
begin
  select id into v_ville_actuelle
    from public.cities
    order by population desc, created_at asc
    limit 1;

  if v_ville_actuelle is null then
    return;
  end if;

  select * into v_mandat_ouvert from public.premiers_mondiaux where fin is null;

  if v_mandat_ouvert is null then
    insert into public.premiers_mondiaux (ville_id) values (v_ville_actuelle)
      on conflict do nothing;
    return;
  end if;

  if v_mandat_ouvert.ville_id = v_ville_actuelle then
    return;
  end if;

  update public.premiers_mondiaux set fin = now() where id = v_mandat_ouvert.id;
  insert into public.premiers_mondiaux (ville_id) values (v_ville_actuelle)
    on conflict do nothing;
end;
$$;

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

    union all
    -- Premier du monde : un mandat qui a un prédécesseur (une autre ville).
    select 'premier:' || m.id::text, 'premier_mondial', m.debut, m.ville_id, c.nom, c.country_id,
           null, prec.nom, null, null, null, null
    from public.premiers_mondiaux m
    join public.cities c on c.id = m.ville_id
    join lateral (
      select c2.nom
      from public.premiers_mondiaux m2
      join public.cities c2 on c2.id = m2.ville_id
      where m2.debut < m.debut and m2.ville_id <> m.ville_id
      order by m2.debut desc
      limit 1
    ) prec on true
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
  ) n
  order by n.quand desc
  limit greatest(1, least(coalesce(p_limite, 50), 200));
end;
$$;
