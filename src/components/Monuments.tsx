import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { CATALOGUE_MONUMENTS, seuilMonument } from "@/lib/game/monuments";
import { cleDe, emplacementMonument } from "@/lib/ville3d/emplacements";
import { BoutonVoirOu } from "./BoutonVoirOu";

/**
 * Catalogue des monuments d'influence (docs/A-INTEGRER.md §19 et §25) :
 * les 16 paliers, chacun débloqué ou verrouillé (avec son seuil), et pour
 * chaque monument débloqué un bouton « Voir où il est » qui amène la
 * caméra 3D dessus. Les monuments se débloquent tout seuls selon le
 * record d'influence (pas de choix, comme les technologies).
 *
 * `cleVille` : la graine de la ville dessinée (son id), pour retrouver
 * l'emplacement exact du monument — même fonction que celle du rendu 3D
 * (emplacements.ts), donc jamais de décalage.
 */
export function Monuments({
  locale,
  cleVille,
  paliersDebloques,
  influenceMax,
}: {
  locale: Locale;
  cleVille: string;
  paliersDebloques: number;
  influenceMax: number;
}) {
  const cle = cleDe(cleVille);
  const nf = new Intl.NumberFormat(locale);
  return (
    <details className="note catalogue-monuments">
      <summary>
        <b>{traduire(locale, "monument.titre")}</b> · {paliersDebloques}/{CATALOGUE_MONUMENTS.length}
      </summary>
      <ul className="catalogue-liste">
        {CATALOGUE_MONUMENTS.map((palier, i) => {
          const nom = traduire(locale, `monument.type.${palier.type}`);
          const debloque = i < paliersDebloques;
          const prochain = i === paliersDebloques;
          if (debloque) {
            const { x, z } = emplacementMonument(cle, i);
            return (
              <li key={palier.type} className="debloque">
                <span>
                  ✓ {nom}
                </span>
                <BoutonVoirOu
                  x={x}
                  z={z}
                  libelle={traduire(locale, "monument.voir")}
                  titre={`${traduire(locale, "monument.voir")} : ${nom}`}
                />
              </li>
            );
          }
          return (
            <li key={palier.type} className="verrouille">
              <span>
                🔒 {nom}
              </span>
              <span>
                {prochain ? `${nf.format(influenceMax)} / ` : ""}
                {nf.format(seuilMonument(i) ?? 0)} {traduire(locale, "monument.influence")}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
