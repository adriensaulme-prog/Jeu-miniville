-- Découverte des petites villes neuves (docs/A-INTEGRER.md §26 E) :
-- /villes est trié par population décroissante, donc une ville neuve est
-- tout en bas de la liste, quasiment invisible, et ne reçoit jamais ses
-- premières visites. Le nouveau tri « Qui attendent des visites » classe
-- les villes par nombre de visites reçues ces 7 derniers jours (les
-- moins visitées d'abord) : il faut donc ce compteur pour toutes les
-- villes d'un coup.
--
-- visites_recues_7j_par_ville() : une ligne (ville_id, nb) par ville ayant
-- reçu au moins une visite sur la fenêtre « aujourd'hui et les 6 jours
-- précédents » (UTC, comme tous les compteurs `jour` du jeu). Une ville
-- absente du résultat n'a reçu aucune visite : c'est la plus prioritaire.
-- Ne révèle que des totaux agrégés (pas qui a visité), comme
-- visites_recues_aujourdhui() (migration 0033). security definer parce
-- que la lecture de `visites` est restreinte au visiteur par RLS.
--
-- Aucun nouveau code d'erreur.

create or replace function public.visites_recues_7j_par_ville()
returns table (ville_id uuid, nb integer)
language sql
stable
security definer
set search_path = public
as $$
  select v.ville_id, count(*)::integer
  from public.visites v
  where v.jour >= (now() at time zone 'utc')::date - 6
  group by v.ville_id;
$$;
