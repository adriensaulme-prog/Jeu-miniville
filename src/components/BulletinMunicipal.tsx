import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { EMOJI_ACTIVITE } from "@/components/JaugesActivites";
import type { Activite } from "@/lib/game/activites";
import { typeTechnologie } from "@/lib/game/technologies";
import { typeMonument } from "@/lib/game/monuments";

export interface EvenementBulletin {
  id: string;
  type:
    | "manifestation"
    | "attaque_recue"
    | "megaprojet_construit"
    | "technologie_debloquee"
    | "monument_debloque"
    | "guerre";
  activite: Activite | null;
  type_action: "greve" | "contamination" | "propagande" | null;
  valeur: number | null;
  created_at: string;
}

/**
 * Bulletin municipal (Jalon 18, docs/SYSTEME-DEVELOPPEMENT.md §5/§6bis) :
 * dernières manifestations et attaques reçues par une ville. Purement
 * informatif — jamais de nombre codé en dur dans une chaîne traduite,
 * toujours interpolé en JSX autour des libellés traduits.
 */
export function BulletinMunicipal({ locale, evenements }: { locale: Locale; evenements: EvenementBulletin[] }) {
  const visibles = evenements.filter((e) => e.type !== "manifestation" || (e.valeur ?? 0) > 0);
  if (visibles.length === 0) {
    return null;
  }
  return (
    <div className="note">
      <b>{traduire(locale, "bulletin.titre")}</b>
      <ul className="bulletin-liste">
        {visibles.map((e) => (
          <li key={e.id}>
            {e.type === "manifestation" && e.activite ? (
              <>
                {traduire(locale, "bulletin.manifestation")} {EMOJI_ACTIVITE[e.activite]}{" "}
                {traduire(locale, `activite.${e.activite}`)} : −{e.valeur} {traduire(locale, "ville.population").toLowerCase()}
              </>
            ) : e.type === "attaque_recue" && e.type_action ? (
              <>
                {traduire(locale, `villes.${e.type_action}`)}
                {e.type_action === "greve" && e.valeur != null ? (
                  <> — {traduire(locale, "villes.antiVilleDureeBlocage").toLowerCase()} {Math.round(e.valeur * 10) / 10} h</>
                ) : e.valeur != null ? (
                  <> — −{e.valeur}</>
                ) : null}
              </>
            ) : e.type === "megaprojet_construit" && e.activite ? (
              <>
                {traduire(locale, "bulletin.megaprojetConstruit")} {EMOJI_ACTIVITE[e.activite]}{" "}
                {traduire(locale, `activite.${e.activite}`)}
              </>
            ) : e.type === "technologie_debloquee" && e.valeur != null && typeTechnologie(e.valeur) ? (
              <>
                {traduire(locale, "bulletin.technologieDebloquee")}{" "}
                {traduire(locale, `technologie.type.${typeTechnologie(e.valeur)!}`)}
              </>
            ) : e.type === "monument_debloque" && e.valeur != null && typeMonument(e.valeur) ? (
              <>
                {traduire(locale, "bulletin.monumentDebloque")}{" "}
                {traduire(locale, `monument.type.${typeMonument(e.valeur)!}`)}
              </>
            ) : e.type === "guerre" && e.valeur != null ? (
              <>
                {traduire(locale, "bulletin.guerre")} : −{e.valeur} {traduire(locale, "ville.population").toLowerCase()}
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
