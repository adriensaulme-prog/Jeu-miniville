"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { choisirMegaprojet } from "@/app/villes/actions";
import { optionsPalier, coutMegaprojet, type TypeMegaprojet } from "@/lib/game/megaprojets";
import { EMOJI_ACTIVITE } from "@/components/JaugesActivites";
import { BoutonVoirOu } from "@/components/BoutonVoirOu";
import { cleDe, emplacementMegaprojet } from "@/lib/ville3d/emplacements";

export interface EtatMegaprojet {
  palier: number;
  type: TypeMegaprojet;
  activite: string;
  statut: "en_chantier" | "construit";
  points: number;
  coutPoints: number;
  materiaux: number;
  coutMateriaux: number;
  revenus: number;
  coutRevenus: number;
}

function Progres({ valeur, cible }: { valeur: number; cible: number }) {
  const pct = Math.min(100, Math.round((Math.max(0, valeur) / Math.max(1, cible)) * 100));
  return (
    <div className="bar" aria-hidden="true">
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Mégaprojets du maire (docs/SYSTEME-DEVELOPPEMENT.md §6, Jalon 20
 * 1/3) : les chantiers déjà choisis (en cours ou construits) et, pour
 * le maire seulement, un choix à faire dès qu'un nouveau palier de
 * population est débloqué.
 */
export function Megaprojets({
  locale,
  villeId,
  estMaire,
  nbOuverts,
  chantiers,
}: {
  locale: Locale;
  villeId: string;
  estMaire: boolean;
  nbOuverts: number;
  chantiers: EtatMegaprojet[];
}) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();

  if (nbOuverts === 0) {
    return null;
  }

  function choisir(palier: number, type: TypeMegaprojet) {
    startTransition(async () => {
      await choisirMegaprojet(villeId, palier, type);
      router.refresh();
    });
  }

  const parPalier = new Map(chantiers.map((c) => [c.palier, c]));

  return (
    <div className="note">
      <b>{traduire(locale, "megaprojet.titre")}</b>
      <ul className="bulletin-liste">
        {Array.from({ length: nbOuverts }, (_, palier) => {
          const chantier = parPalier.get(palier);
          if (!chantier) {
            return (
              <li key={palier}>
                {estMaire ? (
                  <>
                    <p>{traduire(locale, "megaprojet.aChoisir")}</p>
                    <div className="activites-choix">
                      {optionsPalier(palier).map((o) => (
                        <button
                          key={o.type}
                          type="button"
                          className="btn small activite-btn"
                          disabled={enCours}
                          onClick={() => choisir(palier, o.type)}
                        >
                          <span className="activite-emoji" aria-hidden="true">
                            {EMOJI_ACTIVITE[o.activite]}
                          </span>
                          {traduire(locale, `megaprojet.type.${o.type}`)}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>{traduire(locale, "megaprojet.enAttenteDuMaire")}</p>
                )}
              </li>
            );
          }
          const cout = coutMegaprojet(chantier.palier);
          return (
            <li key={palier}>
              <span className="activite-emoji" aria-hidden="true">
                {EMOJI_ACTIVITE[chantier.activite as keyof typeof EMOJI_ACTIVITE]}
              </span>{" "}
              {traduire(locale, `megaprojet.type.${chantier.type}`)} —{" "}
              {chantier.statut === "construit"
                ? traduire(locale, "megaprojet.construit")
                : traduire(locale, "megaprojet.enChantier")}
              {chantier.statut === "construit" ? (
                <>
                  {" "}
                  <BoutonVoirOu
                    {...emplacementMegaprojet(cleDe(villeId), chantier.palier)}
                    libelle={traduire(locale, "monument.voir")}
                    titre={`${traduire(locale, "monument.voir")} : ${traduire(locale, `megaprojet.type.${chantier.type}`)}`}
                  />
                </>
              ) : null}
              {chantier.statut === "en_chantier" && (
                <div>
                  <p>
                    {traduire(locale, "megaprojet.points")} {chantier.points}/{cout.points}
                  </p>
                  <Progres valeur={chantier.points} cible={cout.points} />
                  <p>
                    {traduire(locale, "megaprojet.materiaux")} {Math.max(0, chantier.materiaux)}/{cout.materiaux}
                  </p>
                  <Progres valeur={chantier.materiaux} cible={cout.materiaux} />
                  <p>
                    {traduire(locale, "megaprojet.revenus")} {Math.max(0, chantier.revenus)}/{cout.revenus}
                  </p>
                  <Progres valeur={chantier.revenus} cible={cout.revenus} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
