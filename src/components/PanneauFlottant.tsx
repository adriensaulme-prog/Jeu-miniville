"use client";

import { useEffect, useState, type ReactNode } from "react";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

const CLE_SESSION = "jeu-miniville-panneau-reduit";

/**
 * Panneau flottant (`.dock-float`) avec une poignée pour le réduire sur
 * mobile — retour de test d'Adrien (docs/A-INTEGRER.md §14) : sur petit
 * écran, le panneau pouvait occuper jusqu'à 55 % de la hauteur sans
 * aucun moyen de le rétracter pour voir la ville derrière. La poignée
 * n'a d'effet visuel qu'en mobile (media query dans globals.css) ; sur
 * desktop, ce composant se comporte comme un simple conteneur.
 *
 * État mémorisé en sessionStorage (partagé entre toutes les pages,
 * perdu à la fermeture de l'onglet — demande explicite d'Adrien de ne
 * pas le garder au-delà).
 */
export function PanneauFlottant({
  locale,
  className,
  ariaLabel,
  children,
}: {
  locale: Locale;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    try {
      setReduit(sessionStorage.getItem(CLE_SESSION) === "1");
    } catch {
      // sessionStorage indisponible (navigation privée, etc.) : reste ouvert.
    }
  }, []);

  function basculer() {
    setReduit((etat) => {
      const nouvelEtat = !etat;
      try {
        sessionStorage.setItem(CLE_SESSION, nouvelEtat ? "1" : "0");
      } catch {
        // pas grave, juste pas mémorisé pour la suite de la session.
      }
      return nouvelEtat;
    });
  }

  return (
    <div className={`${className}${reduit ? " reduit" : ""}`} aria-label={ariaLabel}>
      <button
        type="button"
        className="dock-poignee"
        onClick={basculer}
        aria-label={traduire(locale, reduit ? "panneau.agrandir" : "panneau.reduire")}
      >
        <span aria-hidden="true" />
      </button>
      <div className="dock-contenu">{children}</div>
    </div>
  );
}
