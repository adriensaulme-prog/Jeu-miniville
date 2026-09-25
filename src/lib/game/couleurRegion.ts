/**
 * Couleur de remplissage d'une région sur la carte du pays (Jalon 9
 * ter) : une seule teinte (rouge panneau, --accent), plus marquée si la
 * région est plus peuplée — pas d'arc-en-ciel (docs/CARTE-DU-PAYS.md
 * §2). Une région sans habitant reste neutre.
 */
export function couleurRegion(population: number, populationMaxRegion: number): string {
  if (populationMaxRegion <= 0 || population <= 0) return "#e4e1dc";
  const proportion = Math.min(1, population / populationMaxRegion);
  // Interpolation entre un ton neutre clair et l'accent rouge panneau
  // (#c23b2c), par racine carrée pour que les petites régions restent
  // visibles (une échelle linéaire écraserait tout sauf la plus grande).
  const t = Math.sqrt(proportion);
  const de = { r: 0xe4, g: 0xe1, b: 0xdc };
  const vers = { r: 0xc2, g: 0x3b, b: 0x2c };
  const melange = (a: number, b: number) => Math.round(a + (b - a) * t);
  const r = melange(de.r, vers.r);
  const g = melange(de.g, vers.g);
  const b = melange(de.b, vers.b);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
