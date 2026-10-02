"use client";

import { useState } from "react";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

/**
 * Partage un lien public (A-INTEGRER §26 C). Sur mobile, ouvre la feuille de
 * partage du système (Web Share API) ; ailleurs, copie le lien dans le
 * presse-papiers et le confirme. `chemin` est relatif (« /v/<id> ») : le
 * lien complet est construit avec l'adresse courante du site.
 */
export function BoutonPartager({
  locale,
  chemin,
  titre,
  libelle,
  className = "btn small",
}: {
  locale: Locale;
  chemin: string;
  /** Texte accompagnant le lien dans la feuille de partage. */
  titre: string;
  libelle?: string;
  className?: string;
}) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const url = new URL(chemin, window.location.origin).toString();
    try {
      if (typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches) {
        await navigator.share({ title: titre, text: titre, url });
        return;
      }
    } catch (e) {
      // Partage annulé par la personne : rien à faire (pas de repli sur la copie).
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : affiche le lien à copier à la main.
      window.prompt(traduire(locale, "partage.copierManuel"), url);
      return;
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  }

  return (
    <button type="button" className={className} onClick={partager}>
      {copie ? traduire(locale, "partage.lienCopie") : (libelle ?? traduire(locale, "partage.partager"))}
    </button>
  );
}
