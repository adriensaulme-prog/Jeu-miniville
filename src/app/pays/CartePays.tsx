import { couleurRegion } from "@/lib/game/couleurRegion";

export type CarteRegionDonnees = { id: string; path: string; cx: number; cy: number };

export type MarqueurVille = {
  regionId: string;
  villeId: string;
  nom: string;
  estMoi: boolean;
  estPresident: boolean;
  estPremiereDeRegion: boolean;
};

/**
 * Carte illustrée du pays (Jalon 9 ter, docs/CARTE-DU-PAYS.md) :
 * remplace le fond 3D sur la page Pays uniquement — voir le commentaire
 * dans page.tsx pour comment elle se superpose au canvas partagé
 * (Jalon 7) sans le démonter. Composant serveur, aucun JS client : les
 * pastilles de villes sont de vrais liens SVG (<a href>, pas
 * next/link — un <a> HTML dans un <svg> perd son routage
 * intercepté ; un rechargement complet pour un simple clic sur une
 * carte n'est pas un problème). Pas d'interaction sur les régions
 * elles-mêmes dans cette première version (point ouvert,
 * DECISIONS.md §10).
 */
export function CartePays({
  viewBox,
  regions,
  populationParRegion,
  populationMaxRegion,
  marqueurs,
}: {
  viewBox: string;
  regions: CarteRegionDonnees[];
  populationParRegion: Record<string, number>;
  populationMaxRegion: number;
  marqueurs: MarqueurVille[];
}) {
  const marqueurParRegion = new Map(marqueurs.map((m) => [m.regionId, m]));

  return (
    <div className="carte-pays">
      <svg viewBox={viewBox} className="carte-pays-svg" role="img" aria-label="Carte du pays">
        {regions.map((r) => (
          <path
            key={r.id}
            d={r.path}
            fill={couleurRegion(populationParRegion[r.id] ?? 0, populationMaxRegion)}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        ))}
        {regions.map((r) => {
          const m = marqueurParRegion.get(r.id);
          if (!m) return null;
          const href = m.estMoi ? "/ville" : `/villes?ville=${m.villeId}`;
          return (
            <a key={`marqueur-${r.id}`} href={href} aria-label={m.nom}>
              <title>{m.nom}</title>
              <circle cx={r.cx} cy={r.cy} r={13} fill="transparent" />
              {m.estPresident ? (
                <circle cx={r.cx} cy={r.cy} r={9} fill="#d4a017" stroke="#fff" strokeWidth={1.5} />
              ) : null}
              {m.estPremiereDeRegion && !m.estPresident ? (
                <circle cx={r.cx} cy={r.cy} r={6} fill="#8a6d1a" stroke="#fff" strokeWidth={1.2} />
              ) : null}
              {m.estMoi ? (
                <circle cx={r.cx} cy={r.cy} r={11} fill="none" stroke="var(--accent)" strokeWidth={2.5} />
              ) : null}
            </a>
          );
        })}
      </svg>
    </div>
  );
}
