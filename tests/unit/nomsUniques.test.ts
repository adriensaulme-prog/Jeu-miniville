import { describe, expect, it } from "vitest";
import { normaliserNom, validerNomVille, validerPseudo } from "@/lib/game/nomsUniques";

describe("normaliserNom (copie de nom_normalise() SQL)", () => {
  it("ramène casse, accents, tirets, espaces et apostrophes au même nom", () => {
    const variantes = ["Rochemaure", "rochemaure", "Rochemauré", "Roche-Maure", "ROCHE MAURE", "Roche'Maure"];
    for (const v of variantes) expect(normaliserNom(v), v).toBe("rochemaure");
  });

  it("gère les ligatures et caractères spéciaux", () => {
    expect(normaliserNom("Cœur")).toBe("coeur");
    expect(normaliserNom("Straße")).toBe("strasse");
    expect(normaliserNom("Łódź")).toBe("lodz");
    expect(normaliserNom("Saint-Étienne")).toBe("saintetienne");
  });

  it("garde les chiffres et supprime le reste", () => {
    expect(normaliserNom("Ville 42 !")).toBe("ville42");
    expect(normaliserNom("---")).toBe("");
  });
});

describe("validerPseudo", () => {
  it("refuse moins de 3 et plus de 20 caractères", () => {
    expect(validerPseudo("ab")).toBe("nomCourt");
    expect(validerPseudo("a".repeat(21))).toBe("nomLong");
    expect(validerPseudo("abc")).toBeNull();
    expect(validerPseudo("a".repeat(20))).toBeNull();
  });

  it("refuse les noms réservés quelle que soit la casse, l'accent ou la ponctuation", () => {
    for (const n of ["admin", "Admin", "MODÉRATEUR", "Système", "jeu_miniville", "jeu-miniville"]) {
      expect(validerPseudo(n), n).toBe("nomReserve");
    }
  });

  it("refuse les mots injurieux, même camouflés par la ponctuation", () => {
    expect(validerPseudo("sale-connard")).toBe("nomInterdit");
    expect(validerPseudo("F.u.c.k")).toBe("nomInterdit");
  });

  it("refuse un pseudo sans aucune lettre ni chiffre", () => {
    expect(validerPseudo("---")).toBe("nomVide");
  });
});

describe("validerNomVille", () => {
  it("accepte un nom ordinaire et refuse au-delà de 40 caractères", () => {
    expect(validerNomVille("Rochemaure")).toBeNull();
    expect(validerNomVille("x".repeat(41))).toBe("nomLong");
  });

  it("refuse les noms réservés", () => {
    expect(validerNomVille("Admin")).toBe("nomReserve");
  });
});
