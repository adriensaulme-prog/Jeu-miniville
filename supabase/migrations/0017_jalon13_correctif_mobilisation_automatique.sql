-- Jalon 13 — correctif : mobilisation automatique, pas une action
-- cliquable.
--
-- Contexte : docs/A-INTEGRER.md §12 (25/09/2026). En répondant à ma
-- question sur la "mobilisation quotidienne" du cahier des charges,
-- Adrien a d'abord décrit une action que chaque citoyen clique une
-- fois par jour pendant un conflit — ce qui a donné la migration 0016
-- (table `mobilisations`, fonction `mobiliser()`, bouton "Mobiliser").
-- Adrien s'est ensuite rendu compte que ce n'était pas ce qu'il
-- voulait dire, et me l'a signalé avant que je committe le jalon :
-- l'"effort" quotidien d'un pays en guerre ne doit PAS être un
-- compteur de clics individuels, mais une valeur dérivée automatiquement
-- des attributs déjà existants (ou déjà prévus) du pays lui-même —
-- son activité quotidienne agrégée (Jalon 9, activite_7j_de) et ses
-- ressources nationales (Jalon 10, ressources_pays). Un citoyen
-- continue de jouer normalement ; il n'y a aucune nouvelle action à
-- accomplir pour "faire la guerre".
--
-- "Avantages nationaux" type Défense (cahier des charges §13) n'existe
-- pas encore comme système dans ce projet — pas construit ici, signalé
-- comme point ouvert (docs/DECISIONS.md §10) plutôt qu'inventé pour
-- combler le manque, comme demandé par la note.
--
-- Formule retenue pour "effort_national" (choix de Claude Code,
-- documenté, contestable — voir docs/DECISIONS.md §4, journal du
-- Jalon 13) :
--   somme(activite_7j_de) sur les villes du pays (activité "brute",
--   fraîche sur 7 jours, pas de plafond artificiel — un pays plus
--   grand ou plus actif produit naturellement plus d'effort)
--   + floor(sqrt(somme des ressources nationales, toutes catégories))
--   (les ressources sont un compteur cumulatif depuis le Jalon 10, en
--   croissance perpétuelle ; la racine carrée les fait compter comme
--   un bonus secondaire sans qu'elles écrasent complètement l'activité
--   pour un pays ancien).
--
-- Retire entièrement la mécanique "mobiliser" de la migration 0016,
-- déjà appliquée par Adrien : la clôturer proprement demande un DROP
-- explicite plutôt qu'un simple oubli dans le code applicatif.

drop function if exists public.mobiliser(uuid);
drop table if exists public.mobilisations;

-- ---------------------------------------------------------------------
-- effort_national : la force de mobilisation d'un pays à l'instant T,
-- réutilisée par resoudre_conflits_en_cours() et conflit_pays().
-- ---------------------------------------------------------------------
create or replace function public.effort_national(p_country_id text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select sum(public.activite_7j_de(c.owner_id))
      from public.cities c
      where c.country_id = p_country_id
    ), 0)
    +
    coalesce((
      select floor(sqrt(sum(r.total)))::bigint
      from public.ressources_pays(p_country_id) r
    ), 0);
$$;

-- resoudre_conflits_en_cours (Jalon 13) redéfinie : effort_national()
-- de chaque camp à l'instant de la résolution, au lieu d'un comptage
-- de mobilisations individuelles. Bonus défensif de 50 % inchangé,
-- appliqué cette fois sur le score national du défenseur.
create or replace function public.resoudre_conflits_en_cours()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conflit record;
  v_effort_attaquant bigint;
  v_effort_defenseur bigint;
  v_resultat text;
begin
  for v_conflit in
    select * from public.conflits where statut = 'en_cours' and fin <= now()
  loop
    v_effort_attaquant := public.effort_national(v_conflit.pays_attaquant_id);
    v_effort_defenseur := public.effort_national(v_conflit.pays_defenseur_id);

    if v_effort_attaquant > floor(v_effort_defenseur * 1.5) then
      v_resultat := 'attaquant';
    elsif v_effort_attaquant < floor(v_effort_defenseur * 1.5) then
      v_resultat := 'defenseur';
    else
      v_resultat := 'egalite';
    end if;

    update public.conflits
      set statut = 'termine',
          resultat = v_resultat,
          effort_attaquant = v_effort_attaquant,
          effort_defenseur = v_effort_defenseur
      where id = v_conflit.id;
  end loop;
end;
$$;

-- conflit_pays (Jalon 13) redéfinie : effort à jour calculé via
-- effort_national() (tant que le conflit est en cours) plutôt que
-- compté depuis mobilisations.
create or replace function public.conflit_pays(p_country_id text)
returns table (
  id uuid,
  pays_attaquant_id text,
  pays_defenseur_id text,
  debut timestamptz,
  fin timestamptz,
  statut text,
  resultat text,
  effort_attaquant bigint,
  effort_defenseur bigint,
  cout_ressources jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.pays_attaquant_id, c.pays_defenseur_id, c.debut, c.fin, c.statut, c.resultat,
    coalesce(c.effort_attaquant, public.effort_national(c.pays_attaquant_id)) as effort_attaquant,
    coalesce(c.effort_defenseur, public.effort_national(c.pays_defenseur_id)) as effort_defenseur,
    c.cout_ressources
  from public.conflits c
  where c.pays_attaquant_id = p_country_id or c.pays_defenseur_id = p_country_id
  order by c.created_at desc
  limit 1;
$$;
