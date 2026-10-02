/**
 * Règles sur les pseudos et les noms de ville (docs/A-INTEGRER.md §8,
 * règle ferme d'Adrien du 24/09/2026). L'UNICITÉ est garantie par la
 * base (index uniques sur nom_normalise(), migration 0035) ; ce module
 * porte les règles de FORMAT (longueur, noms réservés, mots interdits),
 * appliquées à l'entrée du serveur applicatif — pas dans creer_ville(),
 * que les specs e2e et les scripts d'amorçage appellent directement.
 *
 * normaliserNom() est la copie TypeScript de nom_normalise() (SQL) :
 * elle sert à comparer aux noms réservés et ne doit jamais diverger
 * (test de parité e2e dans tests/e2e/noms-uniques.spec.ts).
 */

const ACCENTS = "àáâãäåāăąçćčďđèéêëēĕėęěğìíîïĩīĭįıłñńňòóôõöøōŏőŕřśšşťţùúûüũūŭůűųýÿžźż";
const SANS_ACCENT = "aaaaaaaaaccc" + "ddeeeeeeeeegiiiiiiiiilnnnooooooooorrsssttuuuuuuuuuuyyzzz";

export function normaliserNom(nom: string): string {
  let s = nom.toLowerCase();
  let sortie = "";
  for (const c of s) {
    const i = ACCENTS.indexOf(c);
    sortie += i >= 0 ? SANS_ACCENT[i] : c;
  }
  s = sortie.replace(/œ/g, "oe").replace(/æ/g, "ae").replace(/ß/g, "ss");
  return s.replace(/[^a-z0-9]/g, "");
}

export const PSEUDO_MIN = 3;
export const PSEUDO_MAX = 20;
export const VILLE_MAX = 40;

/** Noms réservés (comparés après normalisation) : le jeu lui-même, l'administration. */
const NOMS_RESERVES = ["admin", "administrateur", "moderateur", "modo", "systeme", "system", "jeuminiville", "miniville"];

/** Courte liste de mots injurieux (proposition du §8) — volontairement minimale, à étoffer au besoin. */
const MOTS_INTERDITS = ["connard", "salope", "pute", "merde", "nazi", "hitler", "fuck", "shit", "nigger", "negre"];

export type ErreurNom = "nomCourt" | "nomLong" | "nomVide" | "nomReserve" | "nomInterdit";

function verifierBase(nom: string): ErreurNom | null {
  const n = normaliserNom(nom);
  if (n === "") return "nomVide";
  if (NOMS_RESERVES.includes(n)) return "nomReserve";
  if (MOTS_INTERDITS.some((m) => n.includes(m))) return "nomInterdit";
  return null;
}

export function validerPseudo(pseudo: string): ErreurNom | null {
  const p = pseudo.trim();
  if (p.length < PSEUDO_MIN) return "nomCourt";
  if (p.length > PSEUDO_MAX) return "nomLong";
  return verifierBase(p);
}

export function validerNomVille(nom: string): ErreurNom | null {
  const n = nom.trim();
  if (n.length > VILLE_MAX) return "nomLong";
  return verifierBase(n);
}
