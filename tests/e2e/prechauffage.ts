/**
 * Préchauffe le serveur de dev avant la suite e2e : en développement,
 * Next.js compile chaque page à la PREMIÈRE requête. Lancé à froid, le
 * premier login de chaque spec attendait la compilation de /ville
 * (Three.js, catalogue de bâtiments...) et dépassait le délai de 5 s de
 * `toHaveURL` — des échecs en cascade attribués à tort à une
 * « flakiness de connexion » (docs/DECISIONS.md §4, journal du
 * préchauffage). Une page non connectée redirige vers /connexion mais
 * est bien compilée avant, ce qui suffit à chauffer le serveur.
 */
const PAGES = [
  "/",
  "/connexion",
  "/inscription",
  "/ville",
  "/ville/creer",
  "/ville/region",
  "/villes",
  "/jumelages",
  "/classement",
  "/palmares",
  "/pays",
];

export default async function globalSetup() {
  const base = "http://localhost:3000";
  for (const chemin of PAGES) {
    try {
      await fetch(base + chemin, { redirect: "manual", signal: AbortSignal.timeout(90_000) });
    } catch {
      // Une page qui ne répond pas ici sera de toute façon testée (et
      // son échec expliqué) par la spec concernée.
    }
  }
}
