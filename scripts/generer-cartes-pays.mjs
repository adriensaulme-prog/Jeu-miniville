// Jalon 9 ter — génère une carte SVG légère par pays (docs/CARTE-DU-PAYS.md).
// Script exécuté une fois par cette session (pas à chaque build ni à
// chaque visite) : source de données réseau (geoBoundaries — Natural
// Earth pour les 6 pays à régions réelles ; world-atlas — Natural Earth
// pour le contour des ~240 autres), simplification, projection,
// écriture des fichiers de sortie dans src/data/cartes/. Seule
// dépendance ajoutée au projet (devDependency, jamais importée par
// l'application, poids nul sur le paquet client — DECISIONS.md §1
// point 6) : `world-countries`, pour faire correspondre les codes ISO
// numériques de world-atlas (ex. "250") aux codes alpha-2 utilisés
// partout ailleurs dans ce projet (ex. "FR").
//
// Projection : équirectangulaire maison (pas d3-geo/Mercator) — un
// pays n'est jamais assez grand pour que la distorsion se voie, et ça
// évite un vrai piège rencontré en écrivant ce script : les polygones
// de geoBoundaries ont un sens de rotation (winding) qui fait que
// d3-geo (geoBounds/fitSize, conventions RFC 7946) les interprète comme
// couvrant le globe entier. Voir DECISIONS.md §4, journal du
// Jalon 9 ter, pour le récit complet.
//
// Format de sortie, un fichier JSON par pays (src/data/cartes/{CCA2}.json) :
//   { viewBox: "0 0 W H", regions: [{ id, path }, ...] }
// Toujours un tableau "regions" (une seule entrée pour les pays sans
// régions réelles, avec l'id de la région de repli "xx-tout") : le
// composant de rendu n'a pas de cas particulier à gérer.

import worldCountries from "world-countries";
import { feature } from "topojson-client";
import { writeFile, mkdir } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const LARGEUR = 400;
const HAUTEUR = 400;
const MARGE = 12;
const TOLERANCE_SIMPLIFICATION = 1.2; // pixels, après projection
const DOSSIER_SORTIE = "src/data/cartes";

// Pays avec des régions réelles (docs/DECISIONS.md §4, Jalon 8) : carte
// subdivisée. Tous les autres : contour seul, une région "xx-tout".
const PAYS_A_REGIONS = { FR: "FRA", DE: "DEU", BE: "BEL", CH: "CHE", CA: "CAN", US: "USA" };

// Corrections manuelles constatées en comparant aux id de la table
// `regions` (Jalon 8) : geoBoundaries s'écarte parfois de l'ISO 3166-2
// exact (Corse, Québec), oublie le préfixe pays (Belgique), ou contient
// une coquille dans ses propres données (Dakota du Sud "SU-SD" au lieu
// de "US-SD", vérifié dans le jeu de données source lui-même). Les
// 5 régions d'outre-mer françaises et le Rhode Island/DC américains
// n'apparaissent pas du tout dans ce jeu de données (ou disparaissent à
// la simplification, trop petits) — accepté comme limite connue de
// cette première version (docs/DECISIONS.md §10).
const CORRECTIONS_ID = {
  "fr-20r": "fr-cor",
  "ca-qb": "ca-qc",
  "su-sd": "us-sd",
};
function corrigerId(cca2, shapeIso) {
  let id = shapeIso.toLowerCase();
  if (CORRECTIONS_ID[id]) id = CORRECTIONS_ID[id];
  const prefixe = cca2.toLowerCase() + "-";
  if (!id.startsWith(prefixe) && !id.includes("-")) id = prefixe + id; // ex. Belgique : "bru" -> "be-bru"
  return id;
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ccn3VersCca2 = new Map(worldCountries.map((c) => [c.ccn3, c.cca2]));

async function recupererJson(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error(`${url} -> ${reponse.status}`);
  return reponse.json();
}

function distancePointSegment(p, a, b) {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function douglasPeucker(points, tolerance) {
  if (points.length < 3) return points;
  let indexMax = 0, distMax = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = distancePointSegment(points[i], points[0], points[points.length - 1]);
    if (d > distMax) { distMax = d; indexMax = i; }
  }
  if (distMax > tolerance) {
    const gauche = douglasPeucker(points.slice(0, indexMax + 1), tolerance);
    const droite = douglasPeucker(points.slice(indexMax), tolerance);
    return gauche.slice(0, -1).concat(droite);
  }
  return [points[0], points[points.length - 1]];
}

function calculerBbox(features) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const f of features) {
    const polygones = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const rings of polygones) {
      for (const [lon, lat] of rings[0]) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }
  return { minLon, maxLon, minLat, maxLat };
}

/** Projection équirectangulaire maison, longitude compressée par
 * cos(latitude centrale) pour des proportions visuelles correctes. */
function creerProjection(bbox) {
  const { minLon, maxLon, minLat, maxLat } = bbox;
  const facteurLon = Math.cos(((minLat + maxLat) / 2 / 180) * Math.PI);
  const largeurGeo = Math.max((maxLon - minLon) * facteurLon, 1e-6);
  const hauteurGeo = Math.max(maxLat - minLat, 1e-6);
  const echelle = Math.min((LARGEUR - 2 * MARGE) / largeurGeo, (HAUTEUR - 2 * MARGE) / hauteurGeo);
  const decalageX = (LARGEUR - largeurGeo * echelle) / 2;
  const decalageY = (HAUTEUR - hauteurGeo * echelle) / 2;
  return ([lon, lat]) => [
    decalageX + (lon - minLon) * facteurLon * echelle,
    decalageY + (maxLat - lat) * echelle,
  ];
}

function ringVersPath(ring, projection) {
  const projetes = ring.map(projection);
  const simplifie = douglasPeucker(projetes, TOLERANCE_SIMPLIFICATION);
  if (simplifie.length < 3) return null;
  return "M" + simplifie.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
}
function geometrieVersPath(geometry, projection) {
  const polygones = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygones
    .map((rings) => ringVersPath(rings[0], projection))
    .filter(Boolean)
    .join(" ");
}

/** Centroïde (aire pondérée, formule du "shoelace") du plus grand
 * anneau extérieur d'une géométrie déjà projetée en pixels — sert à
 * placer les pastilles de villes marquantes (Jalon 9 ter §2) : les
 * villes n'ont pas de coordonnées propres dans ce projet, seulement
 * une région, donc "la ville du joueur" est représentée au centre de
 * sa région plutôt qu'à un point géographique précis. */
function centroidePlusGrandAnneau(geometry, projection) {
  const polygones = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  let meilleur = null;
  let meilleureAire = -1;
  for (const rings of polygones) {
    const points = rings[0].map(projection);
    let aireSignee = 0, cx = 0, cy = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const croix = x0 * y1 - x1 * y0;
      aireSignee += croix;
      cx += (x0 + x1) * croix;
      cy += (y0 + y1) * croix;
    }
    aireSignee /= 2;
    const aireAbs = Math.abs(aireSignee);
    if (aireAbs > meilleureAire && aireAbs > 1e-6) {
      meilleureAire = aireAbs;
      meilleur = [cx / (6 * aireSignee), cy / (6 * aireSignee)];
    }
  }
  if (!meilleur) {
    // Repli pour un anneau dégénéré (aire ~0, ex. région réduite à une
    // ligne par la simplification) : premier point du plus grand anneau.
    const premierPoint = polygones[0]?.[0]?.[0];
    meilleur = premierPoint ? projection(premierPoint) : [LARGEUR / 2, HAUTEUR / 2];
  }
  return meilleur;
}

async function genererPaysAvecRegions(cca2, cca3) {
  // L'API geoBoundaries donne l'URL de sa propre version pré-simplifiée
  // ("simplifiedGeometryGeoJSON") — bien plus légère que le fichier
  // détaillé complet (72 Mo pour la France, plus de 500 Mo pour le
  // Canada — dépasse la limite de chaîne de V8 au JSON.parse).
  const meta = await recupererJson(`https://www.geoboundaries.org/api/current/gbOpen/${cca3}/ADM1/`);
  const data = await recupererJson(meta.simplifiedGeometryGeoJSON);
  const features = data.features.filter((f) => f.properties.shapeISO);
  if (features.length === 0) return null;

  const bbox = calculerBbox(features);
  const projection = creerProjection(bbox);
  const regions = features
    .map((f) => {
      const d = geometrieVersPath(f.geometry, projection);
      if (!d) return null;
      const [cx, cy] = centroidePlusGrandAnneau(f.geometry, projection);
      return {
        id: corrigerId(cca2, f.properties.shapeISO),
        path: d,
        cx: Math.round(cx * 10) / 10,
        cy: Math.round(cy * 10) / 10,
      };
    })
    .filter(Boolean);

  return regions.length > 0 ? { viewBox: `0 0 ${LARGEUR} ${HAUTEUR}`, regions } : null;
}

function genererPaysSansRegions(featureMonde, regionRepli) {
  const bbox = calculerBbox([featureMonde]);
  const projection = creerProjection(bbox);
  const d = geometrieVersPath(featureMonde.geometry, projection);
  if (!d) return null;
  const [cx, cy] = centroidePlusGrandAnneau(featureMonde.geometry, projection);
  return {
    viewBox: `0 0 ${LARGEUR} ${HAUTEUR}`,
    regions: [{ id: regionRepli, path: d, cx: Math.round(cx * 10) / 10, cy: Math.round(cy * 10) / 10 }],
  };
}

async function main() {
  await mkdir(DOSSIER_SORTIE, { recursive: true });

  const { data: pays, error: erreurPays } = await admin.from("countries").select("id");
  if (erreurPays) throw erreurPays;
  const { data: regions, error: erreurRegions } = await admin.from("regions").select("id, country_id");
  if (erreurRegions) throw erreurRegions;
  const regionRepliParPays = new Map();
  for (const r of regions) {
    if (r.id.endsWith("-tout")) regionRepliParPays.set(r.country_id, r.id);
  }

  console.log("Téléchargement du contour mondial (world-atlas)...");
  const topoMonde = await recupererJson("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json");
  // world-atlas est du TopoJSON (arcs partagés, quantifiés) :
  // topojson-client se contente de les décoder en GeoJSON — pas de
  // géométrie sphérique ici, donc pas concerné par le piège de winding
  // order rencontré avec d3-geo (voir le commentaire en tête de fichier).
  const featuresMonde = feature(topoMonde, topoMonde.objects.countries).features;

  let ok = 0;
  const manquants = [];
  const featureParCca2 = new Map();
  for (const f of featuresMonde) {
    const cca2 = ccn3VersCca2.get(String(f.id).padStart(3, "0"));
    if (cca2) featureParCca2.set(cca2, f);
  }

  for (const { id: cca2 } of pays) {
    const cca3 = PAYS_A_REGIONS[cca2];
    try {
      let donnees;
      if (cca3) {
        console.log(`Régions réelles : ${cca2} (${cca3})...`);
        donnees = await genererPaysAvecRegions(cca2, cca3);
      } else {
        const featureMonde = featureParCca2.get(cca2);
        const regionRepli = regionRepliParPays.get(cca2);
        donnees = featureMonde && regionRepli ? genererPaysSansRegions(featureMonde, regionRepli) : null;
      }
      if (!donnees) {
        manquants.push(cca2);
        continue;
      }
      await writeFile(`${DOSSIER_SORTIE}/${cca2}.json`, JSON.stringify(donnees));
      ok++;
    } catch (e) {
      console.error(`Échec pour ${cca2} :`, e.message);
      manquants.push(cca2);
    }
  }

  console.log(`\n${ok} cartes générées, ${manquants.length} pays sans carte (territoires trop petits/hors couverture) :`);
  console.log(manquants.join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
