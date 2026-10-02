"use client";

import { useRouter } from "next/navigation";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { CLE_GUIDE, EVENEMENT_RELANCER_GUIDE } from "./GuideDecouverte";

/**
 * « Revoir le guide de démarrage » (A-INTEGRER §26 F), sur la page des
 * règles : remet le parcours à l'étape 1 puis renvoie sur « Ma ville »
 * (la page des règles n'affiche pas la carte du guide). Sans effet de
 * bord si le visiteur n'est pas connecté : /ville le redirigera vers la
 * connexion, le guide attendra sa première page de jeu.
 */
export function RevoirGuide({ locale }: { locale: Locale }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn small"
      onClick={() => {
        try {
          localStorage.setItem(CLE_GUIDE, "0");
        } catch {
          // Stockage indisponible : la navigation a lieu, le guide ne se relancera pas.
        }
        window.dispatchEvent(new Event(EVENEMENT_RELANCER_GUIDE));
        router.push("/ville");
      }}
    >
      {traduire(locale, "guide.revoir")}
    </button>
  );
}
