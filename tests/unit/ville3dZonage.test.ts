import { describe, expect, it } from "vitest";
import { planifierBlocs, premierRangZone, type VocationsBlocs } from "@/lib/ville3d/generer";
import { openAtK, TOWER_AFTER_OPEN, TOWER_FROM, TOWER_STAGGER } from "@/lib/ville3d/constantes";
import {
  ACTIVITES_QUARTIER,
  COEUR_BLOCS,
  TOURS_CASE_MAX,
  angleCase,
  secteurActivite,
} from "@/lib/ville3d/zonage";
import type { VocationQuartier } from "@/lib/ville3d/quartiers";

/**
 * A-INTEGRER §25, sous-jalon 25b : zonage des quartiers « par secteur ».
 * Les vocations des rangs viennent de la base ; ici on reproduit la règle
 * de assigner_vocations_blocs() à élan nul (résidentiel ≥ moitié, puis
 * commerce → industrie → loisirs → recherche → services à égalité).
 */
function vocationsElanNul(n: number): VocationsBlocs {
  const m = new Map<number, VocationQuartier>();
  let nbR = 0;
  const comptes: Record<string, number> = {};
  for (let rang = 0; rang < n; rang++) {
    if (nbR < Math.ceil((rang + 1) / 2)) {
      m.set(rang, "residentiel");
      nbR++;
    } else {
      const total = rang - nbR;
      let meilleure = ACTIVITES_QUARTIER[0];
      let meilleur = -Infinity;
      for (const a of ACTIVITES_QUARTIER) {
        const deficit = 0.2 - (total > 0 ? (comptes[a] ?? 0) / total : 0);
        if (deficit > meilleur) {
          meilleur = deficit;
          meilleure = a;
        }
      }
      m.set(rang, meilleure);
      comptes[meilleure] = (comptes[meilleure] ?? 0) + 1;
    }
  }
  return m;
}

const POP = (nbBlocs: number) => openAtK(nbBlocs - 1);
const cle = (b: { bi: number; bj: number }) => `${b.bi},${b.bj}`;

describe("zonage des quartiers (§25 25b)", () => {
  it("sans zonage (ville historique), rang = case : emplacements et seuils inchangés", () => {
    const voc = vocationsElanNul(30);
    const { blocks } = planifierBlocs("hist", POP(30), voc);
    blocks.slice(0, 30).forEach((b, k) => {
      expect(b.active).toBe(true);
      expect(b.openAt).toBe(openAtK(k));
      expect(b.vocation).toBe(voc.get(k));
      expect(b.towerAt).toBe(Math.max(TOWER_FROM + k * TOWER_STAGGER, openAtK(k) + TOWER_AFTER_OPEN));
    });
  });

  it("avec zonage : le cœur est résidentiel, chaque activité reste surtout dans son secteur", () => {
    for (const graine of ["demo", "ville-a", "autre-ville"]) {
      const voc = vocationsElanNul(40);
      const { blocks } = planifierBlocs(graine, POP(40), voc, 0);
      const actifs = blocks.filter((b) => b.active);
      expect(actifs).toHaveLength(40);
      for (let s = 0; s < COEUR_BLOCS; s++) expect(blocks[s].vocation).toBe("residentiel");
      let dansSecteur = 0,
        activites = 0;
      let residentielAuNord = 0;
      for (const b of actifs) {
        const secteur = secteurActivite(b.vocation);
        if (secteur) {
          activites++;
          const a = angleCase(b);
          if (a >= secteur[0] && a < secteur[1]) dansSecteur++;
        } else if (angleCase(b) < 180) residentielAuNord++;
      }
      expect(activites).toBeGreaterThan(15);
      expect(dansSecteur / activites).toBeGreaterThan(0.75);
      // Le résidentiel, hors cœur, reste presque tout dans sa moitié.
      expect(residentielAuNord).toBeLessThanOrEqual(COEUR_BLOCS + 4);
    }
  });

  it("deux blocs ne partagent jamais la même case, et le nombre de blocs actifs est inchangé", () => {
    const voc = vocationsElanNul(58);
    const zone = planifierBlocs("demo", 250_000, voc, 0);
    const histo = planifierBlocs("demo", 250_000, voc);
    expect(new Set(zone.blocks.filter((b) => b.active).map(cle)).size).toBe(zone.blocks.filter((b) => b.active).length);
    expect(zone.blocks.filter((b) => b.active).length).toBe(histo.blocks.filter((b) => b.active).length);
  });

  it("une ville qui grandit ne déplace jamais un bloc déjà ouvert (vocation, case, seuils)", () => {
    const voc = vocationsElanNul(58);
    const paliers = [5, 12, 20, 33, 45, 58].map(POP);
    for (const graine of ["demo", "ville-a"]) {
      for (let i = 0; i < paliers.length - 1; i++) {
        const avant = planifierBlocs(graine, paliers[i], voc, 0).blocks.filter((b) => b.active);
        const apres = new Map(planifierBlocs(graine, paliers[i + 1], voc, 0).blocks.map((b) => [cle(b), b]));
        for (const b of avant) {
          const meme = apres.get(cle(b));
          expect(meme?.active).toBe(true);
          expect(meme?.vocation).toBe(b.vocation);
          expect(meme?.openAt).toBe(b.openAt);
          expect(meme?.towerAt).toBe(b.towerAt);
        }
      }
    }
  });

  it("le placement du rang r ne dépend pas de la vocation des rangs suivants", () => {
    const voc = vocationsElanNul(40);
    const autre = new Map(voc);
    autre.set(30, voc.get(30) === "residentiel" ? "services" : "residentiel");
    const a = planifierBlocs("demo", POP(30), voc, 0).blocks.filter((b) => b.active).map(cle);
    const b = planifierBlocs("demo", POP(30), autre, 0).blocks.filter((b) => b.active).map(cle);
    expect(b).toEqual(a);
  });

  it("zonage partiel : les rangs historiques gardent leur case, les suivants suivent le zonage", () => {
    const voc = vocationsElanNul(30);
    const histo = planifierBlocs("demo", POP(30), voc);
    const mixte = planifierBlocs("demo", POP(30), voc, 12);
    // Les 12 premières cases sont occupées par les rangs 0..11, à l'identique.
    for (let k = 0; k < 12; k++) {
      expect(mixte.blocks[k].vocation).toBe(histo.blocks[k].vocation);
      expect(mixte.blocks[k].openAt).toBe(histo.blocks[k].openAt);
    }
    // Les rangs 12..29 sont placés ailleurs que dans l'ordre pur (au moins un déplacé).
    const ordreHisto = histo.blocks.slice(12, 30).map((b) => b.vocation).join();
    const ordreMixte = mixte.blocks.slice(12, 30).map((b) => b.vocation).join();
    expect(ordreMixte).not.toBe(ordreHisto);
    expect(mixte.blocks.filter((b) => b.active)).toHaveLength(30);
  });

  it("aucun gratte-ciel au-delà de la case limite pour les blocs zonés, mais les blocs historiques gardent leurs tours", () => {
    const voc = vocationsElanNul(50);
    const zone = planifierBlocs("demo", POP(50), voc, 0).blocks;
    const histo = planifierBlocs("demo", POP(50), voc).blocks;
    expect(zone.filter((b) => b.active).length).toBe(50);
    zone.forEach((b, s) => {
      if (!b.active) return;
      if (s >= TOURS_CASE_MAX) expect(b.towerAt).toBe(Infinity);
      else expect(Number.isFinite(b.towerAt)).toBe(true);
    });
    histo.forEach((b) => expect(Number.isFinite(b.towerAt)).toBe(true));
  });

  it("premierRangZone : plus petit rang marqué, undefined sinon", () => {
    expect(premierRangZone([])).toBeUndefined();
    expect(premierRangZone([{ rang: 0, zonee: false }, { rang: 1, zonee: false }])).toBeUndefined();
    expect(premierRangZone([{ rang: 0, zonee: false }, { rang: 7, zonee: true }, { rang: 8, zonee: true }])).toBe(7);
    expect(premierRangZone([{ rang: 3, zonee: true }, { rang: 0, zonee: true }])).toBe(0);
  });
});
