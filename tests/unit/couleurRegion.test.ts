import { describe, expect, it } from "vitest";
import { couleurRegion } from "@/lib/game/couleurRegion";

describe("couleurRegion", () => {
  it("région sans habitant : couleur neutre", () => {
    expect(couleurRegion(0, 1000)).toBe("#e4e1dc");
  });

  it("région la plus peuplée : proche de l'accent rouge panneau", () => {
    expect(couleurRegion(1000, 1000)).toBe("#c23b2c");
  });

  it("une région plus peuplée est plus proche de l'accent qu'une moins peuplée", () => {
    const distance = (hex: string) => {
      const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16));
      return Math.abs(r - 0xc2) + Math.abs(g - 0x3b) + Math.abs(b - 0x2c);
    };
    const clair = couleurRegion(100, 1000);
    const fonce = couleurRegion(800, 1000);
    expect(distance(fonce)).toBeLessThan(distance(clair));
  });

  it("aucune région peuplée dans le pays : toujours neutre", () => {
    expect(couleurRegion(0, 0)).toBe("#e4e1dc");
  });
});
