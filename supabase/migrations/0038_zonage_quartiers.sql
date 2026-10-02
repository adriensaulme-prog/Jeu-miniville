-- Zonage des quartiers (docs/A-INTEGRER.md §25, sous-jalon 25b) : les
-- blocs sont mélangés (commerce au rang 2, résidentiel au rang 40) parce
-- que la position d'un bloc (distance au centre) est fixée avant même
-- de connaître sa vocation. Adrien a choisi le zonage « par secteur » :
-- un cœur de 5 blocs toujours résidentiel (→ gratte-ciels), un secteur
-- d'angle propre à chaque activité (commerce, industrie, loisirs,
-- recherche, services), le résidentiel gardant le reste.
--
-- Le choix de la POSITION d'un bloc se fait côté générateur 3D
-- (planifierBlocs(), src/lib/ville3d/generer.ts), rejoué à l'identique
-- à chaque affichage à partir de la suite des vocations par rang : cette
-- migration ne change donc NI la règle de choix de la vocation (moitié
-- résidentielle, activité la plus en retard) NI les rangs. Elle ajoute
-- seulement un marqueur « ce bloc est né avec le zonage » : les blocs
-- existants (zonee = false, valeur par défaut) gardent leur place
-- actuelle (rang = emplacement), seuls les blocs ouverts à partir de
-- maintenant (zonee = true) suivent le zonage — « un bloc une fois
-- ouvert n'est jamais déplacé » (§25 point 3 et 4).
--
-- assigner_vocations_blocs() est recréée À L'IDENTIQUE de la migration
-- 0026, aux deux insert près (zonee = true). Aucun nouveau code d'erreur.

alter table public.city_blocks
  add column zonee boolean not null default false;

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
      insert into public.city_blocks (ville_id, rang, vocation, zonee) values (p_ville_id, v_rang, 'residentiel', true);
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

      insert into public.city_blocks (ville_id, rang, vocation, zonee) values (p_ville_id, v_rang, v_meilleure_activite, true);
    end if;

    v_rang := v_rang + 1;
  end loop;
end;
$$;
