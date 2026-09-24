import { describe, expect, it } from "vitest";
import {
  libelleNiveau,
  niveauPourPopulation,
  progressionNiveau,
  NIVEAU_MAX,
  NIVEAU_MIN,
  SEUILS_NIVEAU,
} from "@/lib/game/niveauVille";

describe("libelleNiveau", () => {
  it("donne Hameau au niveau 0 en français", () => {
    expect(libelleNiveau(0, "fr")).toBe("Hameau");
  });

  it("donne Metropolis au niveau 5 en anglais", () => {
    expect(libelleNiveau(5, "en")).toBe("Metropolis");
  });

  it("couvre tous les niveaux de la plage annoncée, dans les deux langues", () => {
    for (let niveau = NIVEAU_MIN; niveau <= NIVEAU_MAX; niveau++) {
      expect(libelleNiveau(niveau, "fr")).not.toBe("");
      expect(libelleNiveau(niveau, "en")).not.toBe("");
    }
  });

  it("refuse un niveau hors plage (sabotage : détecter une ville avec un niveau invalide)", () => {
    expect(() => libelleNiveau(-1, "fr")).toThrow(RangeError);
    expect(() => libelleNiveau(6, "fr")).toThrow(RangeError);
  });

  it("refuse un niveau non entier", () => {
    expect(() => libelleNiveau(1.5, "fr")).toThrow(RangeError);
  });
});

describe("niveauPourPopulation", () => {
  it("donne Hameau (0) à une ville qui vient de naître (population 1)", () => {
    expect(niveauPourPopulation(1)).toBe(0);
  });

  it("reste au niveau précédent juste avant un seuil, et monte pile au seuil", () => {
    for (const [niveau, populationMin] of SEUILS_NIVEAU) {
      if (niveau === NIVEAU_MIN) continue;
      expect(niveauPourPopulation(populationMin - 1)).toBe(niveau - 1);
      expect(niveauPourPopulation(populationMin)).toBe(niveau);
    }
  });

  it("plafonne à Métropole (5) bien au-delà du dernier seuil", () => {
    expect(niveauPourPopulation(1_000_000)).toBe(NIVEAU_MAX);
  });

  it("refuse une population négative (sabotage : ne doit jamais arriver, la colonne DB l'interdit déjà)", () => {
    expect(() => niveauPourPopulation(-1)).toThrow(RangeError);
  });

  it("refuse une population non entière", () => {
    expect(() => niveauPourPopulation(2.5)).toThrow(RangeError);
  });
});

describe("progressionNiveau", () => {
  it("démarre juste après 2 % pile au seuil d'un niveau (barre jamais totalement vide)", () => {
    expect(progressionNiveau(1000).niveau).toBe(1);
    expect(progressionNiveau(1000).pourcentage).toBeGreaterThanOrEqual(2);
  });

  it("approche 100 % juste avant le seuil suivant", () => {
    const p = progressionNiveau(4999);
    expect(p.niveau).toBe(1);
    expect(p.pourcentage).toBeGreaterThan(95);
  });

  it("annonce le bon seuil suivant", () => {
    expect(progressionNiveau(1000).seuilSuivant).toBe(5000);
  });

  it("n'a plus de seuil suivant au niveau maximal (Métropole)", () => {
    const p = progressionNiveau(1_000_000);
    expect(p.niveau).toBe(NIVEAU_MAX);
    expect(p.seuilSuivant).toBeNull();
    expect(p.pourcentage).toBe(100);
  });
});
