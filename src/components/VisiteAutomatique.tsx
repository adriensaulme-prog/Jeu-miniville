"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { visiterVille } from "@/app/villes/actions";

const DELAI_AVANT_VISITE_MS = 2500;
const DELAI_AVANT_REFRESH_MS = 1200;

/**
 * Compte une visite automatiquement, sans bouton à cliquer — demande
 * d'Adrien (docs/A-INTEGRER.md §15) : « il ne faudrait pas avoir à
 * cliquer, ça devrait être automatique sur chaque ville ». Utilisé à la
 * fois pour visiter une autre ville et, depuis le Jalon 13 ter
 * (docs/A-INTEGRER.md §16), sa propre ville.
 *
 * Délai de {@link DELAI_AVANT_VISITE_MS} avant de déclencher l'appel
 * réel : point laissé à l'appréciation de Claude Code par Adrien
 * (« risque qu'une visite se déclenche par simple curiosité »). Choix
 * retenu : un court délai après l'affichage du panneau de détail
 * plutôt qu'un geste supplémentaire — le clic qui ouvre déjà le
 * panneau (depuis la liste, ou "Ma ville" dans la nav) reste le geste
 * volontaire ; le délai absorbe seulement les allers-retours trop
 * rapides (ouvrir puis repartir aussitôt ne compte pas, le minuteur est
 * annulé si le composant est démonté avant la fin).
 *
 * Jalon 17 (docs/SYSTEME-DEVELOPPEMENT.md §9 point 1) : le choix de
 * l'activité n'est PAS géré ici — c'est une action séparée et
 * persistante (`ChoisirActivite.tsx`, pilotée par les données serveur,
 * fenêtre de grâce de 5 minutes) plutôt que rattachée à ce composant
 * transitoire. Raison technique constatée en testant : le rafraîchissement
 * du panneau après une visite arrive très vite (le framework revalide la
 * page dès que l'action serveur répond), trop tôt pour laisser une vraie
 * fenêtre de choix dans CE composant sans la manquer.
 *
 * Jalon 18 : le gain n'est plus garanti (crise du Résidentiel, voir
 * docs/SYSTEME-DEVELOPPEMENT.md §4) — le message de confirmation
 * affiche donc le gain RÉEL renvoyé par visiter_ville(), jamais celui
 * annoncé avant la visite (qui reste une estimation de base).
 */
export function VisiteAutomatique({
  locale,
  villeId,
  peutVisiter,
}: {
  locale: Locale;
  villeId: string;
  peutVisiter: boolean;
}) {
  const router = useRouter();
  const [comptee, setComptee] = useState(false);
  const [gainReel, setGainReel] = useState(0);

  useEffect(() => {
    if (!peutVisiter) {
      return;
    }
    setComptee(false);
    const minuteur = setTimeout(() => {
      visiterVille(villeId).then((resultat) => {
        if (resultat.succes) {
          setGainReel(resultat.gain);
          setComptee(true);
          // Laisse le message de confirmation le temps d'être vu avant
          // que router.refresh() ne fasse repasser le panneau côté
          // serveur (qui basculera alors sur le compte à rebours).
          setTimeout(() => router.refresh(), DELAI_AVANT_REFRESH_MS);
        }
      });
    }, DELAI_AVANT_VISITE_MS);
    return () => clearTimeout(minuteur);
  }, [villeId, peutVisiter, router]);

  if (!comptee) {
    return null;
  }
  return (
    <p className="note">
      {gainReel > 0
        ? `${traduire(locale, "villes.visiteComptee")} +${gainReel} ${traduire(locale, "ville.population").toLowerCase()}.`
        : traduire(locale, "villes.visiteComptSansGain")}
    </p>
  );
}
