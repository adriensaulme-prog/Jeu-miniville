-- Jalon 3 — « Peser socialement »
-- Cahier des charges §4 (influence) : "Chaque joueur dispose de 5
-- actions d'influence par jour. Une action permet d'influencer une
-- autre ville et lui apporte par exemple +1 influence." Voir
-- docs/DECISIONS.md §4 pour le journal complet.

-- ---------------------------------------------------------------------
-- actions_influence : une ligne par (joueur, ville, jour) — comme
-- visites (migration 0003), mais avec en plus un quota global de 5 par
-- joueur et par jour, tous cibles confondues, vérifié dans
-- influencer_ville() (pas exprimable par une seule contrainte SQL).
-- ---------------------------------------------------------------------
create table public.actions_influence (
  id uuid primary key default gen_random_uuid(),
  joueur_id uuid not null references public.users (id) on delete cascade,
  ville_id uuid not null references public.cities (id) on delete cascade,
  jour date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (joueur_id, ville_id, jour)
);

alter table public.actions_influence enable row level security;

create policy "actions_influence_lecture_propre"
  on public.actions_influence for select
  using (auth.uid() = joueur_id);

-- Aucune policy insert/update/delete pour anon/authenticated : tout
-- passe par influencer_ville() ci-dessous (anti-triche, comme
-- creer_ville et visiter_ville aux jalons précédents).

-- ---------------------------------------------------------------------
-- influencer_ville : point d'entrée unique du Jalon 3. +1 influence,
-- au plus une fois par (joueur, ville, jour) et au plus 5 fois par
-- (joueur, jour) tous cibles confondues.
--
-- Limite connue et acceptée pour ce jalon : la vérification du quota
-- (SELECT count(*) puis INSERT) n'est pas verrouillée entre les deux
-- étapes. Un même joueur qui déclencherait plusieurs appels vraiment
-- simultanés pourrait dépasser 5 de quelques unités. Risque jugé
-- négligeable pour un joueur humain cliquant normalement ; à revoir si
-- ça devient un vecteur de triche observé en pratique.
-- ---------------------------------------------------------------------
create or replace function public.influencer_ville(
  p_joueur_id uuid,
  p_ville_id uuid
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_jour date := (now() at time zone 'utc')::date;
  v_nb_actions integer;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'influencer_ville: utilisateur non autorisé';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'influencer_ville: ville introuvable';
  end if;
  if v_owner_id = p_joueur_id then
    raise exception 'influencer_ville: impossible d''influencer sa propre ville';
  end if;

  select count(*) into v_nb_actions
    from public.actions_influence
    where joueur_id = p_joueur_id and jour = v_jour;

  if v_nb_actions >= 5 then
    raise exception 'influencer_ville: quota quotidien d''actions d''influence atteint (5)'
      using errcode = 'P0001';
  end if;

  -- Lève une erreur unique_violation (23505) si cette ville a déjà été
  -- influencée aujourd'hui par ce joueur.
  insert into public.actions_influence (joueur_id, ville_id) values (p_joueur_id, p_ville_id);

  update public.cities
    set influence = influence + 1
    where id = p_ville_id
    returning * into v_ville;

  return v_ville;
end;
$$;
