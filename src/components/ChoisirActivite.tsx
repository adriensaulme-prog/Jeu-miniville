"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { choisirActiviteVisite } from "@/app/villes/actions";
import type { Activite } from "@/lib/game/activites";
import { EMOJI_ACTIVITE } from "@/components/JaugesActivites";

/**
 * Choix de l'activité d'une visite (Jalon 17,
 * docs/SYSTEME-DEVELOPPEMENT.md §9 point 1) — séparé de
 * `VisiteAutomatique` à dessein : le panneau se rafraîchit très vite
 * après une visite (le framework revalide la page dès que la visite
 * serveur répond), bien avant qu'un joueur n'ait le temps de cliquer
 * dans un composant transitoire. Ce composant-ci lit l'activité
 * réellement enregistrée pour la dernière visite (donnée serveur, dans
 * la fenêtre de grâce de 5 minutes de `choisir_activite_visite()`) :
 * il survit donc à autant de rafraîchissements qu'il faut.
 */
export function ChoisirActivite({
  locale,
  villeId,
  activiteActuelle,
  verrouillee,
  activitesDisponibles,
}: {
  locale: Locale;
  villeId: string;
  /** Activité déjà attribuée à la visite la plus récente (aléatoire ou
   * déjà choisie), ou null si aucune visite récente ne peut plus être
   * modifiée (fenêtre de grâce écoulée, ou jamais visité). */
  activiteActuelle: Activite | null;
  /** Jalon 19 (docs/A-INTEGRER.md §20 B) : un choix explicite déjà fait
   * pour cette visite est définitif — plus de bouton "changer" une fois
   * vrai, même si la fenêtre de grâce de 5 minutes n'est pas écoulée. */
  verrouillee: boolean;
  activitesDisponibles: Activite[];
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [enCours, startTransition] = useTransition();

  if (!activiteActuelle) {
    return null;
  }

  function choisir(activite: Activite) {
    startTransition(async () => {
      await choisirActiviteVisite(villeId, activite);
      setOuvert(false);
      router.refresh();
    });
  }

  return (
    <div className="note">
      <p>
        {traduire(locale, "activite.choisie")} {EMOJI_ACTIVITE[activiteActuelle]}{" "}
        {traduire(locale, `activite.${activiteActuelle}`)}{" "}
        {!ouvert && !verrouillee && (
          <button type="button" className="btn small" onClick={() => setOuvert(true)}>
            {traduire(locale, "activite.changer")}
          </button>
        )}
      </p>
      {ouvert && !verrouillee && (
        <>
          <p>
            <b>{traduire(locale, "activite.choisir")}</b> — {traduire(locale, "activite.choisirNote")}
          </p>
          <div className="activites-choix">
            {activitesDisponibles.map((a) => (
              <button
                key={a}
                type="button"
                className="btn small activite-btn"
                disabled={enCours}
                onClick={() => choisir(a)}
              >
                <span className="activite-emoji" aria-hidden="true">
                  {EMOJI_ACTIVITE[a]}
                </span>
                {traduire(locale, `activite.${a}`)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
