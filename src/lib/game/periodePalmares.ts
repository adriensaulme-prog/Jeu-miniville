export type Periode = "jour" | "semaine" | "mois" | "toujours";

/**
 * Date de début (UTC, "YYYY-MM-DD") pour une période de palmarès — null
 * = depuis toujours. Fenêtres glissantes (aujourd'hui inclus), pas de
 * mois calendaire : plus simple, cohérent avec la fenêtre glissante de
 * 24h déjà utilisée par la protection anti-harcèlement (Jalon 4).
 */
export function depuisPourPeriode(periode: Periode, maintenant: Date = new Date()): string | null {
  if (periode === "toujours") return null;
  const joursEnArriere = periode === "jour" ? 0 : periode === "semaine" ? 6 : 29;
  const jourUtc = Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate());
  const depuis = new Date(jourUtc - joursEnArriere * 24 * 60 * 60 * 1000);
  return depuis.toISOString().slice(0, 10);
}
