-- Amis et suivi (docs/A-INTEGRER.md §26 D, cahier des charges §25) :
-- « les joueurs peuvent suivre leurs amis, consulter leurs villes et voir
-- leurs classements. Les relations sociales doivent rester simples. »
--
-- Choix de Claude Code (le §26 laissait « à confirmer au moment de
-- spécifier ») : un SUIVI UNILATÉRAL d'une ville, sans amitié réciproque,
-- sans demande ni acceptation — suivre ne demande rien à l'autre joueur
-- et ne lui donne rien (pas de notification, pas de compteur d'abonnés
-- affiché). C'est une liste de raccourcis personnelle vers des villes,
-- avec leur rang. Une ville suivie = ville de n'importe quel autre joueur ;
-- on ne peut pas suivre la sienne.
--
-- Quota : 50 villes suivies par joueur (garde-fou de taille de liste et de
-- coût de la page « Villes suivies », pas une règle de jeu). Suivre deux
-- fois la même ville est sans effet (idempotent). Supprimer une ville
-- ou un compte supprime les suivis correspondants (on delete cascade).
--
-- Nouveau code d'erreur : P0029 = quota de villes suivies atteint.
-- Réutilisés : P0004 (ville introuvable), P0005 (sa propre ville),
-- P0007 (joueur non autorisé).

create table public.villes_suivies (
  joueur_id uuid not null references public.users (id) on delete cascade,
  ville_id uuid not null references public.cities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (joueur_id, ville_id)
);

create index villes_suivies_ville_idx on public.villes_suivies (ville_id);

alter table public.villes_suivies enable row level security;

-- Chacun ne voit que SA liste (personne ne sait qui suit quelle ville).
create policy "villes_suivies_lecture_propre"
  on public.villes_suivies for select
  using (joueur_id = auth.uid());

-- Aucune policy insert/update/delete : tout passe par les fonctions ci-dessous.

create or replace function public.suivre_ville(
  p_joueur_id uuid,
  p_ville_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_nb integer;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'suivre_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'suivre_ville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id = p_joueur_id then
    raise exception 'suivre_ville: impossible de suivre sa propre ville' using errcode = 'P0005';
  end if;

  -- Déjà suivie : rien à faire (et le quota ne s'applique pas à un ajout inutile).
  if exists (select 1 from public.villes_suivies where joueur_id = p_joueur_id and ville_id = p_ville_id) then
    return;
  end if;

  select count(*) into v_nb from public.villes_suivies where joueur_id = p_joueur_id;
  if v_nb >= 50 then
    raise exception 'suivre_ville: quota de villes suivies atteint (50)' using errcode = 'P0029';
  end if;

  insert into public.villes_suivies (joueur_id, ville_id) values (p_joueur_id, p_ville_id)
    on conflict do nothing;
end;
$$;

create or replace function public.ne_plus_suivre_ville(
  p_joueur_id uuid,
  p_ville_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'ne_plus_suivre_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;
  delete from public.villes_suivies where joueur_id = p_joueur_id and ville_id = p_ville_id;
end;
$$;

-- ---------------------------------------------------------------------
-- villes_suivies_rangs() : pour chaque ville suivie par le joueur, son rang
-- dans son pays et dans le monde (par population, ex æquo = même rang,
-- comme partout ailleurs dans le jeu : rang = nombre de villes devant + 1).
-- Un seul appel pour toute la page plutôt qu'un comptage par ville.
-- ---------------------------------------------------------------------
create or replace function public.villes_suivies_rangs(p_joueur_id uuid)
returns table (ville_id uuid, rang_pays integer, rang_monde integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'villes_suivies_rangs: utilisateur non autorisé' using errcode = 'P0007';
  end if;
  return query
  select r.id, r.rang_pays, r.rang_monde
  from (
    select
      c.id,
      rank() over (partition by c.country_id order by c.population desc)::integer as rang_pays,
      rank() over (order by c.population desc)::integer as rang_monde
    from public.cities c
  ) r
  where r.id in (select vs.ville_id from public.villes_suivies vs where vs.joueur_id = p_joueur_id);
end;
$$;
