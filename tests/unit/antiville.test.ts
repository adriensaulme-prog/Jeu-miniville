import { describe, expect, it } from "vitest";
import { palierAttaques } from "@/lib/game/antiville";

describe("palierAttaques", () => {
  it("0 attaque : calme", () => {
    expect(palierAttaques(0)).toBe("calme");
  });

  it("bornes exactes de chaque palier", () => {
    expect(palierAttaques(1)).toBe("incidents");
    expect(palierAttaques(9)).toBe("incidents");
    expect(palierAttaques(10)).toBe("troubles");
    expect(palierAttaques(99)).toBe("troubles");
    expect(palierAttaques(100)).toBe("emeutes");
    expect(palierAttaques(499)).toBe("emeutes");
    expect(palierAttaques(500)).toBe("crise");
    expect(palierAttaques(999)).toBe("crise");
    expect(palierAttaques(1000)).toBe("sinistree");
    expect(palierAttaques(5000)).toBe("sinistree");
  });
});
