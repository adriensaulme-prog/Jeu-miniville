import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { seuilTechnologie, typeTechnologie } from "@/lib/game/technologies";

/**
 * Technologies de Recherche (docs/SYSTEME-DEVELOPPEMENT.md §6, Jalon
 * 20 2/3) : se débloquent automatiquement (pas de choix, contrairement
 * aux mégaprojets), affichage en lecture seule — la liste de celles
 * déjà débloquées, et la progression vers la prochaine si son effet
 * visuel est déjà défini (paliers au-delà du 5e, pas encore).
 */
export function Technologies({
  locale,
  paliersDebloques,
  pointsRecherche,
}: {
  locale: Locale;
  paliersDebloques: number;
  pointsRecherche: number;
}) {
  const prochainType = typeTechnologie(paliersDebloques);
  if (paliersDebloques === 0 && !prochainType) {
    return null;
  }
  return (
    <div className="note">
      <b>{traduire(locale, "technologie.titre")}</b>
      <ul className="bulletin-liste">
        {Array.from({ length: paliersDebloques }, (_, palier) => {
          const type = typeTechnologie(palier);
          return type ? <li key={palier}>{traduire(locale, `technologie.type.${type}`)}</li> : null;
        })}
        {prochainType && (
          <li>
            {traduire(locale, "technologie.prochaine")} {traduire(locale, `technologie.type.${prochainType}`)} —{" "}
            {pointsRecherche}/{seuilTechnologie(paliersDebloques)}
          </li>
        )}
      </ul>
    </div>
  );
}
