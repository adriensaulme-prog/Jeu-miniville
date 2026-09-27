/**
 * Les 7 activités du système de développement des villes
 * (docs/SYSTEME-DEVELOPPEMENT.md, Jalon 17). Source de vérité pour
 * l'affichage (icônes, parts cibles, seuils de déblocage) ; le calcul
 * réel des jauges et le tirage au sort de l'activité par défaut vivent
 * côté serveur (supabase/migrations/0023_..., anti-triche) — à tenir
 * synchronisé si ces chiffres changent.
 */
export const ACTIVITES = [
  "residentiel",
  "industrie",
  "commerce",
  "loisirs",
  "services",
  "energie",
  "recherche",
] as const;

export type Activite = (typeof ACTIVITES)[number];

/** Part cible de chaque activité (§3) — s'additionnent à 100 %. */
export const PART_CIBLE: Record<Activite, number> = {
  residentiel: 0.3,
  industrie: 0.12,
  commerce: 0.14,
  loisirs: 0.12,
  services: 0.12,
  energie: 0.12,
  recherche: 0.08,
};

/**
 * Niveau minimal (0=Hameau … 5=Métropole, voir niveauVille.ts) à partir
 * duquel une activité est proposée (§10 point 8) : Résidentiel et
 * Loisirs dès le Hameau, Commerce et Services dès Village (1 000),
 * Industrie et Énergie dès Bourg (5 000), Recherche dès Ville (15 000).
 */
export const NIVEAU_MIN_ACTIVITE: Record<Activite, number> = {
  residentiel: 0,
  loisirs: 0,
  commerce: 1,
  services: 1,
  industrie: 2,
  energie: 2,
  recherche: 3,
};

export function activitesDisponibles(niveau: number): Activite[] {
  return ACTIVITES.filter((a) => NIVEAU_MIN_ACTIVITE[a] <= niveau);
}

export type EtatJauge = "crise" | "fragile" | "equilibre" | "pointFort";

/** Lecture des couleurs (§3) : < 60 % crise, 60-90 % fragile, 90-120 % équilibré, > 120 % point fort. */
export function etatJauge(jauge: number): EtatJauge {
  if (jauge < 0.6) return "crise";
  if (jauge < 0.9) return "fragile";
  if (jauge <= 1.2) return "equilibre";
  return "pointFort";
}
