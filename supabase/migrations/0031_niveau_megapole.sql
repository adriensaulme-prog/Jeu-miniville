-- Niveau "Mégapole" au-delà de Métropole (250 000 habitants) —
-- validé par Adrien le 26/09/2026 (docs/SYSTEME-DEVELOPPEMENT.md §10
-- point 4 : "Un stade au-delà de Métropole : oui, ajouté — Mégapole à
-- 250 000 habitants"), consigné comme point ouvert §20 dans
-- docs/DECISIONS.md §10 mais jamais réellement câblé pendant le
-- chantier des Jalons 17-20 — retrouvé et corrigé en faisant le point
-- une fois ce chantier terminé.
--
-- population_vers_niveau() : signature et type de retour inchangés
-- depuis la migration 0008, donc create or replace direct.
create or replace function public.population_vers_niveau(p_population integer)
returns integer
language sql
immutable
as $$
  select case
    when p_population >= 250000 then 6 -- Mégapole
    when p_population >= 100000 then 5 -- Métropole
    when p_population >= 40000  then 4 -- Grande ville
    when p_population >= 15000  then 3 -- Ville
    when p_population >= 5000   then 2 -- Bourg
    when p_population >= 1000   then 1 -- Village
    else 0                              -- Hameau
  end;
$$;

-- Rattrapage pour une ville déjà existante qui aurait dépassé 250 000
-- avant que ce niveau n'existe (peu probable à ce stade du projet,
-- mais cities.niveau est une colonne stockée, pas recalculée à la
-- volée — même geste que les migrations précédentes qui ajoutent un
-- seuil).
update public.cities
  set niveau = public.population_vers_niveau(population_max)
  where population_max >= 250000 and niveau <> public.population_vers_niveau(population_max);
