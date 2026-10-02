import type { DictionaryKey } from "@/lib/i18n/dictionaries";

/**
 * Parcours de découverte des nouveaux joueurs (docs/A-INTEGRER.md §26 F).
 * Cinq étapes courtes, une idée chacune, dans l'ordre où une partie se
 * déroule : sa ville, visiter, choisir une activité, agir sur les
 * autres, les pays + les règles complètes. Les textes vivent dans le
 * dictionnaire (FR + EN), ici seulement leur ordre et les liens.
 */
export interface EtapeGuide {
  texte: DictionaryKey;
  lien?: { href: string; libelle: DictionaryKey };
}

export const ETAPES_GUIDE: readonly EtapeGuide[] = [
  { texte: "guide.etape1" },
  { texte: "guide.etape2", lien: { href: "/villes", libelle: "guide.lienVilles" } },
  { texte: "guide.etape3" },
  { texte: "guide.etape4" },
  { texte: "guide.etape5", lien: { href: "/regles", libelle: "guide.lienRegles" } },
];

/** Écrans du jeu où la carte s'affiche (pas sur l'accueil, la connexion, la création de ville ni les règles). */
const PAGES_DU_JEU = ["/ville", "/villes", "/jumelages", "/classement", "/palmares", "/pays", "/suivi"];
const ECRANS_DE_RATTRAPAGE = ["/ville/creer", "/ville/region", "/ville/noms"];

export function pageDuGuide(pathname: string | null): boolean {
  if (!pathname) return false;
  if (ECRANS_DE_RATTRAPAGE.some((p) => pathname === p || pathname.startsWith(p + "/"))) return false;
  return PAGES_DU_JEU.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Un compte est « nouveau » pendant ce délai après sa création. */
export const JOURS_NOUVEAU_JOUEUR = 14;

export function estNouveauJoueur(creeLe: string | undefined, maintenant: Date = new Date()): boolean {
  if (!creeLe) return false;
  const t = new Date(creeLe).getTime();
  if (Number.isNaN(t)) return false;
  return maintenant.getTime() - t < JOURS_NOUVEAU_JOUEUR * 24 * 60 * 60 * 1000;
}
