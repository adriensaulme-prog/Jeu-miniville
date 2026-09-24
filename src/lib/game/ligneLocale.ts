import { heureDansLeFuseau, jourDeLAnnee, positionSoleil } from "./soleilVille";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

export interface ParametresPaysLocal {
  nom: string;
  latitude: number;
  longitude: number;
  fuseauHoraire: string;
}

/**
 * "France · 14:32 · jour" — même logique que la scène 3D (heure et
 * position du soleil réelles du pays de la ville, pas celles du
 * visiteur), affichée en texte sous le panneau de nom de ville. Porté
 * depuis docs/prototypes/maquette-ecrans.html (fonction localLine).
 */
export function ligneLocale(pays: ParametresPaysLocal, locale: Locale, maintenant = new Date()): string {
  const heure = heureDansLeFuseau(maintenant, pays.fuseauHoraire);
  const jour = jourDeLAnnee(heure.annee, heure.mois, heure.jour);
  const sp = positionSoleil(pays.latitude, pays.longitude, heure.decalageUtc, heure.heure, jour);

  const hh = String(Math.floor(heure.heure)).padStart(2, "0");
  const mm = String(Math.round((heure.heure % 1) * 60) % 60).padStart(2, "0");

  const avantMidi = heure.heure < 12;
  const cle =
    sp.elevation > 12
      ? "ciel.jour"
      : sp.elevation > -2
        ? avantMidi
          ? "ciel.leverDuSoleil"
          : "ciel.coucherDuSoleil"
        : sp.elevation > -10
          ? avantMidi
            ? "ciel.aube"
            : "ciel.crepuscule"
          : "ciel.nuit";

  return `${pays.nom} · ${hh}:${mm} · ${traduire(locale, cle)}`;
}
