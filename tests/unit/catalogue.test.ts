import { describe, expect, it } from "vitest";
import { choisirModele, hashUnit, type FicheModele } from "@/lib/ville3d/catalogue";
import { MODELES_IMMEUBLES, MODELES_MAISONS, MODELES_TOURS } from "@/lib/ville3d/batiments";
import { Geo } from "@/lib/ville3d/geometrie";
import { rngFrom } from "@/lib/ville3d/aleatoire";

type Fiche = FicheModele<() => void>;

function modele(id: string, poids: number, stadeMin = 0, pack = "classique"): Fiche {
  return { id, pack, poids, stadeMin, construire: () => {} };
}

describe("choisirModele", () => {
  it("est déterministe : même clé, même résultat, à chaque appel", () => {
    const modeles = [modele("a", 1), modele("b", 1), modele("c", 1)];
    const premier = choisirModele("ville-x|lot|1,2", modeles, 0);
    for (let i = 0; i < 20; i++) {
      expect(choisirModele("ville-x|lot|1,2", modeles, 0).id).toBe(premier.id);
    }
  });

  it("est insensible à l'ordre des modèles dans le tableau", () => {
    const modeles = [modele("a", 1), modele("b", 2), modele("c", 3)];
    const inverse = [...modeles].reverse();
    for (const cle of ["ville-1|lot|0,0", "ville-2|lot|3,1", "ville-3|lot|2,2"]) {
      expect(choisirModele(cle, modeles, 0).id).toBe(choisirModele(cle, inverse, 0).id);
    }
  });

  it("répartit les tirages à peu près selon les poids (test statistique, nombreuses clés distinctes)", () => {
    const modeles = [modele("lourd", 3), modele("leger", 1)];
    let lourd = 0,
      leger = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const m = choisirModele(`ville-stat|lot|${i}`, modeles, 0);
      if (m.id === "lourd") lourd++;
      else leger++;
    }
    // Attendu ~75 %/~25 % (poids 3 contre 1) ; tolérance large pour un test statistique.
    expect(lourd / n).toBeGreaterThan(0.68);
    expect(lourd / n).toBeLessThan(0.82);
  });

  it("filtre par niveau minimal de la ville (stadeMin)", () => {
    const modeles = [modele("basique", 1, 0), modele("avance", 1, 3)];
    // À un niveau trop bas, "avance" n'est jamais choisi, quelle que soit la clé.
    for (let i = 0; i < 50; i++) {
      expect(choisirModele(`ville-niv|lot|${i}`, modeles, 2).id).toBe("basique");
    }
  });

  it("un pack partiel retombe sur le pack classique pour cette famille", () => {
    const modeles = [modele("classique-1", 1, 0, "classique"), modele("classique-2", 1, 0, "classique")];
    // "haussmannien" n'a aucun modèle pour cette famille : retombe sur classique.
    const choix = choisirModele("ville-pack|lot|0,0", modeles, 0, "haussmannien");
    expect(choix.pack).toBe("classique");
  });

  it("un pack qui a au moins un modèle pour la famille n'utilise plus le classique", () => {
    const modeles = [
      modele("classique-1", 1, 0, "classique"),
      modele("theme-1", 1, 0, "haussmannien"),
    ];
    for (let i = 0; i < 30; i++) {
      expect(choisirModele(`ville-pack2|lot|${i}`, modeles, 0, "haussmannien").pack).toBe("haussmannien");
    }
  });

  it("lève une erreur explicite si aucun modèle n'est disponible", () => {
    expect(() => choisirModele("cle", [modele("trop-avance", 1, 5)], 0)).toThrow();
  });
});

describe("hashUnit", () => {
  it("retourne toujours une valeur dans [0, 1)", () => {
    for (let i = 0; i < 200; i++) {
      const v = hashUnit("clé", i, "suffixe");
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

// Poids d'un triangle indicatif — voir docs/BATIMENTS-ET-PACKS.md §2
// ("chaque modèle a une limite de triangles pour rester fluide sur
// téléphone"). Limite large mais réelle : détecte un modèle qui
// dériverait (boucle mal bornée, etc.), pas un plafond serré.
const LIMITE_TRIANGLES = 600;

describe("limite de triangles par modèle (docs/BATIMENTS-ET-PACKS.md §2)", () => {
  function compterTriangles(construire: (...args: never[]) => unknown, args: unknown[]): number {
    const g = new Geo();
    (construire as (...a: unknown[]) => unknown)(g, ...args);
    return g.I.length / 3;
  }

  it("chaque modèle de maison reste sous la limite", () => {
    const r = rngFrom("test-triangles-maison");
    for (const m of MODELES_MAISONS) {
      const n = compterTriangles(m.construire, [[0, 0, 14.5, 14.5], "-z", r, [], 1]);
      expect(n, m.id).toBeLessThan(LIMITE_TRIANGLES);
    }
  });

  it("chaque modèle d'immeuble reste sous la limite", () => {
    const r = rngFrom("test-triangles-immeuble");
    for (const m of MODELES_IMMEUBLES) {
      const n = compterTriangles(m.construire, [[0, 0, 14.5, 14.5], "-z", 4, r, [], 1]);
      expect(n, m.id).toBeLessThan(LIMITE_TRIANGLES);
    }
  });

  it("chaque modèle de tour (à mi-hauteur) reste sous une limite plus large", () => {
    const r = rngFrom("test-triangles-tour");
    for (const m of MODELES_TOURS) {
      const n = compterTriangles(m.construire, [[0, 0, 29, 29], "+z", 12, 24, r, [], 1]);
      expect(n, m.id).toBeLessThan(LIMITE_TRIANGLES * 3);
    }
  });
});

describe("pack de thème Haussmannien (docs/BATIMENTS-ET-PACKS.md §4)", () => {
  it("le pack haussmannien fournit des modèles d'immeuble dédiés", () => {
    const modeles = MODELES_IMMEUBLES.filter((m) => m.pack === "haussmannien");
    expect(modeles.length).toBeGreaterThan(0);
  });

  it("avec le thème haussmannien, un immeuble utilise toujours un modèle haussmannien (pack non vide pour cette famille)", () => {
    for (let i = 0; i < 30; i++) {
      const modele = choisirModele(`ville-haussmann|lot|${i}`, MODELES_IMMEUBLES, 0, "haussmannien");
      expect(modele.pack).toBe("haussmannien");
    }
  });

  it("avec le thème haussmannien, une maison retombe sur le pack classique (aucun modèle haussmannien pour cette famille)", () => {
    for (let i = 0; i < 10; i++) {
      const modele = choisirModele(`ville-haussmann-maison|lot|${i}`, MODELES_MAISONS, 0, "haussmannien");
      expect(modele.pack).toBe("classique");
    }
  });

  it("avec le thème haussmannien, une tour retombe sur le pack classique", () => {
    for (let i = 0; i < 10; i++) {
      const modele = choisirModele(`ville-haussmann-tour|lot|${i}`, MODELES_TOURS, 0, "haussmannien");
      expect(modele.pack).toBe("classique");
    }
  });
});
