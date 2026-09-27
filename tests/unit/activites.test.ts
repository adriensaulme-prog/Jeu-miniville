import { describe, expect, it } from "vitest";
import { ACTIVITES, activitesDisponibles, etatJauge, NIVEAU_MIN_ACTIVITE, PART_CIBLE } from "@/lib/game/activites";

describe("activitesDisponibles", () => {
  it("Hameau (niveau 0) : seulement Résidentiel et Loisirs", () => {
    expect(activitesDisponibles(0).sort()).toEqual(["loisirs", "residentiel"]);
  });

  it("Village (niveau 1) : Commerce et Services en plus", () => {
    const dispo = activitesDisponibles(1);
    expect(dispo).toContain("commerce");
    expect(dispo).toContain("services");
    expect(dispo).not.toContain("industrie");
    expect(dispo).not.toContain("recherche");
  });

  it("Bourg (niveau 2) : Industrie et Énergie en plus", () => {
    const dispo = activitesDisponibles(2);
    expect(dispo).toContain("industrie");
    expect(dispo).toContain("energie");
    expect(dispo).not.toContain("recherche");
  });

  it("Ville (niveau 3) et au-delà : les 7 activités", () => {
    expect(activitesDisponibles(3).sort()).toEqual([...ACTIVITES].sort());
    expect(activitesDisponibles(5).sort()).toEqual([...ACTIVITES].sort());
  });
});

describe("parts cibles", () => {
  it("les 7 parts s'additionnent à 100 %", () => {
    const total = ACTIVITES.reduce((s, a) => s + PART_CIBLE[a], 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe("NIVEAU_MIN_ACTIVITE", () => {
  it("couvre exactement les 7 activités", () => {
    expect(Object.keys(NIVEAU_MIN_ACTIVITE).sort()).toEqual([...ACTIVITES].sort());
  });
});

describe("etatJauge", () => {
  it("sous 60 % : crise", () => {
    expect(etatJauge(0)).toBe("crise");
    expect(etatJauge(0.599)).toBe("crise");
  });

  it("60 à 90 % (exclu) : fragile", () => {
    expect(etatJauge(0.6)).toBe("fragile");
    expect(etatJauge(0.899)).toBe("fragile");
  });

  it("90 à 120 % (inclus) : équilibré", () => {
    expect(etatJauge(0.9)).toBe("equilibre");
    expect(etatJauge(1)).toBe("equilibre");
    expect(etatJauge(1.2)).toBe("equilibre");
  });

  it("plus de 120 % : point fort", () => {
    expect(etatJauge(1.201)).toBe("pointFort");
    expect(etatJauge(2)).toBe("pointFort");
  });
});
