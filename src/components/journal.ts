import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { libelleEvenement, type EvenementBulletin } from "@/components/evenements";
import type { Activite } from "@/lib/game/activites";

/**
 * Journal mondial et notifications (docs/A-INTEGRER.md §26 A et B) : une
 * ligne = un fait lu dans les tables existantes par journal_monde() ou
 * notifications_joueur() (migration 0042), et son texte lisible. Les
 * libellés sont des modèles du dictionnaire avec des {marques} remplacées
 * ici — jamais de nombre ni de nom codé en dur dans une chaîne traduite.
 */
export type TypeLigneJournal =
  | "president"
  | "president_acquis"
  | "president_perdu"
  | "premier_mondial"
  | "premier_mondial_acquis"
  | "premier_mondial_perdu"
  | "ville_en_crise"
  | "guerre_declaree"
  | "guerre_terminee"
  | "alliance"
  | EvenementBulletin["type"];

export interface LigneJournal {
  id: string;
  type: TypeLigneJournal;
  quand: string;
  ville_id: string | null;
  ville_nom: string | null;
  country_id: string | null;
  cible_country_id: string | null;
  autre_ville_nom: string | null;
  valeur: number | null;
  activite: Activite | null;
  type_action: "greve" | "contamination" | "propagande" | null;
  resultat: "attaquant" | "defenseur" | "egalite" | null;
  /** Seulement pour les notifications. */
  non_lue?: boolean;
}

function remplacer(modele: string, valeurs: Record<string, string>): string {
  return modele.replace(/\{(\w+)\}/g, (_, cle: string) => valeurs[cle] ?? "");
}

/**
 * Texte d'une ligne, ou null si elle n'est pas exploitable. `nomPays`
 * traduit un code pays ; `monPays` (notifications) permet de dire « ton
 * pays » plutôt que le nom.
 */
export function libelleJournal(
  locale: Locale,
  l: LigneJournal,
  nomPays: (id: string) => string,
  monPays?: string | null
): string | null {
  const t = (cle: string) => traduire(locale, cle as never);
  const pays = l.country_id ? nomPays(l.country_id) : "";
  const cible = l.cible_country_id ? nomPays(l.cible_country_id) : "";
  const v = { ville: l.ville_nom ?? "", autre: l.autre_ville_nom ?? "", pays, cible, nb: String(l.valeur ?? "") };

  switch (l.type) {
    case "president":
      // Une ville qui reprend la tête après le passage d'une ville aujourd'hui supprimée aurait
      // « elle-même » pour prédécesseur : pas une nouvelle, on l'écarte.
      if (!l.autre_ville_nom || l.autre_ville_nom === l.ville_nom) return null;
      return remplacer(t("journal.president"), v);
    case "president_acquis":
      return remplacer(t("journal.presidentAcquis"), v);
    case "president_perdu":
      return remplacer(
        t(l.autre_ville_nom && l.autre_ville_nom !== l.ville_nom ? "journal.presidentPerdu" : "journal.presidentPerduSans"),
        v
      );
    case "premier_mondial":
      if (!l.autre_ville_nom || l.autre_ville_nom === l.ville_nom) return null;
      return remplacer(t("journal.premierMondial"), v);
    case "premier_mondial_acquis":
      return remplacer(t("journal.premierMondialAcquis"), v);
    case "premier_mondial_perdu":
      return remplacer(
        t(
          l.autre_ville_nom && l.autre_ville_nom !== l.ville_nom
            ? "journal.premierMondialPerdu"
            : "journal.premierMondialPerduSans"
        ),
        v
      );
    case "ville_en_crise":
      if (l.valeur == null || !l.ville_nom) return null;
      return remplacer(t("journal.villeEnCrise"), v);
    case "guerre_declaree":
      if (monPays && l.country_id === monPays) return remplacer(t("journal.guerreNotreAttaque"), v);
      if (monPays && l.cible_country_id === monPays) return remplacer(t("journal.guerreNousAttaque"), v);
      return remplacer(t("journal.guerreDeclaree"), v);
    case "guerre_terminee": {
      const cle =
        l.resultat === "attaquant"
          ? "journal.guerreVictoireAttaquant"
          : l.resultat === "defenseur"
            ? "journal.guerreVictoireDefenseur"
            : "journal.guerreEgalite";
      return remplacer(t(cle), v);
    }
    case "alliance":
      return remplacer(t("journal.alliance"), v);
    default: {
      // Événements de ville (réussites, attaques, manifestations…) : texte partagé avec le bulletin.
      const texte = libelleEvenement(locale, {
        id: l.id,
        type: l.type,
        activite: l.activite,
        type_action: l.type_action,
        valeur: l.valeur,
        created_at: l.quand,
      });
      if (!texte) return null;
      // Dans le journal public on nomme la ville ; dans les notifications (ma ville) c'est inutile.
      return l.non_lue === undefined && l.ville_nom ? `${l.ville_nom} — ${texte}` : texte;
    }
  }
}
