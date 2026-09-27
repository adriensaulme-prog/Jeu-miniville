-- Jalon 16 — « Croissance rapide en début de partie », puis annulé
-- Version initiale (26/09/2026, docs/A-INTEGRER.md §17) : gain par
-- visite dégressif selon le niveau de la ville. Adrien a demandé le
-- 27/09/2026 de revenir à un flat +1 par visite comme avant : la
-- sensation de croissance recherchée passera plutôt par le rendu 3D
-- (voir docs/DECISIONS.md §4, journal du 27/09/2026, "combien
-- d'habitants par habitation"). Cette migration REMPLACE donc le
-- contenu initial de 0022 par une pure restauration de la version du
-- Jalon 13 ter (migration 0021) — à rejouer dans l'éditeur SQL même si
-- la version dégressive avait déjà été appliquée : `create or replace`
-- écrase la fonction précédente sans distinction d'historique.
create or replace function public.visiter_ville(
  p_visiteur_id uuid,
  p_ville_id uuid
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_jour date := (now() at time zone 'utc')::date;
  v_derniere_visite timestamptz;
  v_nb_aujourdhui integer;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_visiteur_id then
    raise exception 'visiter_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'visiter_ville: ville introuvable' using errcode = 'P0004';
  end if;

  select max(created_at) into v_derniere_visite
    from public.visites
    where visiteur_id = p_visiteur_id and ville_id = p_ville_id;

  if v_derniere_visite is not null and v_derniere_visite > now() - interval '1 hour' then
    raise exception 'visiter_ville: délai minimum d''une heure non écoulé'
      using errcode = 'P0018';
  end if;

  select count(*) into v_nb_aujourdhui
    from public.visites
    where visiteur_id = p_visiteur_id and ville_id = p_ville_id and jour = v_jour;

  if v_nb_aujourdhui >= 3 then
    raise exception 'visiter_ville: plafond quotidien de visites atteint (3)'
      using errcode = 'P0019';
  end if;

  insert into public.visites (visiteur_id, ville_id) values (p_visiteur_id, p_ville_id);

  update public.cities
    set population = population + 1,
        population_max = greatest(population_max, population + 1),
        niveau = public.population_vers_niveau(greatest(population_max, population + 1))
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;
