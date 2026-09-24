/**
 * Scène Three.js : prend la géométrie produite par generer.ts et la
 * texture d'occlusion ambiante d'ao.ts, les affiche avec les shaders
 * portés du prototype (shaders.ts), éclaire la scène à la position
 * réelle du soleil (src/lib/game/soleilVille.ts) et gère la caméra
 * orthographique orbitale (glisser pour tourner/incliner, molette ou
 * pincement pour zoomer, glisser avec Maj pour déplacer).
 *
 * Voir docs/DECISIONS.md §4 (Jalon 6bis) pour les adaptations par
 * rapport au prototype (notamment : ombres en sampler2D + comparaison
 * manuelle plutôt que sampler2DShadow matériel, non exposé simplement
 * par Three.js).
 */

import * as THREE from "three";
import { AO_EXT, bakeAO } from "./ao";
import { generate, type ResultatGeneration } from "./generer";
import { FS, SFS, SVS, VS } from "./shaders";
import {
  heureDansLeFuseau,
  jourDeLAnnee,
  positionSoleil,
  type PositionSoleil,
} from "@/lib/game/soleilVille";

export interface ParametresPays {
  latitude: number;
  longitude: number;
  fuseauHoraire: string;
}

export interface ParametresVille {
  /** Identité stable de la ville (son id) — même graine, toujours la même forme. */
  seed: string;
  /** population_max, jamais la population instantanée (docs/DECISIONS.md §4, Jalon 6). */
  populationMax: number;
  pays: ParametresPays;
}

const L = (c: [number, number, number]): [number, number, number] => [
  Math.pow(c[0], 2.2),
  Math.pow(c[1], 2.2),
  Math.pow(c[2], 2.2),
];
const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

const PAL = {
  day: {
    sunC: [1.0, 0.95, 0.86].map((x) => x * 3.0) as [number, number, number],
    skyTop: L(hex("#8fb9ea")),
    horizon: L(hex("#dce8f1")),
    ground: L(hex("#8c8878")),
    fog: hex("#d7e3ea"),
    ambient: 0.95,
    exposure: 0.92,
  },
  dusk: {
    sunC: [1.0, 0.6, 0.33].map((x) => x * 2.4) as [number, number, number],
    skyTop: L(hex("#4d5f93")),
    horizon: L(hex("#f0ae84")),
    ground: L(hex("#6b5d58")),
    fog: hex("#c9a596"),
    ambient: 0.85,
    exposure: 1.12,
  },
  night: {
    moonC: [0.5, 0.62, 0.95].map((x) => x * 0.38) as [number, number, number],
    skyTop: L(hex("#0b1530")),
    horizon: L(hex("#1f2b4d")),
    ground: L(hex("#15171d")),
    fog: hex("#141b2d"),
    ambient: 0.5,
    exposure: 1.3,
  },
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const mixV = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const mixF = (a: number, b: number, t: number) => a + (b - a) * t;
const skyDir = (azDeg: number, elDeg: number): [number, number, number] => {
  const a = (azDeg * Math.PI) / 180,
    e = (elDeg * Math.PI) / 180;
  return [Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a)];
};

interface Eclairage {
  sun: [number, number, number];
  sunC: [number, number, number];
  skyTop: [number, number, number];
  horizon: [number, number, number];
  ground: [number, number, number];
  fog: [number, number, number];
  ambient: number;
  exposure: number;
  night: number;
}

function calculerEclairage(sp: PositionSoleil): Eclairage {
  const gold = 1 - smooth(4, 24, sp.elevation);
  const night = 1 - smooth(-10, 1, sp.elevation);
  const pick3 = (k: "skyTop" | "horizon" | "ground" | "fog") =>
    mixV(mixV(PAL.day[k], PAL.dusk[k], gold), PAL.night[k], night);
  const pick1 = (k: "ambient" | "exposure") => mixF(mixF(PAL.day[k], PAL.dusk[k], gold), PAL.night[k], night);
  const sunUp = sp.elevation > -2;
  return {
    sun: sunUp ? skyDir(sp.azimut, Math.max(sp.elevation, 4)) : skyDir(sp.azimut + 180, 38),
    sunC: sunUp
      ? (mixV(PAL.day.sunC, PAL.dusk.sunC, gold).map((x) => x * smooth(-3, 6, sp.elevation)) as [
          number,
          number,
          number
        ])
      : (PAL.night.moonC.map((x) => x * night) as [number, number, number]),
    skyTop: pick3("skyTop"),
    horizon: pick3("horizon"),
    ground: pick3("ground"),
    fog: pick3("fog"),
    ambient: pick1("ambient"),
    exposure: pick1("exposure"),
    night: 1 - smooth(-4, 10, sp.elevation),
  };
}

function versGeometrie(res: ResultatGeneration): THREE.BufferGeometry {
  const n = res.g.n;
  const position = new Float32Array(n * 3);
  const normal = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const aParams = new Float32Array(n * 4);
  const V = res.g.V;
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
    aParams[i * 4] = V[o + 9];
    aParams[i * 4 + 1] = V[o + 10];
    aParams[i * 4 + 2] = V[o + 11];
    aParams[i * 4 + 3] = V[o + 12];
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("aPos", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aNormal", new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
  geometry.setAttribute("aParams", new THREE.BufferAttribute(aParams, 4));
  geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(res.g.I), 1));
  geometry.computeBoundingSphere();
  return geometry;
}

export interface ControleurSceneVille {
  definirVille(params: ParametresVille): void;
  /** Date à utiliser pour la position du soleil ; par défaut l'instant présent, réévalué à chaque frame si non fourni. */
  definirDate(date: Date | null): void;
  dispose(): void;
}

export function creerSceneVille(canvas: HTMLCanvasElement): ControleurSceneVille {
  const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
  const SHADOW_SIZE = coarse ? 2048 : 4096;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.autoClear = false;
  // Le shader (shaders.ts) fait tout le pipeline colorimétrique à la main
  // (linéarisation, ACES, gamma 1/2.2), à l'identique du prototype WebGL2
  // porté. Sans ça, la gestion automatique des couleurs de Three.js
  // réencode une seconde fois en sRGB la couleur d'effacement (le ciel,
  // via setClearColor plus bas) puisqu'elle est déjà encodée : le fond
  // ressort trop clair et désaturé (voir docs/DECISIONS.md §4 ; ce n'était
  // pas la cause de "l'herbe est grise", voir le culling plus bas).
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 10, 2600);

  const shadowTarget = new THREE.WebGLRenderTarget(SHADOW_SIZE, SHADOW_SIZE, {
    depthTexture: new THREE.DepthTexture(SHADOW_SIZE, SHADOW_SIZE, THREE.UnsignedShortType),
    depthBuffer: true,
  });
  const S = 245;
  const lightCamera = new THREE.OrthographicCamera(-S, S, S, -S, 50, 1500);

  const aoTexture = new THREE.DataTexture(new Uint8Array(4), 1, 1, THREE.RGFormat, THREE.UnsignedByteType);
  aoTexture.needsUpdate = true;

  const uniforms = {
    uViewProj: { value: new THREE.Matrix4() },
    uLightVP: { value: new THREE.Matrix4() },
    uShadow: { value: shadowTarget.depthTexture },
    uAO: { value: aoTexture as THREE.Texture },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Vector3(1, 1, 1) },
    uSkyTop: { value: new THREE.Vector3() },
    uSkyHorizon: { value: new THREE.Vector3() },
    uGround: { value: new THREE.Vector3() },
    uViewDir: { value: new THREE.Vector3(0, 0, -1) },
    uFog: { value: new THREE.Vector3() },
    uAmbient: { value: 1 },
    uExposure: { value: 1 },
    uNight: { value: 0 },
    uAOExt: { value: AO_EXT },
  };

  const material = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VS,
    fragmentShader: FS,
    uniforms,
    // Le prototype WebGL2 désactive le culling (gl.disable(gl.CULL_FACE)) :
    // les quads horizontaux de geometrie.ts (sol, routes, parcelles, toits
    // plats) sont enroulés face vers le bas. Avec le culling par défaut de
    // Three.js (FrontSide), ils disparaissent et on voit le fond à travers
    // le sol ("l'herbe est grise"). DoubleSide = même rendu que le prototype.
    side: THREE.DoubleSide,
  });
  const shadowMaterial = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: SVS,
    fragmentShader: SFS,
    uniforms: { uLightVP: uniforms.uLightVP },
    side: THREE.DoubleSide,
  });

  let mesh: THREE.Mesh | null = null;
  let shadowMesh: THREE.Mesh | null = null;
  let stats: ResultatGeneration["stats"] | null = null;

  let pays: ParametresPays = { latitude: 46.6, longitude: 2.35, fuseauHoraire: "Europe/Paris" };
  let dateForcee: Date | null = null;

  // Caméra : azimut/élévation autour d'une cible, comme le prototype.
  const etatCamera = { az: 45, el: 33, zoom: 1, panX: 0, panZ: 0, autoFrame: true };

  function reconstruire(params: ParametresVille) {
    pays = params.pays;
    const res = generate(params.seed, params.populationMax);
    stats = res.stats;

    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }
    if (shadowMesh) {
      shadowMesh.geometry.dispose();
    }
    const geometry = versGeometrie(res);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    shadowMesh = new THREE.Mesh(geometry, shadowMaterial);

    const aoData = bakeAO(res.ao, res.glow);
    aoTexture.dispose();
    const tex = new THREE.DataTexture(aoData, 512, 512, THREE.RGFormat, THREE.UnsignedByteType);
    tex.needsUpdate = true;
    uniforms.uAO.value = tex;
  }

  function resize() {
    const dpr = renderer.getPixelRatio();
    const w = Math.max(1, canvas.clientWidth),
      h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    void dpr;
  }

  function render() {
    resize();
    const date = dateForcee ?? new Date();
    const heure = heureDansLeFuseau(date, pays.fuseauHoraire);
    const jour = jourDeLAnnee(heure.annee, heure.mois, heure.jour);
    const sp = positionSoleil(pays.latitude, pays.longitude, heure.decalageUtc, heure.heure, jour);
    const L = calculerEclairage(sp);

    uniforms.uSunDir.value.set(L.sun[0], L.sun[1], L.sun[2]);
    uniforms.uSunColor.value.set(L.sunC[0], L.sunC[1], L.sunC[2]);
    uniforms.uSkyTop.value.set(L.skyTop[0], L.skyTop[1], L.skyTop[2]);
    uniforms.uSkyHorizon.value.set(L.horizon[0], L.horizon[1], L.horizon[2]);
    uniforms.uGround.value.set(L.ground[0], L.ground[1], L.ground[2]);
    uniforms.uFog.value.set(L.fog[0], L.fog[1], L.fog[2]);
    uniforms.uAmbient.value = L.ambient;
    uniforms.uExposure.value = L.exposure;
    uniforms.uNight.value = L.night;

    // Caméra lumière (ombres)
    const lEye = new THREE.Vector3(L.sun[0], L.sun[1], L.sun[2]).multiplyScalar(700);
    lightCamera.position.copy(lEye);
    lightCamera.lookAt(0, 0, 0);
    lightCamera.updateMatrixWorld(true);
    lightCamera.updateProjectionMatrix();
    uniforms.uLightVP.value.multiplyMatrices(lightCamera.projectionMatrix, lightCamera.matrixWorldInverse);

    if (shadowMesh) {
      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = true;
      renderer.setRenderTarget(shadowTarget);
      renderer.clear(false, true, false);
      renderer.render(shadowMesh, lightCamera);
      renderer.setRenderTarget(null);
      renderer.autoClear = prevAutoClear;
    }

    // Caméra principale, orthographique, orbitale autour d'une cible.
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const baseHalf = aspect >= 1 ? 128 : Math.min(250, 150 / aspect);
    let zoom = etatCamera.zoom,
      tX = etatCamera.panX,
      tZ = etatCamera.panZ;
    if (etatCamera.autoFrame && stats?.center && stats.extent != null) {
      zoom = Math.max(0.32, Math.min(1, (stats.extent * 0.72 + 30) / 128));
      tX = stats.center[0];
      tZ = stats.center[1];
    }
    const hh = baseHalf * zoom,
      hw = hh * aspect;
    camera.left = -hw;
    camera.right = hw;
    camera.top = hh;
    camera.bottom = -hh;
    camera.near = 10;
    camera.far = 2600;

    const azR = (etatCamera.az * Math.PI) / 180,
      elR = (etatCamera.el * Math.PI) / 180;
    const cd = new THREE.Vector3(
      Math.cos(elR) * Math.sin(azR),
      Math.sin(elR),
      Math.cos(elR) * Math.cos(azR)
    );
    const target = new THREE.Vector3(tX, 22, tZ);
    camera.position.copy(target).addScaledVector(cd, 900);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    camera.updateProjectionMatrix();
    uniforms.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    uniforms.uViewDir.value.set(-cd.x, -cd.y, -cd.z);

    renderer.setClearColor(new THREE.Color(L.fog[0], L.fog[1], L.fog[2]), 1);
    renderer.clear(true, true, false);
    if (mesh) renderer.render(mesh, camera);
  }

  let frameQueued = false;
  function schedule() {
    if (frameQueued) return;
    frameQueued = true;
    requestAnimationFrame(() => {
      frameQueued = false;
      render();
    });
  }

  // Glisser pour tourner/incliner, Maj+glisser pour déplacer, molette/pincement pour zoomer.
  const pointers = new Map<number, { x: number; y: number; shift: boolean }>();
  let pinchDist = 0;
  let lastMid: [number, number] | null = null;

  function takeCamera() {
    if (!etatCamera.autoFrame || !stats?.center || stats.extent == null) return;
    etatCamera.autoFrame = false;
    etatCamera.zoom = Math.max(0.32, Math.min(1, (stats.extent * 0.72 + 30) / 128));
    etatCamera.panX = stats.center[0];
    etatCamera.panZ = stats.center[1];
  }
  function pan(dx: number, dy: number) {
    takeCamera();
    const azR = (etatCamera.az * Math.PI) / 180;
    const k = (etatCamera.zoom * 0.42) / Math.max(1, canvas.clientHeight / 4);
    etatCamera.panX -= (Math.cos(azR) * dx + Math.sin(azR) * dy) * k;
    etatCamera.panZ -= (-Math.sin(azR) * dx + Math.cos(azR) * dy) * k;
  }

  const onPointerDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, shift: e.shiftKey || e.button === 2 });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      lastMid = [(a.x + b.x) / 2, (a.y + b.y) / 2];
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.size === 1) {
      if (p.shift) pan(dx, dy);
      else {
        takeCamera();
        etatCamera.az -= dx * 0.35;
        etatCamera.el = Math.max(18, Math.min(62, etatCamera.el + dy * 0.2));
      }
      schedule();
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid: [number, number] = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      if (pinchDist > 0) {
        takeCamera();
        etatCamera.zoom = Math.max(0.35, Math.min(2.2, etatCamera.zoom * (pinchDist / d)));
      }
      if (lastMid) pan(mid[0] - lastMid[0], mid[1] - lastMid[1]);
      pinchDist = d;
      lastMid = mid;
      schedule();
    }
  };
  const endPointer = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) {
      pinchDist = 0;
      lastMid = null;
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    takeCamera();
    etatCamera.zoom = Math.max(0.35, Math.min(2.2, etatCamera.zoom * Math.exp(e.deltaY * 0.0012)));
    schedule();
  };
  const onContextMenu = (e: Event) => e.preventDefault();

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);

  const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => schedule()) : null;
  resizeObserver?.observe(canvas);

  let heureInterval: ReturnType<typeof setInterval> | null = null;
  if (typeof window !== "undefined") {
    heureInterval = setInterval(() => schedule(), 30000);
  }

  return {
    definirVille(params: ParametresVille) {
      reconstruire(params);
      schedule();
    },
    definirDate(date: Date | null) {
      dateForcee = date;
      schedule();
    },
    dispose() {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      resizeObserver?.disconnect();
      if (heureInterval) clearInterval(heureInterval);
      mesh?.geometry.dispose();
      shadowTarget.dispose();
      material.dispose();
      shadowMaterial.dispose();
      aoTexture.dispose();
      renderer.dispose();
    },
  };
}
