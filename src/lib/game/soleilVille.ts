/**
 * Position du soleil à l'heure réelle du pays d'une ville (Jalon 6bis,
 * docs/DECISIONS.md §8) — porté depuis
 * docs/prototypes/prototype-ville-3d.html (fonctions zoneParts/solar/
 * lighting), pur et sans dépendance WebGL, donc testable directement.
 *
 * Le soleil suit l'heure et la date réelles du pays de la ville, pas
 * celles du visiteur : une ville japonaise visitée depuis Paris à 17h
 * est donc en pleine nuit chez elle.
 */

const D2R = Math.PI / 180;

export interface HeureLocale {
  annee: number;
  mois: number; // 1-12
  jour: number;
  heure: number; // 0-24, fraction incluse
  decalageUtc: number; // heures, quart d'heure près
}

/** Heure locale d'un fuseau IANA (ex. "Europe/Paris") pour une date donnée. */
export function heureDansLeFuseau(date: Date, fuseauHoraire: string): HeureLocale {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: fuseauHoraire,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parties: Record<string, string> = {};
  for (const p of f.formatToParts(date)) parties[p.type] = p.value;

  const annee = Number(parties.year);
  const mois = Number(parties.month);
  const jour = Number(parties.day);
  const h = Number(parties.hour) % 24;
  const mi = Number(parties.minute);
  const s = Number(parties.second);
  const commeUTC = Date.UTC(annee, mois - 1, jour, h, mi, s);
  const decalageUtc = Math.round(((commeUTC - date.getTime()) / 36e5) * 4) / 4;

  return { annee, mois, jour, heure: h + mi / 60 + s / 3600, decalageUtc };
}

export interface PositionSoleil {
  /** Élévation au-dessus de l'horizon, en degrés (négatif = sous l'horizon). */
  elevation: number;
  /** Azimut en degrés, depuis le nord, vers l'est. */
  azimut: number;
}

/**
 * Position réelle du soleil pour une latitude/longitude, à une heure
 * locale (fraction de 0 à 24) et un jour de l'année (0-365).
 */
export function positionSoleil(
  latitude: number,
  longitude: number,
  decalageUtc: number,
  heureLocale: number,
  jourDeLAnnee: number
): PositionSoleil {
  const lat = latitude * D2R;
  const declinaison = 23.44 * D2R * Math.sin((2 * Math.PI * (284 + jourDeLAnnee)) / 365);
  const heureSolaire = heureLocale - decalageUtc + longitude / 15;
  const angleHoraire = (heureSolaire - 12) * 15 * D2R;
  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(declinaison) +
      Math.cos(lat) * Math.cos(declinaison) * Math.cos(angleHoraire)
  );
  let azimut = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        (Math.sin(declinaison) - Math.sin(elevation) * Math.sin(lat)) /
          (Math.cos(elevation) * Math.cos(lat))
      )
    )
  );
  if (angleHoraire > 0) azimut = 2 * Math.PI - azimut;
  return { elevation: elevation / D2R, azimut: azimut / D2R };
}

/** Jour de l'année (0-365) pour une date locale, sans dépendre du fuseau du visiteur. */
export function jourDeLAnnee(annee: number, mois: number, jour: number): number {
  return Math.floor((Date.UTC(annee, mois - 1, jour) - Date.UTC(annee, 0, 0)) / 864e5);
}

export type MomentDeLaJournee = "jour" | "lever_coucher" | "aube_crepuscule" | "nuit";

/** Catégorise une élévation solaire pour l'affichage ("Jour", "Nuit"...). */
export function momentDeLaJournee(elevationDeg: number): MomentDeLaJournee {
  if (elevationDeg > 12) return "jour";
  if (elevationDeg > -2) return "lever_coucher";
  if (elevationDeg > -10) return "aube_crepuscule";
  return "nuit";
}
