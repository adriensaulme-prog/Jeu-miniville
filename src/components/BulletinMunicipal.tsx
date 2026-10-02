import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { BoutonPartager } from "@/components/BoutonPartager";
import { cheminPartage, evenementPartageable, libelleEvenement, type EvenementBulletin } from "@/components/evenements";

export type { EvenementBulletin };

/**
 * Bulletin municipal (Jalon 18, docs/SYSTEME-DEVELOPPEMENT.md §5/§6bis) :
 * dernières manifestations et attaques reçues par une ville. Purement
 * informatif — le texte de chaque événement vient de libelleEvenement()
 * (partagé avec la page publique d'une ville, A-INTEGRER §26 C). Si
 * `villeId` est fourni, les réussites (mégaprojet, technologie, monument)
 * ont un bouton « Partager » qui copie le lien public de l'événement.
 */
export function BulletinMunicipal({
  locale,
  evenements,
  villeId,
}: {
  locale: Locale;
  evenements: EvenementBulletin[];
  villeId?: string;
}) {
  const visibles = evenements.filter((e) => e.type !== "manifestation" || (e.valeur ?? 0) > 0);
  if (visibles.length === 0) {
    return null;
  }
  return (
    <div className="note">
      <b>{traduire(locale, "bulletin.titre")}</b>
      <ul className="bulletin-liste">
        {visibles.map((e) => {
          const texte = libelleEvenement(locale, e);
          return (
            <li key={e.id}>
              {texte}
              {villeId && texte && evenementPartageable(e) ? (
                <>
                  {" "}
                  <BoutonPartager
                    locale={locale}
                    chemin={cheminPartage(villeId, e.id)}
                    titre={texte}
                    className="btn small partage-evenement"
                  />
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
