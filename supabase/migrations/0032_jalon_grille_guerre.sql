-- « Revoir les règles du jeu » — application de la grille (effet
-- unitaire faible, cumul du jour, plafond, paliers visibles) au
-- mécanisme Pays (guerre/mobilisation). Voir docs/DECISIONS.md §10
-- point 22 pour l'origine de la demande (retour d'Adrien après le
-- Jalon 4 : « −10 % de population, c'est exagéré ») et §4 pour la
-- première application de cette grille à AntiVille (Jalon 18).
--
-- Constat fait en relisant 0016/0017 avant de coder ce jalon (validé
-- par Adrien via AskUserQuestion, 28/09/2026) : contrairement à
-- AntiVille, un conflit pays n'avait ENCORE AUCUN effet concret —
-- resoudre_conflits_en_cours() se contentait de poser un badge
-- attaquant/défenseur/égalité à J+7 sans jamais toucher population ni
-- influence. Ce n'est donc pas un effet existant à adoucir, mais une
-- conséquence à créer, directement selon la grille demandée.
--
-- Traduction de la grille sur un mécanisme sans action cliquable
-- individuelle (la mobilisation automatique du Jalon 13 correctif,
-- effort_national(), reste inchangée) : l'« unité » n'est plus une
-- attaque, mais une JOURNÉE du conflit. resoudre_conflits_en_cours()
-- devient un avancement jour par jour (comme les jobs opportunistes
-- avancer_megaprojets/avancer_technologies/avancer_monuments) plutôt
-- qu'un verdict unique à la toute fin :
--   - effet unitaire faible : chaque jour, le camp qui perd la
--     comparaison effort_national() (bonus défensif ×1,5 inchangé)
--     subit une perte de population FAIBLE (0,1 %) sur chacune de ses
--     villes — pas un effondrement, une piqûre quotidienne.
--   - cumul du jour : ces pertes s'additionnent jour après jour,
--     colonnes conflits.jours_gagnes_attaquant/jours_gagnes_defenseur
--     (nombre de journées gagnées par chaque camp).
--   - plafond : 5 % de perte de population MAXIMUM par ville sur toute
--     la durée du conflit (7 jours), suivi via city_events (nouvelle
--     colonne conflit_id pour ne pas confondre deux guerres
--     simultanées d'un même pays contre deux adversaires différents —
--     cas rare mais possible, rien dans le schéma ne l'interdit).
--   - paliers visibles : palierGuerre() côté TypeScript
--     (src/lib/game/conflits.ts), dérivé du nombre de journées gagnées
--     par le camp en tête — affichage seulement, comme palierAttaques()
--     pour AntiVille.
--
-- Le verdict final à J+7 devient réel : il compte désormais les
-- journées gagnées cumulées (majorité sur 7 jours), pas un seul
-- instantané du dernier jour — plus fidèle à l'esprit "cumul" de la
-- grille, et plus juste pour les deux pays.
--
-- Rattrapage des jours manqués : cette fonction est opportuniste (pas
-- de cron), appelée à chaque affichage de /pays. Si personne ne
-- consulte /pays plusieurs jours de suite, la boucle ci-dessous
-- rattrape tous les jours manqués d'un coup — mais effort_national()
-- ne reflète que l'état ACTUEL des pays (pas d'historique), donc les
-- jours rattrapés réutilisent le même instantané. Simplification
-- assumée et documentée, dans la même famille que l'activité 7 jours
-- glissants (Jalon 9) : approximation raisonnable, pas une fausse
-- précision historique.

-- ---------------------------------------------------------------------
-- conflits : compteurs de journées gagnées (source du verdict final et
-- des paliers visibles) + curseur d'avancement quotidien.
-- ---------------------------------------------------------------------
alter table public.conflits
  add column jours_gagnes_attaquant integer not null default 0,
  add column jours_gagnes_defenseur integer not null default 0,
  add column dernier_jour_traite date;

-- ---------------------------------------------------------------------
-- city_events : nouveau type 'guerre' (perte de population quotidienne
-- infligée par un conflit pays), avec sa propre colonne conflit_id
-- pour scoper le plafond de 5 % à CE conflit précis (voir en-tête).
-- ---------------------------------------------------------------------
alter table public.city_events drop constraint city_events_type_check;
alter table public.city_events
  add constraint city_events_type_check
  check (type in (
    'manifestation', 'attaque_recue', 'megaprojet_construit',
    'technologie_debloquee', 'monument_debloque', 'guerre'
  ));

alter table public.city_events
  add column conflit_id uuid references public.conflits (id) on delete cascade;

-- ---------------------------------------------------------------------
-- resoudre_conflits_en_cours() : refonte complète (signature et type de
-- retour void inchangés). Avance chaque conflit en_cours jour par jour
-- depuis son dernier_jour_traite (ou son début) jusqu'à aujourd'hui ou
-- sa fin, applique l'effet quotidien plafonné au camp perdant de
-- chaque jour, puis clôt le conflit si sa durée de 7 jours est atteinte
-- — le résultat final se base sur les journées gagnées cumulées, plus
-- sur un seul instantané du dernier jour.
-- ---------------------------------------------------------------------
create or replace function public.resoudre_conflits_en_cours()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conflit record;
  v_jour date;
  v_jour_limite date;
  v_effort_attaquant bigint;
  v_effort_defenseur bigint;
  v_jours_gagnes_attaquant integer;
  v_jours_gagnes_defenseur integer;
  v_pays_perdant_id text;
  v_ville record;
  v_perte integer;
  v_perte_existante numeric;
  v_plafond integer;
  v_resultat text;
begin
  for v_conflit in
    select * from public.conflits where statut = 'en_cours'
  loop
    v_jour_limite := least((now() at time zone 'utc')::date, (v_conflit.fin at time zone 'utc')::date);
    v_jour := coalesce(v_conflit.dernier_jour_traite, (v_conflit.debut at time zone 'utc')::date - 1) + 1;

    if v_jour > v_jour_limite then
      continue; -- déjà traité aujourd'hui pour ce conflit, rien de neuf
    end if;

    v_jours_gagnes_attaquant := v_conflit.jours_gagnes_attaquant;
    v_jours_gagnes_defenseur := v_conflit.jours_gagnes_defenseur;

    while v_jour <= v_jour_limite loop
      v_effort_attaquant := public.effort_national(v_conflit.pays_attaquant_id);
      v_effort_defenseur := public.effort_national(v_conflit.pays_defenseur_id);

      -- Bonus défensif de 50 % inchangé (docs/DECISIONS.md §4, Jalon 13) :
      -- le défenseur gagne la journée sauf si l'attaquant dépasse son
      -- effort de 50 %.
      if v_effort_attaquant > floor(v_effort_defenseur * 1.5) then
        v_jours_gagnes_attaquant := v_jours_gagnes_attaquant + 1;
        v_pays_perdant_id := v_conflit.pays_defenseur_id;
      elsif v_effort_attaquant < floor(v_effort_defenseur * 1.5) then
        v_jours_gagnes_defenseur := v_jours_gagnes_defenseur + 1;
        v_pays_perdant_id := v_conflit.pays_attaquant_id;
      else
        v_pays_perdant_id := null; -- égalité ce jour-là : personne ne perd de population
      end if;

      if v_pays_perdant_id is not null then
        for v_ville in
          select id, population from public.cities where country_id = v_pays_perdant_id
        loop
          v_perte := greatest(1, round(v_ville.population * 0.001)); -- effet unitaire faible : 0,1 %/jour
          select coalesce(sum(valeur), 0) into v_perte_existante
            from public.city_events
            where ville_id = v_ville.id and type = 'guerre' and conflit_id = v_conflit.id;
          v_plafond := greatest(1, ceil(v_ville.population * 0.05)); -- plafond : 5 % sur toute la durée du conflit
          v_perte := greatest(0, least(v_perte, v_plafond - v_perte_existante::integer));

          if v_perte > 0 then
            update public.cities set population = greatest(population - v_perte, 1) where id = v_ville.id;
            insert into public.city_events (ville_id, type, valeur, jour, conflit_id)
              values (v_ville.id, 'guerre', v_perte, v_jour, v_conflit.id);
          end if;
        end loop;
      end if;

      v_jour := v_jour + 1;
    end loop;

    if v_jour_limite >= (v_conflit.fin at time zone 'utc')::date then
      if v_jours_gagnes_attaquant > v_jours_gagnes_defenseur then
        v_resultat := 'attaquant';
      elsif v_jours_gagnes_attaquant < v_jours_gagnes_defenseur then
        v_resultat := 'defenseur';
      else
        v_resultat := 'egalite';
      end if;

      update public.conflits
        set statut = 'termine',
            resultat = v_resultat,
            effort_attaquant = v_effort_attaquant,
            effort_defenseur = v_effort_defenseur,
            jours_gagnes_attaquant = v_jours_gagnes_attaquant,
            jours_gagnes_defenseur = v_jours_gagnes_defenseur,
            dernier_jour_traite = v_jour_limite
        where id = v_conflit.id;
    else
      update public.conflits
        set effort_attaquant = v_effort_attaquant,
            effort_defenseur = v_effort_defenseur,
            jours_gagnes_attaquant = v_jours_gagnes_attaquant,
            jours_gagnes_defenseur = v_jours_gagnes_defenseur,
            dernier_jour_traite = v_jour_limite
        where id = v_conflit.id;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- conflit_pays() : ajoute jours_gagnes_attaquant/jours_gagnes_defenseur
-- (source du palier visible côté TypeScript). effort_attaquant/
-- effort_defenseur sont désormais toujours à jour par
-- resoudre_conflits_en_cours() (appelée juste avant sur /pays), plus
-- besoin du recalcul à la volée que faisait la version Jalon 13.
-- ---------------------------------------------------------------------
drop function if exists public.conflit_pays(text);

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
  jours_gagnes_attaquant integer,
  jours_gagnes_defenseur integer,
  cout_ressources jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id, c.pays_attaquant_id, c.pays_defenseur_id, c.debut, c.fin, c.statut, c.resultat,
    coalesce(c.effort_attaquant, 0), coalesce(c.effort_defenseur, 0),
    c.jours_gagnes_attaquant, c.jours_gagnes_defenseur,
    c.cout_ressources
  from public.conflits c
  where c.pays_attaquant_id = p_country_id or c.pays_defenseur_id = p_country_id
  order by c.created_at desc
  limit 1;
$$;
