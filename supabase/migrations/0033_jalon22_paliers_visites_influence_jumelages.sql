-- Jalon 22 — « Revoir les règles du jeu », suite : paliers visibles
-- pour visites, influence et jumelages (docs/DECISIONS.md §10 point 22
-- et §4). Grille déjà appliquée à AntiVille (Jalon 18) et à la guerre
-- entre pays (Jalon 21, migration 0032).
--
-- Différence assumée avec ces deux jalons précédents (relecture faite
-- avant de coder, tranchée avec Adrien via AskUserQuestion,
-- 28/09/2026) : visites et actions d'influence sont des effets
-- POSITIFS pour la ville qui les reçoit (population/influence gagnées),
-- déjà plafonnés PAR JOUEUR (3 visites/jour, 5 actions d'influence/jour,
-- délais anti-rafale), contrairement à AntiVille/guerre qui n'avaient
-- aucun plafond avant. Ajouter un plafond quotidien PAR VILLE CIBLÉE
-- (tous visiteurs confondus) freinerait la croissance d'une ville
-- populaire — pas dans l'esprit de la demande initiale ("−10 %,
-- c'est exagéré"). Décision d'Adrien : paliers visibles SEULEMENT,
-- aucun plafond ajouté sur visites/influence/jumelages.
--
-- Trois nouvelles fonctions de lecture agrégée, SECURITY DEFINER pour
-- la même raison que attaques_recues_aujourdhui() (Jalon 18) :
-- visites_lecture_propre et actions_influence_lecture_propre limitent
-- chacune la lecture directe à ses propres lignes (auth.uid() =
-- visiteur_id/joueur_id) — un maire ne peut pas voir les visites/
-- actions des AUTRES joueurs sur sa propre ville sans repasser par une
-- fonction qui agrège pour tout le monde. jumelage_bonus n'a même
-- aucune policy de lecture (table interne) : même raison.

-- ---------------------------------------------------------------------
-- visites_recues_aujourdhui : nombre total de visites reçues par une
-- ville aujourd'hui, tous visiteurs confondus — source du palier de
-- popularité (affichage seulement, voir palierVisites() côté TS).
-- ---------------------------------------------------------------------
create or replace function public.visites_recues_aujourdhui(p_ville_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.visites
  where ville_id = p_ville_id and jour = (now() at time zone 'utc')::date;
$$;

-- ---------------------------------------------------------------------
-- actions_influence_recues_aujourdhui : même principe pour les actions
-- d'influence reçues — source du palier de renommée.
-- ---------------------------------------------------------------------
create or replace function public.actions_influence_recues_aujourdhui(p_ville_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.actions_influence
  where ville_id = p_ville_id and jour = (now() at time zone 'utc')::date;
$$;

-- ---------------------------------------------------------------------
-- jours_bonus_jumelages_ville : pour chaque jumelage ACTIF d'une ville,
-- le nombre de jours où le bonus quotidien a déjà été accordé (cumul
-- depuis reclamer_bonus_jumelages(), Jalon 5) — source du palier de
-- solidité d'un jumelage (naissant → légendaire).
-- ---------------------------------------------------------------------
create or replace function public.jours_bonus_jumelages_ville(p_ville_id uuid)
returns table (jumelage_id uuid, jours integer)
language sql
stable
security definer
set search_path = public
as $$
  select j.id, count(jb.jour)::integer
  from public.jumelages j
  left join public.jumelage_bonus jb on jb.jumelage_id = j.id
  where j.statut = 'actif'
    and (j.ville_proposante_id = p_ville_id or j.ville_ciblee_id = p_ville_id)
  group by j.id;
$$;
