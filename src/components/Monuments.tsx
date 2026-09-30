import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { seuilMonument, typeMonument } from "@/lib/game/monuments";

/**
 * Monuments d'influence (docs/A-INTEGRER.md §19, Jalon 20 3/3) : se
 * débloquent automatiquement selon le record d'influence, affichage en
 * lecture seule (pas de choix, comme les technologies).
 */
export function Monuments({
  locale,
  paliersDebloques,
  influenceMax,
}: {
  locale: Locale;
  paliersDebloques: number;
  influenceMax: number;
}) {
  const prochainType = typeMonument(paliersDebloques);
  if (paliersDebloques === 0 && !prochainType) {
    return null;
  }
  return (
    <div className="note">
      <b>{traduire(locale, "monument.titre")}</b>
      <ul className="bulletin-liste">
        {Array.from({ length: paliersDebloques }, (_, palier) => {
          const type = typeMonument(palier);
          return type ? <li key={palier}>{traduire(locale, `monument.type.${type}`)}</li> : null;
        })}
        {prochainType && (
          <li>
            {traduire(locale, "monument.prochain")} {traduire(locale, `monument.type.${prochainType}`)} —{" "}
            {influenceMax}/{seuilMonument(paliersDebloques)}
          </li>
        )}
      </ul>
    </div>
  );
}
