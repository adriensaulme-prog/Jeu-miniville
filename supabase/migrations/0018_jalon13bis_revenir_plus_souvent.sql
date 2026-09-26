-- Jalon 13 bis — « Revenir plus souvent »
-- Demande d'Adrien (docs/A-INTEGRER.md §13, 26/09/2026) : une même
-- personne doit pouvoir revisiter une ville plusieurs fois par jour,
-- avec un délai minimum d'une heure entre deux visites sur la même
-- ville, plutôt qu'une seule visite par (visiteur, ville) et par jour.
--
-- Déviation assumée du cahier des charges §3/§26 ("une même personne ne
-- peut contribuer qu'une seule fois par jour à une même ville") :
-- Adrien en a été informé et confirme vouloir cette évolution en
-- connaissance de cause (objectif de rétention, pas seulement de
-- croissance) — voir docs/DECISIONS.md §4 pour le raisonnement complet.
--
-- Plafond quotidien de 3 visites par (visiteur, ville) : nombre exact
-- laissé à Claude Code par Adrien ("chiffre à déterminer"), choisi pour
-- rester dans l'esprit "boucle courte" (docs/DECISIONS.md §1 point 3)
-- et ne pas laisser un seul visiteur acharné faire grandir une ville
-- bien plus vite qu'une ville qui recrute large.

-- La contrainte unique empêchait justement plusieurs visites le même
-- jour — nom par défaut de Postgres pour `unique (a, b, c)` sans nom
-- explicite dans le `create table` d'origine (migration 0003).
alter table public.visites
  drop constraint if exists visites_visiteur_id_ville_id_jour_key;

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
    raise exception 'visiter_ville: utilisateur non autorisé';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'visiter_ville: ville introuvable';
  end if;
  if v_owner_id = p_visiteur_id then
    raise exception 'visiter_ville: impossible de visiter sa propre ville';
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
        niveau = public.population_vers_niveau(population + 1)
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;
