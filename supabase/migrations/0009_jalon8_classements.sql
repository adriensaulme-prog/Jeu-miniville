-- Jalon 8 — « Se classer »
-- Spécification : docs/CLASSEMENTS.md (proposition d'Adrien, validée sur
-- le principe le 24/09/2026). Régions + classements mondial/national/
-- régional. Les palmarès (bilans journaliers, classements annexes par
-- période) sont scindés dans le Jalon 8bis — voir docs/DECISIONS.md §4.

-- ---------------------------------------------------------------------
-- regions : premier niveau de découpage administratif d'un pays.
-- Régions réelles pour les 6 pays les plus présents parmi les villes de
-- test et cités nommément par Adrien (France, Allemagne, Belgique,
-- Suisse, Canada, États-Unis — docs/A-INTEGRER.md §6). Repli à une seule
-- région "Tout le pays" pour tous les autres, généré ci-dessous à partir
-- de `countries` plutôt que listé à la main (CLASSEMENTS.md §1 :
-- "Pays sans découpage utile : Monaco, Luxembourg, Malte, etc." —
-- s'applique en réalité à la plupart des ~240 pays restants). Étendre à
-- d'autres pays plus tard ne demande qu'une nouvelle migration insert.
-- ---------------------------------------------------------------------
create table public.regions (
  id text primary key,             -- ex. 'fr-idf', ou '{pays}-tout' pour le repli
  country_id text not null references public.countries (id),
  nom_fr text not null,
  nom_en text not null
);

alter table public.regions enable row level security;

create policy "regions_lecture_publique"
  on public.regions for select
  using (true);

create index regions_country_id_idx on public.regions (country_id);

-- 127 régions réelles (FR 18, DE 16, BE 3, CH 26, CA 13, US 51)
insert into public.regions (id, country_id, nom_fr, nom_en) values
('fr-ara', 'FR', 'Auvergne-Rhône-Alpes', 'Auvergne-Rhône-Alpes'),
('fr-bfc', 'FR', 'Bourgogne-Franche-Comté', 'Bourgogne-Franche-Comté'),
('fr-bre', 'FR', 'Bretagne', 'Brittany'),
('fr-cvl', 'FR', 'Centre-Val de Loire', 'Centre-Val de Loire'),
('fr-cor', 'FR', 'Corse', 'Corsica'),
('fr-ges', 'FR', 'Grand Est', 'Grand Est'),
('fr-hdf', 'FR', 'Hauts-de-France', 'Hauts-de-France'),
('fr-idf', 'FR', 'Île-de-France', 'Île-de-France'),
('fr-nor', 'FR', 'Normandie', 'Normandy'),
('fr-naq', 'FR', 'Nouvelle-Aquitaine', 'Nouvelle-Aquitaine'),
('fr-occ', 'FR', 'Occitanie', 'Occitanie'),
('fr-pdl', 'FR', 'Pays de la Loire', 'Pays de la Loire'),
('fr-pac', 'FR', 'Provence-Alpes-Côte d''Azur', 'Provence-Alpes-Côte d''Azur'),
('fr-glp', 'FR', 'Guadeloupe', 'Guadeloupe'),
('fr-mtq', 'FR', 'Martinique', 'Martinique'),
('fr-guf', 'FR', 'Guyane', 'French Guiana'),
('fr-reu', 'FR', 'La Réunion', 'Réunion'),
('fr-myt', 'FR', 'Mayotte', 'Mayotte'),
('de-bw', 'DE', 'Bade-Wurtemberg', 'Baden-Württemberg'),
('de-by', 'DE', 'Bavière', 'Bavaria'),
('de-be', 'DE', 'Berlin', 'Berlin'),
('de-bb', 'DE', 'Brandebourg', 'Brandenburg'),
('de-hb', 'DE', 'Brême', 'Bremen'),
('de-hh', 'DE', 'Hambourg', 'Hamburg'),
('de-he', 'DE', 'Hesse', 'Hesse'),
('de-mv', 'DE', 'Mecklembourg-Poméranie-Occidentale', 'Mecklenburg-Vorpommern'),
('de-ni', 'DE', 'Basse-Saxe', 'Lower Saxony'),
('de-nw', 'DE', 'Rhénanie-du-Nord-Westphalie', 'North Rhine-Westphalia'),
('de-rp', 'DE', 'Rhénanie-Palatinat', 'Rhineland-Palatinate'),
('de-sl', 'DE', 'Sarre', 'Saarland'),
('de-sn', 'DE', 'Saxe', 'Saxony'),
('de-st', 'DE', 'Saxe-Anhalt', 'Saxony-Anhalt'),
('de-sh', 'DE', 'Schleswig-Holstein', 'Schleswig-Holstein'),
('de-th', 'DE', 'Thuringe', 'Thuringia'),
('be-vlg', 'BE', 'Région flamande', 'Flemish Region'),
('be-wal', 'BE', 'Région wallonne', 'Walloon Region'),
('be-bru', 'BE', 'Région de Bruxelles-Capitale', 'Brussels-Capital Region'),
('ch-zh', 'CH', 'Zurich', 'Zurich'),
('ch-be', 'CH', 'Berne', 'Bern'),
('ch-lu', 'CH', 'Lucerne', 'Lucerne'),
('ch-ur', 'CH', 'Uri', 'Uri'),
('ch-sz', 'CH', 'Schwytz', 'Schwyz'),
('ch-ow', 'CH', 'Obwald', 'Obwalden'),
('ch-nw', 'CH', 'Nidwald', 'Nidwalden'),
('ch-gl', 'CH', 'Glaris', 'Glarus'),
('ch-zg', 'CH', 'Zoug', 'Zug'),
('ch-fr', 'CH', 'Fribourg', 'Fribourg'),
('ch-so', 'CH', 'Soleure', 'Solothurn'),
('ch-bs', 'CH', 'Bâle-Ville', 'Basel-Stadt'),
('ch-bl', 'CH', 'Bâle-Campagne', 'Basel-Landschaft'),
('ch-sh', 'CH', 'Schaffhouse', 'Schaffhausen'),
('ch-ar', 'CH', 'Appenzell Rhodes-Extérieures', 'Appenzell Ausserrhoden'),
('ch-ai', 'CH', 'Appenzell Rhodes-Intérieures', 'Appenzell Innerrhoden'),
('ch-sg', 'CH', 'Saint-Gall', 'St. Gallen'),
('ch-gr', 'CH', 'Grisons', 'Graubünden'),
('ch-ag', 'CH', 'Argovie', 'Aargau'),
('ch-tg', 'CH', 'Thurgovie', 'Thurgau'),
('ch-ti', 'CH', 'Tessin', 'Ticino'),
('ch-vd', 'CH', 'Vaud', 'Vaud'),
('ch-vs', 'CH', 'Valais', 'Valais'),
('ch-ne', 'CH', 'Neuchâtel', 'Neuchâtel'),
('ch-ge', 'CH', 'Genève', 'Geneva'),
('ch-ju', 'CH', 'Jura', 'Jura'),
('ca-on', 'CA', 'Ontario', 'Ontario'),
('ca-qc', 'CA', 'Québec', 'Quebec'),
('ca-bc', 'CA', 'Colombie-Britannique', 'British Columbia'),
('ca-ab', 'CA', 'Alberta', 'Alberta'),
('ca-mb', 'CA', 'Manitoba', 'Manitoba'),
('ca-sk', 'CA', 'Saskatchewan', 'Saskatchewan'),
('ca-ns', 'CA', 'Nouvelle-Écosse', 'Nova Scotia'),
('ca-nb', 'CA', 'Nouveau-Brunswick', 'New Brunswick'),
('ca-nl', 'CA', 'Terre-Neuve-et-Labrador', 'Newfoundland and Labrador'),
('ca-pe', 'CA', 'Île-du-Prince-Édouard', 'Prince Edward Island'),
('ca-nt', 'CA', 'Territoires du Nord-Ouest', 'Northwest Territories'),
('ca-yt', 'CA', 'Yukon', 'Yukon'),
('ca-nu', 'CA', 'Nunavut', 'Nunavut'),
('us-al', 'US', 'Alabama', 'Alabama'),
('us-ak', 'US', 'Alaska', 'Alaska'),
('us-az', 'US', 'Arizona', 'Arizona'),
('us-ar', 'US', 'Arkansas', 'Arkansas'),
('us-ca', 'US', 'Californie', 'California'),
('us-co', 'US', 'Colorado', 'Colorado'),
('us-ct', 'US', 'Connecticut', 'Connecticut'),
('us-de', 'US', 'Delaware', 'Delaware'),
('us-fl', 'US', 'Floride', 'Florida'),
('us-ga', 'US', 'Géorgie', 'Georgia'),
('us-hi', 'US', 'Hawaï', 'Hawaii'),
('us-id', 'US', 'Idaho', 'Idaho'),
('us-il', 'US', 'Illinois', 'Illinois'),
('us-in', 'US', 'Indiana', 'Indiana'),
('us-ia', 'US', 'Iowa', 'Iowa'),
('us-ks', 'US', 'Kansas', 'Kansas'),
('us-ky', 'US', 'Kentucky', 'Kentucky'),
('us-la', 'US', 'Louisiane', 'Louisiana'),
('us-me', 'US', 'Maine', 'Maine'),
('us-md', 'US', 'Maryland', 'Maryland'),
('us-ma', 'US', 'Massachusetts', 'Massachusetts'),
('us-mi', 'US', 'Michigan', 'Michigan'),
('us-mn', 'US', 'Minnesota', 'Minnesota'),
('us-ms', 'US', 'Mississippi', 'Mississippi'),
('us-mo', 'US', 'Missouri', 'Missouri'),
('us-mt', 'US', 'Montana', 'Montana'),
('us-ne', 'US', 'Nebraska', 'Nebraska'),
('us-nv', 'US', 'Nevada', 'Nevada'),
('us-nh', 'US', 'New Hampshire', 'New Hampshire'),
('us-nj', 'US', 'New Jersey', 'New Jersey'),
('us-nm', 'US', 'Nouveau-Mexique', 'New Mexico'),
('us-ny', 'US', 'New York', 'New York'),
('us-nc', 'US', 'Caroline du Nord', 'North Carolina'),
('us-nd', 'US', 'Dakota du Nord', 'North Dakota'),
('us-oh', 'US', 'Ohio', 'Ohio'),
('us-ok', 'US', 'Oklahoma', 'Oklahoma'),
('us-or', 'US', 'Oregon', 'Oregon'),
('us-pa', 'US', 'Pennsylvanie', 'Pennsylvania'),
('us-ri', 'US', 'Rhode Island', 'Rhode Island'),
('us-sc', 'US', 'Caroline du Sud', 'South Carolina'),
('us-sd', 'US', 'Dakota du Sud', 'South Dakota'),
('us-tn', 'US', 'Tennessee', 'Tennessee'),
('us-tx', 'US', 'Texas', 'Texas'),
('us-ut', 'US', 'Utah', 'Utah'),
('us-vt', 'US', 'Vermont', 'Vermont'),
('us-va', 'US', 'Virginie', 'Virginia'),
('us-wa', 'US', 'Washington', 'Washington'),
('us-wv', 'US', 'Virginie-Occidentale', 'West Virginia'),
('us-wi', 'US', 'Wisconsin', 'Wisconsin'),
('us-wy', 'US', 'Wyoming', 'Wyoming'),
('us-dc', 'US', 'District de Columbia', 'District of Columbia');

-- Repli "Tout le pays" pour tous les pays sans découpage réel ci-dessus.
insert into public.regions (id, country_id, nom_fr, nom_en)
select lower(id) || '-tout', id, 'Tout le pays', 'Whole country'
from public.countries
where id not in ('FR', 'DE', 'BE', 'CH', 'CA', 'US');

-- ---------------------------------------------------------------------
-- cities.region_id : nullable pour les villes déjà créées avant ce
-- jalon (aujourd'hui : les villes de test, migrées ci-dessous, et le
-- compte réel d'Adrien) — l'application bloque l'accès au jeu tant que
-- le choix n'est pas fait (écran dédié, comme le fait déjà /ville/creer
-- pour un profil sans ville). Les nouvelles villes le renseignent dès la
-- création. region_choisie_le porte la règle "un changement de région
-- au plus tous les 30 jours" (CLASSEMENTS.md §1) : premier choix libre
-- (region_id encore nul), ensuite un changement compte comme le point de
-- départ des 30 jours suivants.
-- ---------------------------------------------------------------------
alter table public.cities
  add column region_id text references public.regions (id),
  add column region_choisie_le timestamptz;

create index cities_region_id_idx on public.cities (region_id);

-- Villes de test déjà en base (avant que scripts/charger-villes-test.mjs
-- ne soit mis à jour pour leur donner une région dès leur création) :
-- repli sur la région "Tout le pays" de leur pays, pour ne pas les faire
-- disparaître des classements régionaux. Sans effet une fois le script
-- rejoué (il les recrée avec une vraie région).
update public.cities c
set region_id = lower(c.country_id) || '-tout', region_choisie_le = now()
where c.is_test and c.region_id is null
  and exists (select 1 from public.regions r where r.id = lower(c.country_id) || '-tout');

-- ---------------------------------------------------------------------
-- creer_ville : ajoute le choix de région. p_region_id reste optionnel
-- (défaut nul) pour ne pas casser les appels RPC directs des specs e2e
-- des jalons précédents, qui ne testent pas les régions : à nul, on
-- prend la première région du pays choisi (déterministe, sans
-- conséquence pour ces tests). Le vrai formulaire de création
-- (src/app/ville/creer) envoie toujours un choix explicite du joueur.
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

  insert into public.users (id, pseudo, country_id)
  values (p_owner_id, p_pseudo, p_country_id);

  insert into public.cities (nom, owner_id, country_id, niveau, region_id, region_choisie_le)
  values (p_nom_ville, p_owner_id, p_country_id, public.population_vers_niveau(1), v_region_id, now())
  returning * into v_ville;

  update public.users set city_id = v_ville.id where id = p_owner_id;

  return v_ville;
end;
$$;

-- ---------------------------------------------------------------------
-- definir_region : choix initial de région (villes créées avant ce
-- jalon, region_id encore nul — pas de délai) ou changement volontaire
-- (délai de 30 jours depuis le dernier choix, CLASSEMENTS.md §1).
-- ---------------------------------------------------------------------
create or replace function public.definir_region(
  p_owner_id uuid,
  p_region_id text
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'definir_region: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select c.* into v_ville
  from public.cities c
  join public.users u on u.city_id = c.id
  where u.id = p_owner_id;

  if v_ville.id is null then
    raise exception 'definir_region: ville introuvable' using errcode = 'P0004';
  end if;

  if not exists (
    select 1 from public.regions where id = p_region_id and country_id = v_ville.country_id
  ) then
    raise exception 'definir_region: région invalide pour ce pays' using errcode = 'P0010';
  end if;

  if v_ville.region_id is not null and now() - v_ville.region_choisie_le < interval '30 days' then
    raise exception 'definir_region: changement de région trop récent (30 jours)' using errcode = 'P0011';
  end if;

  update public.cities
  set region_id = p_region_id, region_choisie_le = now()
  where id = v_ville.id
  returning * into v_ville;

  return v_ville;
end;
$$;
