-- Guerres équilibrées entre pays : l'effort national passe de la SOMME à
-- la MOYENNE par ville (docs/A-INTEGRER.md §24, demande d'Adrien du
-- 02/10/2026). Avant : effort_national() additionnait l'activité 7 jours
-- de toutes les villes du pays (migration 0017, choix « assumé mais
-- contestable ») — un pays de 50 villes écrasait mécaniquement un pays
-- de 2 villes, même moins actif par ville. Désormais la taille du pays
-- ne donne plus aucun avantage mécanique : seule compte l'implication
-- moyenne des joueurs.
--
-- Formule (§24) :
--   activité moyenne = somme(activite_7j_de) / nombre de villes
--   + floor(sqrt(somme des ressources nationales / nombre de villes))
-- Pays sans aucune ville : effort 0.
--
-- Choix de Claude Code (le §24 ne le tranchait pas) : l'effort devient
-- une valeur DÉCIMALE (numeric, 2 décimales) au lieu d'un entier. Une
-- moyenne d'activité sur 7 jours vaut entre 0 et 7 ; l'arrondir à
-- l'entier effacerait presque toute la différence entre deux pays (2,4
-- et 2,9 donneraient tous deux 2). Conséquences : colonnes
-- conflits.effort_* en numeric(12,2), conflit_pays() recréée avec ces
-- types, et la comparaison quotidienne de resoudre_conflits_en_cours()
-- n'arrondit plus le seuil défensif (`floor(effort_defenseur * 1,5)`
-- servait uniquement à rester en entiers). Le bonus défensif de ×1,5,
-- la perte quotidienne de 0,1 % plafonnée à 5 %, les paliers visibles
-- et le verdict à la majorité des journées (Jalon 21) sont inchangés.
--
-- Option écartée par Adrien, gardée en mémoire : atténuer l'avantage de
-- taille sans l'annuler (diviser par la racine carrée du nombre de
-- villes plutôt que par le nombre de villes) si la moyenne pure
-- s'avérait trop punitive pour les grands pays.

alter table public.conflits
  alter column effort_attaquant type numeric(12, 2),
  alter column effort_defenseur type numeric(12, 2);

drop function if exists public.effort_national(text);

create or replace function public.effort_national(p_country_id text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with villes as (
    select count(*)::numeric as n from public.cities where country_id = p_country_id
  )
  select case
    when v.n = 0 then 0::numeric
    else round(
      coalesce((
        select sum(public.activite_7j_de(c.owner_id))
        from public.cities c
        where c.country_id = p_country_id
      ), 0) / v.n
      + floor(sqrt(coalesce((select sum(r.total) from public.ressources_pays(p_country_id) r), 0) / v.n)),
      2
    )
  end
  from villes v;
$$;

-- resoudre_conflits_en_cours : même logique qu'au Jalon 21 (migration
-- 0032), efforts décimaux et seuil défensif non arrondi.
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
  v_effort_attaquant numeric;
  v_effort_defenseur numeric;
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
      continue;
    end if;

    v_jours_gagnes_attaquant := v_conflit.jours_gagnes_attaquant;
    v_jours_gagnes_defenseur := v_conflit.jours_gagnes_defenseur;

    while v_jour <= v_jour_limite loop
      v_effort_attaquant := public.effort_national(v_conflit.pays_attaquant_id);
      v_effort_defenseur := public.effort_national(v_conflit.pays_defenseur_id);

      -- Bonus défensif de 50 % inchangé : le défenseur gagne la journée
      -- sauf si l'attaquant dépasse son effort de 50 %.
      if v_effort_attaquant > v_effort_defenseur * 1.5 then
        v_jours_gagnes_attaquant := v_jours_gagnes_attaquant + 1;
        v_pays_perdant_id := v_conflit.pays_defenseur_id;
      elsif v_effort_attaquant < v_effort_defenseur * 1.5 then
        v_jours_gagnes_defenseur := v_jours_gagnes_defenseur + 1;
        v_pays_perdant_id := v_conflit.pays_attaquant_id;
      else
        v_pays_perdant_id := null;
      end if;

      if v_pays_perdant_id is not null then
        for v_ville in
          select id, population from public.cities where country_id = v_pays_perdant_id
        loop
          v_perte := greatest(1, round(v_ville.population * 0.001));
          select coalesce(sum(valeur), 0) into v_perte_existante
            from public.city_events
            where ville_id = v_ville.id and type = 'guerre' and conflit_id = v_conflit.id;
          v_plafond := greatest(1, ceil(v_ville.population * 0.05));
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

-- conflit_pays : types de retour modifiés (efforts décimaux), donc
-- suppression puis recréation (create or replace refuse de changer les
-- colonnes de retour).
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
  effort_attaquant numeric,
  effort_defenseur numeric,
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
