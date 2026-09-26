-- Jalon 13 ter — « Visite automatique »
-- docs/A-INTEGRER.md §16 (26/09/2026) : Adrien souhaite pouvoir visiter
-- sa propre ville, comme une vraie règle du jeu pour tout le monde —
-- pas seulement un outil de test. Combiné à §15 (visite automatique
-- sans bouton, voir l'application), une ville isolée sans aucun
-- visiteur extérieur peut désormais progresser (lentement — toujours
-- limitée au même délai d'une heure et plafond de 3/jour).
--
-- Deuxième déviation assumée du cahier des charges dans ce fichier
-- (après le délai/plafond du §13, Jalon 13 bis) : le §3 pose
-- l'attraction d'autres joueurs comme LE principe fondateur de la
-- croissance d'une ville. Adrien, auteur du cahier des charges, a été
-- informé de la contradiction et confirme vouloir cette évolution en
-- connaissance de cause — voir docs/DECISIONS.md §4, journal du
-- Jalon 13 ter.
--
-- Retire uniquement le contrôle qui bloquait l'auto-visite ; tout le
-- reste (délai d'une heure, plafond de 3/jour, maintien de
-- population_max) est inchangé par rapport à la version du Jalon 13
-- bis (migration 0019). Le code P0005 devient inutilisé — laissé dans
-- le registre des codes (migration 0006) plutôt que réutilisé pour
-- autre chose, pour ne pas fausser l'historique des migrations
-- passées qui le lèvent encore dans leurs commentaires.
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
