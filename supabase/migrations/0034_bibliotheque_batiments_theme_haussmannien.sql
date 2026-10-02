-- Bibliothèque de bâtiments (4/4) — premier pack de thème : Haussmannien
-- (docs/BATIMENTS-ET-PACKS.md §4, choisi en priorité par Adrien le
-- 30/09/2026, voir docs/DECISIONS.md §4 et §10 point 21).
--
-- Portée assumée (décision de Claude Code, à contester si besoin) :
-- le document prévoit que les packs de thèmes soient PAYANTS (§5), mais
-- la boutique elle-même est explicitement une étape ultérieure ("après
-- le MVP, une fois le statut légal réglé" — §6 point 4). Comme aucun
-- système de paiement n'existe encore dans ce projet, le thème
-- Haussmannien est ici sélectionnable librement par n'importe quel
-- joueur, sans restriction — pas de colonne joueur_packs, pas de
-- réservation aux comptes de test. La restriction viendra avec la
-- boutique, pas avant.
--
-- "Un pack peut être partiel" (§2) : le pack Haussmannien ne fournit
-- des modèles QUE pour les immeubles (l'archétype parisien) ; les
-- maisons et tours retombent automatiquement sur le pack "classique"
-- via choisirModele() (src/lib/ville3d/catalogue.ts).

alter table public.cities
  add column theme text not null default 'classique' check (theme in ('classique', 'haussmannien'));

-- ---------------------------------------------------------------------
-- definir_theme_ville : seul le maire peut changer le thème de sa
-- ville — même anti-triche que definir_recommandation() (Jalon 17,
-- migration 0023) : aucune policy update sur `cities`, tout passe par
-- une fonction security definer.
-- ---------------------------------------------------------------------
create or replace function public.definir_theme_ville(
  p_owner_id uuid,
  p_ville_id uuid,
  p_theme text
)
returns public.cities
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_ville public.cities;
begin
  if auth.uid() is not null and auth.uid() <> p_owner_id then
    raise exception 'definir_theme_ville: utilisateur non autorisé' using errcode = 'P0007';
  end if;

  if p_theme not in ('classique', 'haussmannien') then
    raise exception 'definir_theme_ville: thème invalide : %', p_theme using errcode = 'P0022';
  end if;

  select owner_id into v_owner_id from public.cities where id = p_ville_id;
  if v_owner_id is null then
    raise exception 'definir_theme_ville: ville introuvable' using errcode = 'P0004';
  end if;
  if v_owner_id <> p_owner_id then
    raise exception 'definir_theme_ville: seul le maire peut changer le thème' using errcode = 'P0007';
  end if;

  update public.cities set theme = p_theme where id = p_ville_id returning * into v_ville;
  return v_ville;
end;
$$;
