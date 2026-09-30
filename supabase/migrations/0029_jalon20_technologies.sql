-- Jalon 20 (2/3) — Système de développement des villes (4/4), deuxième
-- sous-jalon : les technologies de Recherche
-- (docs/SYSTEME-DEVELOPPEMENT.md §6). "Tous les paliers de points de
-- Recherche cumulés (100, 300, 800, 2 000, 5 000, puis ×2), une
-- technologie se débloque. Elle est surtout visuelle." Contrairement
-- aux mégaprojets (Jalon 20 1/3), pas de choix du maire ni de
-- financement en plusieurs dimensions : une seule jauge (les points de
-- Recherche déjà accumulés, même fonction stock_ville() que les
-- mégaprojets) qui débloque automatiquement.
--
-- Catalogue des 5 premiers paliers (éclairage LED, panneaux solaires,
-- tramway, toits végétalisés, drones) choisi par Claude Code dans
-- l'ordre où le document les cite ; les paliers suivants (au-delà de
-- 5 000, ×2 à chaque fois) n'ont pas encore d'effet visuel défini —
-- point ouvert, comme les mégaprojets sans bonus câblé. Le nom de
-- chaque technologie ne vit que côté TypeScript
-- (src/lib/game/technologies.ts) : la table ne retient que le palier,
-- pas un type — palier 0 = LED, 1 = panneaux, etc., à tenir
-- synchronisé.
--
-- Registre des codes d'erreur : aucun nouveau (rien n'est appelable
-- directement par un joueur, tout est automatique comme
-- assigner_vocations_blocs()).
--
-- Correctif sur la migration 0028 (trouvé en préparant celle-ci) :
-- stock_ville() et etat_megaprojets() n'étaient pas "security definer".
-- Un visiteur authentifié appelant etat_megaprojets() directement (pour
-- afficher la progression d'un chantier) ne voyait, à travers la
-- policy RLS "visites_lecture_propre" (auth.uid() = visiteur_id) sur
-- `visites`, que SES PROPRES visites — les barres de matériaux/revenus/
-- points auraient donc été très sous-comptées pour toute ville avec
-- plusieurs visiteurs. jauges_ville() a déjà "security definer" pour
-- la même raison (Jalon 17) ; avancer_megaprojets() n'était pas touché
-- (déjà security definer, donc déjà correct pour la vraie construction),
-- seul l'AFFICHAGE de la progression était faux.
create or replace function public.stock_ville(p_ville_id uuid, p_activite text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from public.visites
    where ville_id = p_ville_id and activite = p_activite;
$$;

create or replace function public.etat_megaprojets(p_ville_id uuid)
returns table(
  palier integer,
  type text,
  activite text,
  statut text,
  points integer,
  cout_points integer,
  materiaux integer,
  cout_materiaux integer,
  revenus integer,
  cout_revenus integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.palier,
    m.type,
    o.activite,
    m.statut,
    (
      select count(*)::integer from public.visites v
      where v.ville_id = p_ville_id and v.activite = o.activite and v.created_at >= m.choisi_le
    ) as points,
    c.points as cout_points,
    public.stock_ville(p_ville_id, 'industrie') - ci.materiaux_depenses as materiaux,
    c.materiaux as cout_materiaux,
    public.stock_ville(p_ville_id, 'commerce') - ci.revenus_depenses as revenus,
    c.revenus as cout_revenus
  from public.megaprojets m
  join public.megaprojet_options(m.palier) o on o.type = m.type
  cross join lateral public.cout_megaprojet(m.palier) c
  join public.cities ci on ci.id = p_ville_id
  where m.ville_id = p_ville_id
  order by m.palier;
$$;

-- city_events.type : nouvelle valeur 'technologie_debloquee', pour le
-- bulletin municipal (même principe que 'megaprojet_construit', Jalon
-- 20 1/3) — sans elle, un joueur ne saurait pas qu'une technologie
-- vient de se débloquer (l'effet 3D seul ne suffit pas, cahier des
-- charges §31 : "on comprend l'action en moins d'une minute").
alter table public.city_events drop constraint if exists city_events_type_check;
alter table public.city_events
  add constraint city_events_type_check
  check (type in ('manifestation', 'attaque_recue', 'megaprojet_construit', 'technologie_debloquee'));

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.cities (id) on delete cascade,
  palier integer not null,
  debloquee_le timestamptz not null default now(),
  unique (ville_id, palier)
);

create index technologies_ville_idx on public.technologies (ville_id);

alter table public.technologies enable row level security;

create policy "technologies_lecture_publique"
  on public.technologies for select
  using (true);

-- ---------------------------------------------------------------------
-- seuil_technologie() : seuil de points de Recherche cumulés pour
-- débloquer le palier p (0 = premier). Même formule ×2 après le 5e
-- palier que cout_megaprojet() après la Mégapole (Jalon 20 1/3).
-- ---------------------------------------------------------------------
create or replace function public.seuil_technologie(p_palier integer)
returns integer
language sql
immutable
as $$
  select case
    when p_palier <= 0 then 100
    when p_palier = 1 then 300
    when p_palier = 2 then 800
    when p_palier = 3 then 2000
    when p_palier = 4 then 5000
    else round(5000 * power(2::numeric, p_palier - 4))::integer
  end;
$$;

-- ---------------------------------------------------------------------
-- avancer_technologies() : débloque les paliers déjà atteints.
-- Appelée de façon opportuniste à chaque affichage d'une ville, même
-- logique que assigner_vocations_blocs()/avancer_megaprojets().
-- Idempotente : ne retouche jamais un palier déjà débloqué. La boucle
-- termine toujours (seuil_technologie() est strictement croissant).
-- ---------------------------------------------------------------------
create or replace function public.avancer_technologies(p_ville_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
  v_palier integer;
begin
  select public.stock_ville(p_ville_id, 'recherche') into v_points;
  select coalesce(max(palier), -1) + 1 into v_palier
    from public.technologies where ville_id = p_ville_id;

  while v_points >= public.seuil_technologie(v_palier) loop
    insert into public.technologies (ville_id, palier) values (p_ville_id, v_palier);
    insert into public.city_events (ville_id, type, activite, valeur, jour)
      values (p_ville_id, 'technologie_debloquee', 'recherche', v_palier, (now() at time zone 'utc')::date);
    v_palier := v_palier + 1;
  end loop;
end;
$$;
