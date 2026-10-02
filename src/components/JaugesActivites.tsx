import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { etatJauge, type Activite } from "@/lib/game/activites";
import { BoutonVoirOu } from "@/components/BoutonVoirOu";
import { ENERGIE_PAR_INSTALLATION, ENERGIE_SEUIL_CENTRALE } from "@/lib/ville3d/constantes";
import { cleDe, emplacementCentrale, emplacementEnergie } from "@/lib/ville3d/emplacements";

export const EMOJI_ACTIVITE: Record<Activite, string> = {
  residentiel: "🏠",
  industrie: "🏭",
  commerce: "🛒",
  loisirs: "🌳",
  services: "🏥",
  energie: "⚡",
  recherche: "🔬",
};

/**
 * Les 7 jauges de développement (docs/SYSTEME-DEVELOPPEMENT.md §3) —
 * affichage seul au Jalon 17, aucun effet de jeu encore branché dessus.
 */
export function JaugesActivites({
  locale,
  jauges,
  energie,
}: {
  locale: Locale;
  jauges: { activite: Activite; jauge: number }[];
  /** A-INTEGRER §25 : si fourni et que la ville a déjà des installations d'Énergie
   * (élan ≥ une installation), un bouton « Voir où il est » amène la caméra dessus. */
  energie?: { cleVille: string; elan: number };
}) {
  return (
    <div className="jauges" aria-label={traduire(locale, "activite.jauges")}>
      {jauges.map(({ activite, jauge }) => {
        const etat = etatJauge(jauge);
        const pourcentage = Math.round(jauge * 100);
        return (
          <div key={activite} className="jauge">
            <span className="jauge-nom">
              {EMOJI_ACTIVITE[activite]} {traduire(locale, `activite.${activite}`)}
              {activite === "energie" && energie && energie.elan >= ENERGIE_PAR_INSTALLATION ? (
                <>
                  {" "}
                  <BoutonVoirOu
                    {...(energie.elan >= ENERGIE_SEUIL_CENTRALE
                      ? emplacementCentrale(cleDe(energie.cleVille))
                      : emplacementEnergie(cleDe(energie.cleVille), 0))}
                    libelle="📍"
                    titre={`${traduire(locale, "monument.voir")} : ${traduire(locale, "activite.energie")}`}
                    className="btn small jauge-voir"
                  />
                </>
              ) : null}
            </span>
            <div
              className="bar"
              role="progressbar"
              aria-label={traduire(locale, `activite.${activite}`)}
              aria-valuemin={0}
              aria-valuemax={150}
              aria-valuenow={Math.min(150, pourcentage)}
            >
              <i className={etat} style={{ width: `${Math.min(100, (pourcentage / 150) * 100)}%` }} />
            </div>
            <span className="jauge-pct" title={`${pourcentage}%`}>
              {traduire(locale, `activite.etat.${etat}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
