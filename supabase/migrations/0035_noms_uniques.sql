-- Noms uniques : pseudos et noms de ville (docs/A-INTEGRER.md §8, règle
-- ferme d'Adrien du 24/09/2026, jamais codée jusqu'ici — voir
-- docs/DECISIONS.md §10 point 26).
--
-- Écarts assumés avec la lettre du §8 (décisions de Claude Code) :
-- 1. PAS d'extension `unaccent` : un index sur colonne générée exige
--    une fonction IMMUTABLE, ce qu'unaccent n'est pas, et son schéma
--    d'installation varie selon le projet Supabase. À la place,
--    nom_normalise() translittère explicitement les lettres latines
--    accentuées (translate/replace) — même résultat pour les noms
--    attendus, entièrement déterministe et sans dépendance.
-- 2. Les règles de FORMAT (pseudo de 3 à 20 caractères, noms réservés,
--    mots interdits) sont appliquées côté serveur applicatif
--    (src/lib/game/nomsUniques.ts), pas dans creer_ville() : les specs
--    e2e et les scripts d'amorçage appellent creer_ville() directement
--    avec des pseudos arbitraires. L'UNICITÉ, elle, est garantie par la
--    base (index uniques), comme demandé.
--
-- Doublons déjà existants : le plus ancien garde le nom, les autres sont
-- marqués `*_a_changer` et exclus de l'index unique ; le joueur concerné
-- passe par l'écran de rattrapage /ville/noms à sa prochaine connexion.
--
-- Codes d'erreur : P0027 = pseudo déjà pris, P0028 = nom de ville déjà pris.

-- ---------------------------------------------------------------------
-- Correctif sans rapport direct mais découvert en chemin : la contrainte
-- cities_niveau_check (migration 0001) plafonne encore à 5 alors que
-- le niveau "Mégapole" (6, migration 0031) existe : toute ville à
-- 250 000 habitants ou plus faisait échouer sa propre mise à jour
-- (le journal e2e affichait "cities_niveau_check" sans que personne
-- ne le relève).
-- ---------------------------------------------------------------------
alter table public.cities drop constraint cities_niveau_check;
alter table public.cities add constraint cities_niveau_check check (niveau between 0 and 6);

-- ---------------------------------------------------------------------
-- nom_normalise : minuscules, sans accents, uniquement a-z et 0-9
-- (espaces, tirets, apostrophes et toute ponctuation disparaissent).
-- « Rochemaure », « rochemaure », « Rochemauré », « Roche-Maure » →
-- « rochemaure ».
-- ---------------------------------------------------------------------
create or replace function public.nom_normalise(p_nom text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
    replace(replace(replace(
      translate(
        lower(p_nom),
        'àáâãäåāăąçćčďđèéêëēĕėęěğìíîïĩīĭįıłñńňòóôõöøōŏőŕřśšşťţùúûüũūŭůűųýÿžźż',
        'aaaaaaaaaccc' || 'ddeeeeeeeeegiiiiiiiiilnnnooooooooorrsssttuuuuuuuuuuyyzzz'
      ),
      'œ', 'oe'), 'æ', 'ae'), 'ß', 'ss'),
    '[^a-z0-9]', '', 'g'
  );
$$;

-- ---------------------------------------------------------------------
-- Colonnes normalisées (générées, donc jamais désynchronisées) et
-- drapeaux de rattrapage.
-- ---------------------------------------------------------------------
alter table public.users
  add column pseudo_normalise text generated always as (public.nom_normalise(pseudo)) stored,
  add column pseudo_a_changer boolean not null default false;

alter table public.cities
  add column nom_normalise text generated always as (public.nom_normalise(nom)) stored,
  add column nom_a_changer boolean not null default false;

-- Dédoublonnage : le plus ancien garde le nom, les suivants doivent en
-- choisir un autre. (created_at puis id pour départager à l'égalité.)
update public.users u
set pseudo_a_changer = true
where exists (
  select 1 from public.users o
  where o.pseudo_normalise = u.pseudo_normalise
    and (o.created_at, o.id) < (u.created_at, u.id)
);

update public.cities c
set nom_a_changer = true
where exists (
  select 1 from public.cities o
  where o.nom_normalise = c.nom_normalise
    and (o.created_at, o.id) < (c.created_at, c.id)
);

-- Index uniques : c'est la base qui garantit la règle, pas seulement le
-- formulaire (deux inscriptions simultanées ne passent pas toutes les
-- deux). Partiels : les lignes marquées à changer en sont exclues.
create unique index users_pseudo_normalise_unique
  on public.users (pseudo_normalise) where not pseudo_a_changer;
create unique index cities_nom_normalise_unique
  on public.cities (nom_normalise) where not nom_a_changer;

-- ---------------------------------------------------------------------
-- nom_disponible : pour le « ✓ disponible / ✗ déjà pris » pendant la
-- saisie. p_type = 'pseudo' ou 'ville'. p_sauf_user_id exclut le
-- joueur lui-même (écran de rattrapage : garder son propre nom normalisé
-- avec une autre casse reste possible).
-- ---------------------------------------------------------------------
create or replace function public.nom_disponible(
  p_type text,
  p_nom text,
  p_sauf_user_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_norm text := public.nom_normalise(p_nom);
begin
  if v_norm = '' then
    return false;
  end if;
  if p_type = 'pseudo' then
    return not exists (
      select 1 from public.users
      where pseudo_normalise = v_norm and not pseudo_a_changer
        and (p_sauf_user_id is null or id <> p_sauf_user_id)
    );
  elsif p_type = 'ville' then
    return not exists (
      select 1 from public.cities
      where nom_normalise = v_norm and not nom_a_changer
        and (p_sauf_user_id is null or owner_id <> p_sauf_user_id)
    );
  end if;
  raise exception 'nom_disponible: type inconnu : %', p_type using errcode = 'P0006';
end;
$$;

-- ---------------------------------------------------------------------
-- creer_ville : même signature (create or replace direct), mais une
-- collision de nom lève P0027/P0028 au lieu d'une erreur d'index brute.
-- ---------------------------------------------------------------------
create or replace function public.creer_ville(
  p_owner_id uuid,
  p_pseudo text,
  p_country_id text,
  p_nom_ville text,
  p_region_id text default null
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ville public.cities;
  v_region_id text;
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'creer_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  if exists (select 1 from public.users where id = p_owner_id) then
    raise exception 'creer_ville: ce compte a déjà un profil' using errcode = '23505';
  end if;

  if p_region_id is not null then
    if not exists (select 1 from public.regions where id = p_region_id and country_id = p_country_id) then
      raise exception 'creer_ville: région invalide pour ce pays' using errcode = 'P0010';
    end if;
    v_region_id := p_region_id;
  else
    select id into v_region_id from public.regions where country_id = p_country_id order by id limit 1;
  end if;

  begin
    insert into public.users (id, pseudo, country_id)
    values (p_owner_id, p_pseudo, p_country_id);
  exception when unique_violation then
    raise exception 'creer_ville: pseudo déjà pris' using errcode = 'P0027';
  end;

  begin
    insert into public.cities (nom, owner_id, country_id, niveau, region_id, region_choisie_le)
    values (p_nom_ville, p_owner_id, p_country_id, public.population_vers_niveau(1), v_region_id, now())
    returning * into v_ville;
  exception when unique_violation then
    raise exception 'creer_ville: nom de ville déjà pris' using errcode = 'P0028';
  end;

  update public.users set city_id = v_ville.id where id = p_owner_id;

  return v_ville;
end;
$$;

-- ---------------------------------------------------------------------
-- renommer_pseudo / renommer_ville : écran de rattrapage (et
-- changement volontaire tant qu'on y est, sans délai pour l'instant).
-- Lèvent la même erreur que la création en cas de collision.
-- ---------------------------------------------------------------------
create or replace function public.renommer_pseudo(p_user_id uuid, p_pseudo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'renommer_pseudo: utilisateur non autorisé' using errcode = 'P0007';
  end if;
  if not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'renommer_pseudo: profil introuvable' using errcode = 'P0004';
  end if;
  begin
    update public.users set pseudo = p_pseudo, pseudo_a_changer = false where id = p_user_id;
  exception when unique_violation then
    raise exception 'renommer_pseudo: pseudo déjà pris' using errcode = 'P0027';
  end;
end;
$$;

create or replace function public.renommer_ville(p_owner_id uuid, p_nom text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'renommer_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;
  if not exists (select 1 from public.cities where owner_id = p_owner_id) then
    raise exception 'renommer_ville: ville introuvable' using errcode = 'P0004';
  end if;
  begin
    update public.cities set nom = p_nom, nom_a_changer = false where owner_id = p_owner_id;
  exception when unique_violation then
    raise exception 'renommer_ville: nom de ville déjà pris' using errcode = 'P0028';
  end;
end;
$$;
