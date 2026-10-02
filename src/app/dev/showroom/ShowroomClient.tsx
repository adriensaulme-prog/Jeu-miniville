"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Geo } from "@/lib/ville3d/geometrie";
import { rngFrom } from "@/lib/ville3d/aleatoire";
import { MODELES_IMMEUBLES, MODELES_MAISONS, MODELES_TOURS } from "@/lib/ville3d/batiments";

/**
 * Showroom (outil de développement, jamais dans le jeu publié — voir
 * docs/BATIMENTS-ET-PACKS.md §2) : affiche côte à côte tous les modèles
 * du catalogue de bâtiments, de jour et de nuit, pour valider le rendu
 * d'un coup d'œil. Rendu volontairement simple (matériau à couleurs de
 * sommets, une seule lumière directionnelle) : ce n'est pas la scène du
 * jeu (shaders/ombres/occlusion de scene.ts), juste assez pour juger
 * des formes, proportions et couleurs.
 *
 * Un SEUL WebGLRenderer pour toute la page (docs/A-INTEGRER.md §22) : la
 * première version en créait un par vignette (15+ contextes WebGL
 * simultanés), au-delà de la limite des navigateurs — les contextes en
 * trop étaient perdus en silence (vignettes blanches ou partielles).
 * Chaque modèle est maintenant rendu à tour de rôle sur ce renderer
 * partagé, puis recopié dans le canvas 2D de sa vignette.
 */

interface Fiche {
  id: string;
  construire: (...args: never[]) => unknown;
}

type TypeFamille = "maison" | "immeuble" | "tour";

interface Entree {
  fiche: Fiche;
  type: TypeFamille;
  taille: [number, number, number, number];
}

const TAILLE_VIGNETTE = 220;

function versGeometrieSimple(g: Geo): THREE.BufferGeometry {
  const n = g.n;
  const position = new Float32Array(n * 3);
  const normal = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const V = g.V;
  for (let i = 0; i < n; i++) {
    const o = i * 13;
    position[i * 3] = V[o];
    position[i * 3 + 1] = V[o + 1];
    position[i * 3 + 2] = V[o + 2];
    normal[i * 3] = V[o + 3];
    normal[i * 3 + 1] = V[o + 4];
    normal[i * 3 + 2] = V[o + 5];
    color[i * 3] = V[o + 6];
    color[i * 3 + 1] = V[o + 7];
    color[i * 3 + 2] = V[o + 8];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(color, 3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(g.I), 1));
  geometry.computeBoundingSphere();
  return geometry;
}

function construireGeometrie({ fiche, type, taille }: Entree): THREE.BufferGeometry {
  const geo = new Geo();
  const r = rngFrom("showroom|" + fiche.id);
  // Tours montrées terminées (F = cap), pas en chantier : c'est la silhouette finale qu'on veut juger.
  const args =
    type === "tour"
      ? [taille as unknown as never, "+z", 24, 24, r, [], 1]
      : type === "immeuble"
        ? [taille as unknown as never, "-z", 5, r, [], 1]
        : [taille as unknown as never, "-z", r, [], 1];
  (fiche.construire as (...a: unknown[]) => unknown)(geo, ...(args as unknown[]));
  return versGeometrieSimple(geo);
}

function Vignette({ id, canvasRef }: { id: string; canvasRef: (el: HTMLCanvasElement | null) => void }) {
  return (
    <div className="showroom-vignette">
      <canvas
        ref={canvasRef}
        width={TAILLE_VIGNETTE * 2}
        height={TAILLE_VIGNETTE * 2}
        style={{ width: "100%", height: TAILLE_VIGNETTE, display: "block", borderRadius: 8, background: "#bcd8ef" }}
      />
      <p style={{ textAlign: "center", fontFamily: "monospace", fontSize: 13, margin: "4px 0" }}>{id}</p>
    </div>
  );
}

function Section({
  titre,
  entrees,
  enregistrer,
}: {
  titre: string;
  entrees: Entree[];
  enregistrer: (id: string, el: HTMLCanvasElement | null) => void;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "sans-serif" }}>
        {titre} ({entrees.length})
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {entrees.map((e) => (
          <Vignette key={e.fiche.id} id={e.fiche.id} canvasRef={(el) => enregistrer(e.fiche.id, el)} />
        ))}
      </div>
    </section>
  );
}

const ENTREES_MAISONS: Entree[] = MODELES_MAISONS.map((fiche) => ({
  fiche,
  type: "maison",
  taille: [0, 0, 14.5, 14.5],
}));
const ENTREES_IMMEUBLES: Entree[] = MODELES_IMMEUBLES.map((fiche) => ({
  fiche,
  type: "immeuble",
  taille: [0, 0, 14.5, 14.5],
}));
const ENTREES_TOURS: Entree[] = MODELES_TOURS.map((fiche) => ({
  fiche,
  type: "tour",
  taille: [0, 0, 29, 29],
}));
const TOUTES_LES_ENTREES = [...ENTREES_MAISONS, ...ENTREES_IMMEUBLES, ...ENTREES_TOURS];

export function ShowroomClient() {
  const [nuit, setNuit] = useState(false);
  const [angle, setAngle] = useState(35);
  const canvasParId = useRef(new Map<string, HTMLCanvasElement>());
  const enregistrer = (id: string, el: HTMLCanvasElement | null) => {
    if (el) canvasParId.current.set(id, el);
    else canvasParId.current.delete(id);
  };

  useEffect(() => {
    // Un seul renderer, un seul contexte WebGL, pour toute la page.
    const taillePx = TAILLE_VIGNETTE * 2;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(taillePx, taillePx, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(nuit ? "#0b1530" : "#bcd8ef");
    scene.add(new THREE.AmbientLight(0xffffff, nuit ? 0.35 : 0.75));
    const soleil = new THREE.DirectionalLight(0xffffff, nuit ? 0.25 : 1.1);
    scene.add(soleil);
    // DoubleSide obligatoire : la géométrie de geometrie.ts a des quads
    // horizontaux (toits, sols) enroulés face vers le bas, comme la vraie
    // scène (scene.ts, "side: THREE.DoubleSide"). En FrontSide, murs et
    // toits disparaissaient et il ne restait que des fragments.
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    const geometries: THREE.BufferGeometry[] = [];
    for (const entree of TOUTES_LES_ENTREES) {
      const cible = canvasParId.current.get(entree.fiche.id);
      const ctx = cible?.getContext("2d");
      if (!cible || !ctx) continue;

      const geometry = construireGeometrie(entree);
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Cadrage sur la vraie boîte englobante du modèle construit : une tour
      // de 20 étages ne tient pas dans un cadrage pensé pour une maison.
      const sphere = geometry.boundingSphere ?? new THREE.Sphere();
      const rayon = Math.max(sphere.radius, 4);
      const extent = rayon * 1.05;
      const camera = new THREE.OrthographicCamera(-extent, extent, extent, -extent, 0.1, rayon * 10 + 50);
      const a = (angle * Math.PI) / 180;
      const dist = rayon * 2.4;
      camera.position.set(
        sphere.center.x + Math.sin(a) * dist * 0.88,
        sphere.center.y + dist * 0.92,
        sphere.center.z + Math.cos(a) * dist * 0.88
      );
      camera.lookAt(sphere.center);
      soleil.position.set(sphere.center.x + rayon * 2, sphere.center.y + rayon * 3, sphere.center.z + rayon);

      renderer.render(scene, camera);
      ctx.clearRect(0, 0, cible.width, cible.height);
      ctx.drawImage(renderer.domElement, 0, 0, cible.width, cible.height);

      scene.remove(mesh);
    }

    return () => {
      for (const g of geometries) g.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [nuit, angle]);

  return (
    <div
      className="screen"
      style={{ padding: 24, background: nuit ? "#12141a" : "#f4f2ec", minHeight: "100vh", pointerEvents: "auto" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: "sans-serif" }}>Showroom — bibliothèque de bâtiments</h1>
        <button onClick={() => setNuit((n) => !n)} style={{ padding: "6px 14px", cursor: "pointer" }}>
          {nuit ? "☀️ Jour" : "🌙 Nuit"}
        </button>
        <label style={{ fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
          Rotation
          <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
        </label>
      </div>
      <p style={{ fontFamily: "sans-serif", maxWidth: 700 }}>
        Outil de développement, jamais dans le jeu publié (docs/BATIMENTS-ET-PACKS.md §2). Rendu simplifié (couleurs de
        sommets, une seule lumière) — pas la scène finale du jeu, juste de quoi valider formes et proportions. Le
        curseur de rotation est un outil de maquette, pas une fonction du jeu.
      </p>
      <Section titre="Maisons" entrees={ENTREES_MAISONS} enregistrer={enregistrer} />
      <Section titre="Immeubles" entrees={ENTREES_IMMEUBLES} enregistrer={enregistrer} />
      <Section titre="Tours" entrees={ENTREES_TOURS} enregistrer={enregistrer} />
    </div>
  );
}
