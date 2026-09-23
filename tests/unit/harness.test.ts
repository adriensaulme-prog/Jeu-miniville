import { describe, expect, it } from "vitest";

/**
 * Test canari : vérifie que le harnais de tests unitaires (Vitest) est
 * correctement câblé. Ce n'est pas un test jetable — il reste en place
 * (comme render_shots.gd chez CVLS) pour détecter immédiatement une
 * config cassée (dépendance manquante, mauvais chemin d'inclusion).
 */
describe("harnais de tests", () => {
  it("exécute bien un test unitaire", () => {
    expect(1 + 1).toBe(2);
  });
});
