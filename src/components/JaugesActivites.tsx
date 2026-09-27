import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { etatJauge, type Activite } from "@/lib/game/activites";

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
}: {
  locale: Locale;
  jauges: { activite: Activite; jauge: number }[];
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
            <span className="jauge-pct">
              {pourcentage}% · {traduire(locale, `activite.etat.${etat}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
