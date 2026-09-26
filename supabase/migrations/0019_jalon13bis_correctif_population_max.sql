-- Jalon 13 bis — correctif : population_max et codes d'erreur perdus
--
-- La migration 0018 a redéfini visiter_ville() en partant par erreur de
-- la version d'origine du Jalon 2 (migration 0003) au lieu de la
-- version réellement en place, redéfinie depuis par le Jalon 4
-- (migration 0006, codes d'erreur P0004/P0005/P0007) puis le Jalon 6
-- (migration 0008, maintien de population_max/niveau via
-- `greatest(population_max, population + 1)`). Conséquence détectée en
-- testant après application de la 0018 : la contrainte
-- `check (population_max >= population)` du Jalon 6 rejetait toute
-- visite ("cities_check" violée), puisque population_max n'était plus
-- mis à jour du tout. Redéfinie ici avec le corps complet de la version
-- du Jalon 6, plus le délai et le plafond du Jalon 13 bis.
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
  if v_owner_id = p_visiteur_id then
    raise exception 'visiter_ville: impossible de visiter sa propre ville' using errcode = 'P0005';
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
