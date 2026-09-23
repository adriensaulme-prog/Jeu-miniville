-- Jalon 1 — « Naître quelque part »
-- Tables cahier des charges §28 (users, cities, countries), réduites au
-- périmètre du Jalon 1. Voir docs/DECISIONS.md §4 pour le journal complet.

-- ---------------------------------------------------------------------
-- countries : liste fixe, alimentée par la migration 0002 (seed), jamais
-- modifiée par les joueurs.
-- ---------------------------------------------------------------------
create table public.countries (
  id text primary key,             -- code ISO 3166-1 alpha-2 (ex. 'FR')
  nom_fr text not null,
  nom_en text not null
);

alter table public.countries enable row level security;

create policy "countries_lecture_publique"
  on public.countries for select
  using (true);

-- ---------------------------------------------------------------------
-- users : profil joueur (en plus de auth.users, qui gère l'identité).
-- city_id est nullable le temps que le compte n'a pas encore de ville
-- (entre l'inscription et le passage par /ville/creer) ; la contrainte
-- de clé étrangère est ajoutée après la création de la table cities
-- plus bas, pour éviter une dépendance circulaire à la création.
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null check (char_length(trim(pseudo)) between 1 and 40),
  country_id text not null references public.countries (id),
  city_id uuid,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users_lecture_publique"
  on public.users for select
  using (true);

-- Aucune policy insert/update pour anon/authenticated : la création et
-- la mise à jour du profil passent uniquement par la fonction
-- creer_ville() ci-dessous, exécutée côté serveur avec la clé
-- service_role (anti-triche, docs/DECISIONS.md §1 point 2).

-- ---------------------------------------------------------------------
-- cities : une ville par joueur (owner_id unique). population,
-- influence, activite et niveau ne sont jamais écrits par le client.
-- ---------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(trim(nom)) between 1 and 40),
  owner_id uuid not null unique references public.users (id) on delete cascade,
  country_id text not null references public.countries (id),
  population integer not null default 1 check (population >= 0),
  influence integer not null default 0 check (influence >= 0),
  activite integer not null default 0 check (activite >= 0),
  niveau integer not null default 0 check (niveau between 0 and 5), -- 0=Hameau … 5=Métropole (seuils d'évolution : Jalon 2)
  created_at timestamptz not null default now()
);

alter table public.cities enable row level security;

create policy "cities_lecture_publique"
  on public.cities for select
  using (true);

-- Aucune policy insert/update pour anon/authenticated, même raison que
-- pour users : tout passe par creer_ville().

alter table public.users
  add constraint users_city_id_fkey
  foreign key (city_id) references public.cities (id);

-- ---------------------------------------------------------------------
-- creer_ville : point d'entrée unique pour « naître quelque part ».
-- Crée le profil joueur et sa ville dans la même transaction (function
-- plpgsql = une transaction). Exécutée depuis le serveur Next.js avec
-- la clé service_role (bypass RLS), après vérification de la session
-- de l'utilisateur — voir src/app/ville/creer/actions.ts.
--
-- Le garde-fou auth.uid() ci-dessous n'est pas nécessaire tant que seule
-- la clé service_role appelle cette fonction (elle bypass RLS et n'a
-- pas de auth.uid()), mais protège la fonction si elle est un jour
-- exposée en rpc() direct au client authentifié.
-- ---------------------------------------------------------------------
create or replace function public.creer_ville(
  p_owner_id uuid,
  p_pseudo text,
  p_country_id text,
  p_nom_ville text
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
    raise exception 'creer_ville: utilisateur non autorisé';
  end if;

  if exists (select 1 from public.users where id = p_owner_id) then
    raise exception 'creer_ville: ce compte a déjà un profil' using errcode = '23505';
  end if;

  insert into public.users (id, pseudo, country_id)
  values (p_owner_id, p_pseudo, p_country_id);

  insert into public.cities (nom, owner_id, country_id)
  values (p_nom_ville, p_owner_id, p_country_id)
  returning * into v_ville;

  update public.users set city_id = v_ville.id where id = p_owner_id;

  return v_ville;
end;
$$;
