-- Jalon 19 — Système de développement des villes (3/4) : quartiers et
-- bâtiments 3D. docs/SYSTEME-DEVELOPPEMENT.md §7 : quand un nouveau
-- bloc s'ouvre, sa vocation est fixée une fois pour toutes (résidentiel,
-- industrie, commerce, loisirs, services ou recherche) selon l'activité
-- la plus en retard entre sa part de points et sa part de blocs — le
-- résidentiel garde toujours au moins la moitié des blocs. L'Énergie
-- n'a pas de bloc dans la ville : elle se construit dans la campagne
-- autour (voir le générateur 3D, pas cette migration).
--
-- Un bloc n'est identifié en base que par son RANG (0 = le plus
-- central, dans l'ordre d'ouverture), jamais par ses coordonnées
-- (bi, bj) : l'ordre des blocs est déjà déterministe côté générateur
-- 3D (planifierBlocs(), distance au centre + aléa stable par ville) —
-- dupliquer cette logique (avec son générateur pseudo-aléatoire) en
-- SQL serait fragile et inutile. Le client associe simplement "le
-- bloc de rang k dans son propre calcul" à "la vocation de rang k"
-- lue ici.
--
-- Registre des codes d'erreur : aucun nouveau code, cette migration
-- n'ajoute aucune fonction appelable directement par un joueur (tout
-- est interne, appelé opportunistement comme verifier_manifestation).

-- ---------------------------------------------------------------------
-- city_blocks : une ligne par bloc déjà ouvert. Lecture publique comme
-- cities (affichage 3D d'une ville visitée par n'importe qui) ; jamais
-- écrit depuis le client.
-- ---------------------------------------------------------------------
create table public.city_blocks (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.cities (id) on delete cascade,
  rang integer not null,
  vocation text not null check (vocation in
    ('residentiel', 'industrie', 'commerce', 'loisirs', 'services', 'recherche')),
  created_at timestamptz not null default now(),
  unique (ville_id, rang)
);

create index city_blocks_ville_idx on public.city_blocks (ville_id, rang);

alter table public.city_blocks enable row level security;

create policy "city_blocks_lecture_publique"
  on public.city_blocks for select
  using (true);

-- ---------------------------------------------------------------------
-- nb_blocs_ouverts() : copie SQL de planifierBlocs()/openAtK()
-- (src/lib/ville3d/constantes.ts et generer.ts) — le nombre de blocs
-- déjà ouverts à une population donnée. À tenir synchronisée si les
-- seuils changent côté 3D (16 seuils fixes, puis un bloc de plus tous
-- les 5 000 habitants, Jalon 7bis).
-- ---------------------------------------------------------------------
create or replace function public.nb_blocs_ouverts(p_population integer)
returns integer
language sql
immutable
as $$
  select case
    when p_population < 300 then 1
    when p_population < 800 then 2
    when p_population < 1500 then 3
    when p_population < 2500 then 4
    when p_population < 3800 then 5
    when p_population < 5500 then 6
    when p_population < 7500 then 7
    when p_population < 10000 then 8
    when p_population < 13000 then 9
    when p_population < 16500 then 10
    when p_population < 20500 then 11
    when p_population < 25000 then 12
    when p_population < 30000 then 13
    when p_population < 35000 then 14
    when p_population < 40000 then 15
    when p_population < 45000 then 16
    else 16 + floor((p_population - 40000)::numeric / 5000)::integer
  end;
$$;

-- ---------------------------------------------------------------------
-- assigner_vocations_blocs() : attribue une vocation à chaque bloc
-- ouvert qui n'en a pas encore, dans l'ordre des rangs (le calcul du
-- rang N dépend de l'état après les rangs 0..N-1). Idempotente : ne
-- retraite jamais un bloc déjà en base (§7 : "fixée une fois pour
-- toutes"). Appelée de façon opportuniste à chaque affichage d'une
-- ville, même logique que verifier_manifestation()/verifier_president().
-- ---------------------------------------------------------------------
create or replace function public.assigner_vocations_blocs(p_ville_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_population_max integer;
  v_nb_cible integer;
  v_rang integer;
  v_total_blocs integer;
  v_blocs_residentiel integer;
  v_jauges record;
  v_elan_total_5 numeric;
  v_elan record; -- ligne courante de jauges_ville pour une des 5 activités
  v_meilleure_activite text;
  v_meilleur_deficit numeric;
  v_part_points numeric;
  v_part_blocs numeric;
  v_deficit numeric;
  v_compte_activite integer;
  v_activites text[] := array['commerce', 'industrie', 'loisirs', 'recherche', 'services'];
  -- ordre alphabétique fixe : départage stable si deux activités sont
  -- exactement à égalité (ville toute neuve, aucun point nulle part).
  v_activite text;
  v_elan_par_activite jsonb;
begin
  select population_max into v_population_max from public.cities where id = p_ville_id;
  if v_population_max is null then
    return;
  end if;

  v_nb_cible := public.nb_blocs_ouverts(v_population_max);

  select coalesce(max(rang), -1) + 1 into v_rang from public.city_blocks where ville_id = p_ville_id;

  while v_rang < v_nb_cible loop
    select count(*) into v_total_blocs from public.city_blocks where ville_id = p_ville_id;
    select count(*) into v_blocs_residentiel
      from public.city_blocks where ville_id = p_ville_id and vocation = 'residentiel';

    if v_blocs_residentiel < ceil((v_total_blocs + 1) / 2.0) then
      insert into public.city_blocks (ville_id, rang, vocation) values (p_ville_id, v_rang, 'residentiel');
    else
      -- Élan (points pondérés, voir jauges_ville()) des 5 activités de
      -- quartier, pour mesurer laquelle est la plus en retard par
      -- rapport à sa part de blocs déjà construits.
      v_elan_par_activite := '{}'::jsonb;
      v_elan_total_5 := 0;
      for v_jauges in select * from public.jauges_ville(p_ville_id) loop
        if v_jauges.activite = any(v_activites) then
          v_elan_par_activite := v_elan_par_activite || jsonb_build_object(v_jauges.activite, v_jauges.elan);
          v_elan_total_5 := v_elan_total_5 + v_jauges.elan;
        end if;
      end loop;

      v_meilleure_activite := null;
      v_meilleur_deficit := null;
      foreach v_activite in array v_activites loop
        select count(*) into v_compte_activite
          from public.city_blocks where ville_id = p_ville_id and vocation = v_activite;

        v_part_points := case
          when v_elan_total_5 > 0 then (v_elan_par_activite ->> v_activite)::numeric / v_elan_total_5
          else 1.0 / array_length(v_activites, 1)
        end;
        v_part_blocs := case
          when (v_total_blocs - v_blocs_residentiel) > 0
            then v_compte_activite::numeric / (v_total_blocs - v_blocs_residentiel)
          else 0
        end;
        v_deficit := v_part_points - v_part_blocs;

        if v_meilleur_deficit is null or v_deficit > v_meilleur_deficit then
          v_meilleur_deficit := v_deficit;
          v_meilleure_activite := v_activite;
        end if;
      end loop;

      insert into public.city_blocks (ville_id, rang, vocation) values (p_ville_id, v_rang, v_meilleure_activite);
    end if;

    v_rang := v_rang + 1;
  end loop;
end;
$$;
