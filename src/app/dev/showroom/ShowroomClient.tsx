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
 */

interface Fiche {
  id: string;
  construire: (...args: never[]) => unknown;
}

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

type TypeFamille = "maison" | "immeuble" | "tour";

function Vignette({
  fiche,
  nuit,
  taille,
  type,
}: {
  fiche: Fiche;
  nuit: boolean;
  taille: [number, number, number, number];
  type: TypeFamille;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const geo = new Geo();
    const r = rngFrom("showroom|" + fiche.id);
    const args =
      type === "tour"
        ? [taille as unknown as never, "+z", 14, 24, r, [], 1]
        : type === "immeuble"
          ? [taille as unknown as never, "-z", 4, r, [], 1]
          : [taille as unknown as never, "-z", r, [], 1];
    (fiche.construire as (...a: unknown[]) => unknown)(geo, ...(args as unknown[]));
    const geometry = versGeometrieSimple(geo);

    const w = canvas.clientWidth || 220,
      h = canvas.clientHeight || 220;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(nuit ? "#0b1530" : "#bcd8ef");

    // Cadrage sur la vraie boîte englobante du modèle construit (pas sur
    // la seule emprise au sol) : une tour de 20 étages ne tiendrait pas
    // dans un cadrage pensé pour une maison d'un étage.
    const sphere = geometry.boundingSphere ?? new THREE.Sphere();
    const centre = sphere.center;
    const rayon = Math.max(sphere.radius, 4);
    const extent = rayon * 1.05;
    const camera = new THREE.OrthographicCamera(-extent, extent, extent, -extent, 0.1, rayon * 10 + 50);
    const dist = rayon * 2.4;
    camera.position.set(centre.x + dist * 0.62, centre.y + dist * 0.92, centre.z + dist * 0.62);
    camera.lookAt(centre);

    const ambient = new THREE.AmbientLight(0xffffff, nuit ? 0.35 : 0.75);
    scene.add(ambient);
    const soleil = new THREE.DirectionalLight(0xffffff, nuit ? 0.25 : 1.1);
    soleil.position.set(centre.x + rayon * 2, centre.y + rayon * 3, centre.z + rayon);
    scene.add(soleil);

    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.02 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let frame = 0;
    let anim = 0;
    const tick = () => {
      anim += 0.006;
      mesh.rotation.y = anim;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
    // taille est une constante par vignette (jamais rappelée avec une autre valeur).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiche, nuit, type]);

  return (
    <div className="showroom-vignette">
      <canvas ref={canvasRef} style={{ width: "100%", height: 220, display: "block", borderRadius: 8 }} />
      <p style={{ textAlign: "center", fontFamily: "monospace", fontSize: 13, margin: "4px 0" }}>{fiche.id}</p>
    </div>
  );
}

function Section({
  titre,
  fiches,
  taille,
  type,
  nuit,
}: {
  titre: string;
  fiches: readonly Fiche[];
  taille: [number, number, number, number];
  type: TypeFamille;
  nuit: boolean;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "sans-serif" }}>
        {titre} ({fiches.length})
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {fiches.map((f) => (
          <Vignette key={f.id} fiche={f} nuit={nuit} taille={taille} type={type} />
        ))}
      </div>
    </section>
  );
}

export function ShowroomClient() {
  const [nuit, setNuit] = useState(false);
  return (
    <div
      className="screen"
      style={{ padding: 24, background: nuit ? "#12141a" : "#f4f2ec", minHeight: "100vh", pointerEvents: "auto" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontFamily: "sans-serif" }}>Showroom — bibliothèque de bâtiments</h1>
        <button onClick={() => setNuit((n) => !n)} style={{ padding: "6px 14px", cursor: "pointer" }}>
          {nuit ? "☀️ Jour" : "🌙 Nuit"}
        </button>
      </div>
      <p style={{ fontFamily: "sans-serif", maxWidth: 700 }}>
        Outil de développement, jamais dans le jeu publié (docs/BATIMENTS-ET-PACKS.md §2). Rendu simplifié (couleurs de
        sommets, une seule lumière) — pas la scène finale du jeu, juste de quoi valider formes et proportions.
      </p>
      <Section titre="Maisons" fiches={MODELES_MAISONS} taille={[0, 0, 14.5, 14.5]} type="maison" nuit={nuit} />
      <Section titre="Immeubles" fiches={MODELES_IMMEUBLES} taille={[0, 0, 14.5, 14.5]} type="immeuble" nuit={nuit} />
      <Section titre="Tours" fiches={MODELES_TOURS} taille={[0, 0, 29, 29]} type="tour" nuit={nuit} />
    </div>
  );
}
