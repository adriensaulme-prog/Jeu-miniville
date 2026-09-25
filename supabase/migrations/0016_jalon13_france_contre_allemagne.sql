-- Jalon 13 — « France contre Allemagne »
-- Cahier des charges : premier scénario concret de rivalité
-- internationale (coût en ressources, bonus défensif pour l'attaqué,
-- mobilisation quotidienne, résultat en fin de période). Voir
-- docs/DECISIONS.md §4 pour le raisonnement complet.
--
-- Déclenchement et résolution, tranchés avec Adrien avant de coder
-- (contrairement à "aucun effet de gameplay" laissé en l'état aux
-- Jalons 10 et 12) : "à la fin de la semaine, le vote majoritaire des
-- personnes de la nation déclenche l'action choisie, le président émet
-- une suggestion mais ne décide pas seul." Ce jalon ajoute donc ce qui
-- manquait au Jalon 12 (une notion de "pour"/"contre" et une
-- résolution majoritaire en fin de semaine), puis enchaîne sur un
-- conflit d'une semaine si la décision adoptée est une "rivalité".

-- ---------------------------------------------------------------------
-- votes_diplomatie (Jalon 12) : ajoute la position pour/contre,
-- nécessaire au "vote majoritaire" demandé par Adrien. Toutes les
-- lignes déjà existantes (aucune en pratique, jalon livré le même
-- jour) valent "pour" par défaut.
-- ---------------------------------------------------------------------
alter table public.votes_diplomatie
  add column position text not null default 'pour' check (position in ('pour', 'contre'));

-- soutenir_decision_diplomatique(uuid) est remplacée par une version à
-- deux paramètres : `create or replace` avec une signature différente
-- créerait une deuxième fonction au lieu de la remplacer (Postgres
-- distingue par les types de paramètres, pas les noms — piège déjà
-- rencontré et documenté au Jalon 8, migration 0010).
drop function if exists public.soutenir_decision_diplomatique(uuid);

create or replace function public.soutenir_decision_diplomatique(
  p_joueur_id uuid,
  p_position text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id text;
  v_semaine date := date_trunc('week', now() at time zone 'utc')::date;
begin
  if p_position not in ('pour', 'contre') then
    raise exception 'soutenir_decision_diplomatique: position invalide : %', p_position
      using errcode = 'P0014';
  end if;

  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'soutenir_decision_diplomatique: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select country_id into v_country_id from public.users where id = p_joueur_id;
  if v_country_id is null then
    raise exception 'soutenir_decision_diplomatique: profil introuvable' using errcode = 'P0004';
  end if;

  if not exists (
    select 1 from public.propositions_diplomatiques
    where country_id = v_country_id and semaine = v_semaine
  ) then
    raise exception 'soutenir_decision_diplomatique: aucune proposition cette semaine pour ce pays'
      using errcode = 'P0016';
  end if;

  -- Lève une erreur unique_violation (23505) si déjà voté cette semaine.
  insert into public.votes_diplomatie (joueur_id, country_id, semaine, position)
  values (p_joueur_id, v_country_id, v_semaine, p_position);
end;
$$;

-- resultat_decision_semaine (Jalon 12) redéfinie : distingue pour/contre.
-- `create or replace` refuse de changer le type de retour d'une
-- fonction existante (les colonnes OUT changent : nb_soutiens devient
-- nb_pour/nb_contre) — même famille de piège que la surcharge de
-- paramètres (Jalon 8, migration 0010), mais côté colonnes de retour
-- cette fois ; il faut la supprimer explicitement d'abord.
drop function if exists public.resultat_decision_semaine(text, date);

create or replace function public.resultat_decision_semaine(
  p_country_id text,
  p_semaine date default null
)
returns table (
  proposition_id uuid,
  pays_cible_id text,
  categorie text,
  proposee_par_ville_id uuid,
  nb_pour bigint,
  nb_contre bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with semaine_cible as (
    select coalesce(p_semaine, date_trunc('week', now() at time zone 'utc')::date) as s
  )
  select
    pd.id,
    pd.pays_cible_id,
    pd.categorie,
    pd.proposee_par_ville_id,
    (
      select count(*)::bigint from public.votes_diplomatie v, semaine_cible sc
      where v.country_id = pd.country_id and v.semaine = sc.s and v.position = 'pour'
    ) as nb_pour,
    (
      select count(*)::bigint from public.votes_diplomatie v, semaine_cible sc
      where v.country_id = pd.country_id and v.semaine = sc.s and v.position = 'contre'
    ) as nb_contre
  from public.propositions_diplomatiques pd, semaine_cible sc
  where pd.country_id = p_country_id and pd.semaine = sc.s;
$$;

-- ---------------------------------------------------------------------
-- resultats_diplomatiques : verdict d'une proposition une fois sa
-- semaine terminée (une ligne par proposition, jamais recalculée).
-- ---------------------------------------------------------------------
create table public.resultats_diplomatiques (
  id uuid primary key default gen_random_uuid(),
  proposition_id uuid not null unique references public.propositions_diplomatiques (id) on delete cascade,
  country_id text not null references public.countries (id),
  pays_cible_id text not null references public.countries (id),
  categorie text not null,
  nb_pour bigint not null,
  nb_contre bigint not null,
  adoptee boolean not null,
  resolved_at timestamptz not null default now()
);

alter table public.resultats_diplomatiques enable row level security;

create policy "resultats_diplomatiques_lecture_publique"
  on public.resultats_diplomatiques for select
  using (true);

-- ---------------------------------------------------------------------
-- conflits : un conflit par déclenchement d'une rivalité adoptée. Dure
-- 7 jours à partir du déclenchement (pas calé sur la semaine ISO — la
-- décision qui le déclenche vient d'une semaine déjà terminée, plus
-- simple de faire courir le conflit à partir de sa résolution).
-- cout_ressources : instantané des ressources nationales de l'attaquant
-- au moment du déclenchement (docs/CARTE... non, docs/DECISIONS.md §4,
-- Jalon 13) — **informatif seulement, rien n'est retiré nulle part** :
-- les ressources du Jalon 10 sont un compteur cumulatif en lecture
-- seule, sans mécanisme de dépense ; en faire une vraie monnaie
-- dépensable aurait été un jalon à part entière. Décision prise sans
-- attendre Adrien, à contester si besoin — voir DECISIONS.md §10.
-- ---------------------------------------------------------------------
create table public.conflits (
  id uuid primary key default gen_random_uuid(),
  pays_attaquant_id text not null references public.countries (id),
  pays_defenseur_id text not null references public.countries (id),
  debut timestamptz not null default now(),
  fin timestamptz not null,
  cout_ressources jsonb not null default '{}'::jsonb,
  statut text not null default 'en_cours' check (statut in ('en_cours', 'termine')),
  resultat text check (resultat in ('attaquant', 'defenseur', 'egalite')),
  effort_attaquant bigint,
  effort_defenseur bigint,
  created_at timestamptz not null default now(),
  check (pays_attaquant_id <> pays_defenseur_id)
);

create unique index conflits_paire_active_unique
  on public.conflits (least(pays_attaquant_id, pays_defenseur_id), greatest(pays_attaquant_id, pays_defenseur_id))
  where statut = 'en_cours';

alter table public.conflits enable row level security;

create policy "conflits_lecture_publique"
  on public.conflits for select
  using (true);

-- ---------------------------------------------------------------------
-- mobilisations : une par (joueur, conflit, jour) — l'effort quotidien
-- demandé par Adrien ("mobilisation quotidienne").
-- ---------------------------------------------------------------------
create table public.mobilisations (
  id uuid primary key default gen_random_uuid(),
  joueur_id uuid not null references public.users (id) on delete cascade,
  conflit_id uuid not null references public.conflits (id) on delete cascade,
  jour date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (joueur_id, conflit_id, jour)
);

alter table public.mobilisations enable row level security;

create policy "mobilisations_lecture_propre"
  on public.mobilisations for select
  using (auth.uid() = joueur_id);

-- ---------------------------------------------------------------------
-- resoudre_decision_diplomatique : idempotente, appelée à chaque
-- affichage de /pays (comme verifier_president au Jalon 11). Clôt la
-- proposition de la dernière semaine terminée (majorité pour/contre
-- des votes exprimés, égalité ou zéro vote = non adoptée) et, si
-- adoptée et catégorie "rivalite", déclenche un conflit — sauf si un
-- conflit est déjà en cours entre ces deux pays (index unique
-- conflits_paire_active_unique).
-- ---------------------------------------------------------------------
create or replace function public.resoudre_decision_diplomatique(p_country_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_semaine_courante date := date_trunc('week', now() at time zone 'utc')::date;
  v_proposition record;
  v_pour bigint;
  v_contre bigint;
  v_adoptee boolean;
  v_ressources jsonb;
begin
  select * into v_proposition
    from public.propositions_diplomatiques
    where country_id = p_country_id and semaine < v_semaine_courante
    order by semaine desc
    limit 1;

  if v_proposition is null then
    return; -- rien à résoudre
  end if;

  if exists (select 1 from public.resultats_diplomatiques where proposition_id = v_proposition.id) then
    return; -- déjà résolue (idempotence)
  end if;

  select count(*) filter (where position = 'pour'), count(*) filter (where position = 'contre')
    into v_pour, v_contre
    from public.votes_diplomatie
    where country_id = p_country_id and semaine = v_proposition.semaine;

  v_adoptee := v_pour > v_contre; -- égalité ou 0-0 : non adoptée

  insert into public.resultats_diplomatiques
    (proposition_id, country_id, pays_cible_id, categorie, nb_pour, nb_contre, adoptee)
  values
    (v_proposition.id, p_country_id, v_proposition.pays_cible_id, v_proposition.categorie, v_pour, v_contre, v_adoptee);

  if v_adoptee and v_proposition.categorie = 'rivalite' then
    select jsonb_object_agg(categorie, total) into v_ressources
      from public.ressources_pays(p_country_id);

    insert into public.conflits (pays_attaquant_id, pays_defenseur_id, fin, cout_ressources)
    values (p_country_id, v_proposition.pays_cible_id, now() + interval '7 days', coalesce(v_ressources, '{}'::jsonb))
    on conflict do nothing; -- un conflit déjà en cours entre ces deux pays : pas de doublon
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- mobiliser : une fois par jour et par joueur, pour le conflit en
-- cours de son pays (attaquant ou défenseur).
-- ---------------------------------------------------------------------
create or replace function public.mobiliser(p_joueur_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id text;
  v_conflit_id uuid;
begin
  if auth.uid() is not null and auth.uid() <> p_joueur_id then
    raise exception 'mobiliser: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  select country_id into v_country_id from public.users where id = p_joueur_id;
  if v_country_id is null then
    raise exception 'mobiliser: profil introuvable' using errcode = 'P0004';
  end if;

  select id into v_conflit_id
    from public.conflits
    where statut = 'en_cours' and (pays_attaquant_id = v_country_id or pays_defenseur_id = v_country_id)
    limit 1;

  if v_conflit_id is null then
    raise exception 'mobiliser: aucun conflit en cours pour ce pays' using errcode = 'P0017';
  end if;

  -- Lève une erreur unique_violation (23505) si déjà mobilisé aujourd'hui.
  insert into public.mobilisations (joueur_id, conflit_id) values (p_joueur_id, v_conflit_id);
end;
$$;

-- ---------------------------------------------------------------------
-- resoudre_conflits_en_cours : idempotente, appelée à chaque affichage
-- de /pays. Clôt tout conflit dont la période de 7 jours est passée :
-- compare l'effort de mobilisation des deux camps, bonus défensif de
-- 50 % pour le défenseur (docs/DECISIONS.md §4, Jalon 13 — "bonus
-- défensif pour l'attaqué" du cahier des charges).
-- ---------------------------------------------------------------------
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
    select count(*) into v_effort_attaquant
      from public.mobilisations m
      join public.users u on u.id = m.joueur_id
      where m.conflit_id = v_conflit.id and u.country_id = v_conflit.pays_attaquant_id;

    select count(*) into v_effort_defenseur
      from public.mobilisations m
      join public.users u on u.id = m.joueur_id
      where m.conflit_id = v_conflit.id and u.country_id = v_conflit.pays_defenseur_id;

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

-- ---------------------------------------------------------------------
-- conflit_pays : le conflit en cours ou le plus récent d'un pays (pour
-- l'affichage sur /pays), avec son effort de mobilisation à jour.
-- ---------------------------------------------------------------------
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
    coalesce(c.effort_attaquant, (
      select count(*) from public.mobilisations m join public.users u on u.id = m.joueur_id
      where m.conflit_id = c.id and u.country_id = c.pays_attaquant_id
    )) as effort_attaquant,
    coalesce(c.effort_defenseur, (
      select count(*) from public.mobilisations m join public.users u on u.id = m.joueur_id
      where m.conflit_id = c.id and u.country_id = c.pays_defenseur_id
    )) as effort_defenseur,
    c.cout_ressources
  from public.conflits c
  where c.pays_attaquant_id = p_country_id or c.pays_defenseur_id = p_country_id
  order by c.created_at desc
  limit 1;
$$;
