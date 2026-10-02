"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { ETAPES_GUIDE, pageDuGuide } from "@/lib/game/guide";

/** Clé localStorage : numéro d'étape en cours ("0".."n-1"), ou "fini". Absente = jamais vu. */
export const CLE_GUIDE = "jeu-miniville-guide";
/** Événement émis par « Revoir le guide » (page des règles) pour relancer sans recharger. */
export const EVENEMENT_RELANCER_GUIDE = "jeu-miniville:relancer-guide";

function lire(): string | null {
  try {
    return localStorage.getItem(CLE_GUIDE);
  } catch {
    return null;
  }
}
function ecrire(valeur: string) {
  try {
    localStorage.setItem(CLE_GUIDE, valeur);
  } catch {
    // Stockage indisponible (navigation privée) : le guide se rejouera, sans gravité.
  }
}

/**
 * Parcours de découverte des nouveaux joueurs (docs/A-INTEGRER.md §26 F) :
 * une petite carte non bloquante, étape par étape, plutôt qu'un mur de
 * règles. Affichée aux comptes récents (`nouveauJoueur`, créés il y a
 * moins de 14 jours) sur les écrans du jeu, tant qu'elle n'est pas
 * terminée ou passée. Progression mémorisée dans le navigateur
 * (localStorage, par appareil) : aucune donnée serveur ni migration.
 * « Revoir le guide » sur la page des règles la relance à tout moment.
 */
export function GuideDecouverte({ locale, nouveauJoueur }: { locale: Locale; nouveauJoueur: boolean }) {
  const pathname = usePathname();
  const [etape, setEtape] = useState<number | null>(null);

  useEffect(() => {
    const synchroniser = () => {
      const v = lire();
      if (v === "fini") return setEtape(null);
      if (v === null) return setEtape(nouveauJoueur ? 0 : null);
      const n = Number(v);
      setEtape(Number.isInteger(n) && n >= 0 && n < ETAPES_GUIDE.length ? n : null);
    };
    synchroniser();
    window.addEventListener(EVENEMENT_RELANCER_GUIDE, synchroniser);
    return () => window.removeEventListener(EVENEMENT_RELANCER_GUIDE, synchroniser);
  }, [nouveauJoueur]);

  if (etape === null || !pageDuGuide(pathname)) return null;
  const courante = ETAPES_GUIDE[etape];
  const derniere = etape === ETAPES_GUIDE.length - 1;

  function terminer() {
    ecrire("fini");
    setEtape(null);
  }
  function suivant() {
    if (derniere) return terminer();
    ecrire(String(etape! + 1));
    setEtape(etape! + 1);
  }

  return (
    <aside className="guide" role="note" aria-label={traduire(locale, "guide.titre")}>
      <p className="guide-etape">
        {traduire(locale, "guide.titre")} · {etape + 1}/{ETAPES_GUIDE.length}
      </p>
      <p className="guide-texte">{traduire(locale, courante.texte)}</p>
      {courante.lien ? (
        <Link href={courante.lien.href} className="guide-lien">
          {traduire(locale, courante.lien.libelle)} →
        </Link>
      ) : null}
      <div className="guide-actions">
        <button type="button" className="btn small" onClick={terminer}>
          {traduire(locale, "guide.passer")}
        </button>
        <button type="button" className="btn small primary" onClick={suivant}>
          {traduire(locale, derniere ? "guide.terminer" : "guide.suivant")}
        </button>
      </div>
    </aside>
  );
}
