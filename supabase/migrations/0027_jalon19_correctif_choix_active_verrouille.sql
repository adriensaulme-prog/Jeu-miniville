-- Correctif Jalon 19 — docs/A-INTEGRER.md §20 B (retour de test d'Adrien,
-- 27/09/2026) : une fois qu'un joueur a choisi explicitement l'activité
-- d'une visite, ce choix doit être définitif — pas rappelable pour en
-- choisir une autre pendant la fenêtre de grâce de 5 minutes. La
-- fenêtre de grâce elle-même reste utile (le temps de voir la visite
-- automatique se déclencher puis de choisir), seul le fait de pouvoir
-- CHANGER un choix déjà fait disparaît.
--
-- Registre des codes d'erreur : nouveau code P0023 (choix déjà
-- verrouillé pour cette visite), suite de P0021/P0022 (migration 0023).

alter table public.visites
  add column activite_verrouillee boolean not null default false;

-- ---------------------------------------------------------------------
-- choisir_activite_visite() : signature et type de retour inchangés
-- depuis la migration 0024, donc create or replace direct. Sépare
-- maintenant la lecture de la visite récente (pour vérifier le verrou
-- AVANT d'écrire) de la mise à jour elle-même — l'ancienne version
-- faisait directement un update...returning, sans lire l'état d'abord.
-- ---------------------------------------------------------------------
create or replace function public.choisir_activite_visite(
  p_visiteur_id uuid,
  p_ville_id uuid,
  p_activite text
)
returns public.visites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_population_max integer;
  v_niveau integer;
  v_activites text[];
  v_visite public.visites;
  v_dernier_type_action text;
  v_derniere_attaque timestamptz;
  v_palier text;
  v_bonus_solidarite integer;
begin
  if auth.uid() is not null and auth.uid() <> p_visiteur_id then
    raise exception 'choisir_activite_visite: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select population_max into v_population_max from public.cities where id = p_ville_id;
  if v_population_max is null then
    raise exception 'choisir_activite_visite: ville introuvable' using errcode = 'P0004';
  end if;

  v_niveau := public.population_vers_niveau(v_population_max);
  v_activites := array['residentiel', 'loisirs'];
  if v_niveau >= 1 then v_activites := v_activites || array['commerce', 'services']; end if;
  if v_niveau >= 2 then v_activites := v_activites || array['industrie', 'energie']; end if;
  if v_niveau >= 3 then v_activites := v_activites || array['recherche']; end if;

  if not (p_activite = any(v_activites)) then
    raise exception 'choisir_activite_visite: activité invalide ou non débloquée : %', p_activite
      using errcode = 'P0022';
  end if;

  select * into v_visite
    from public.visites
    where visiteur_id = p_visiteur_id and ville_id = p_ville_id
      and created_at >= now() - interval '5 minutes'
    order by created_at desc
    limit 1;

  if v_visite.id is null then
    raise exception 'choisir_activite_visite: aucune visite récente à modifier' using errcode = 'P0021';
  end if;

  if v_visite.activite_verrouillee then
    raise exception 'choisir_activite_visite: choix déjà verrouillé pour cette visite' using errcode = 'P0023';
  end if;

  update public.visites
    set activite = p_activite,
        activite_verrouillee = true
    where id = v_visite.id
    returning * into v_visite;

  if not v_visite.bonus_solidarite_applique then
    select type_action, created_at into v_dernier_type_action, v_derniere_attaque
      from public.actions_antiville
      where ville_id = p_ville_id and created_at >= now() - interval '24 hours'
      order by created_at desc limit 1;

    if v_derniere_attaque is not null and public.activite_protectrice(v_dernier_type_action) = p_activite then
      v_palier := public.palier_attaques(public.attaques_recues_aujourdhui(p_ville_id));
      v_bonus_solidarite := case when v_palier in ('emeutes', 'crise', 'sinistree') then 2 else 1 end;

      update public.visites set bonus_solidarite_applique = true where id = v_visite.id;
      update public.cities
        set population = population + v_bonus_solidarite,
            population_max = greatest(population_max, population + v_bonus_solidarite),
            niveau = public.population_vers_niveau(greatest(population_max, population + v_bonus_solidarite))
        where id = p_ville_id;
    end if;
  end if;

  return v_visite;
end;
$$;
