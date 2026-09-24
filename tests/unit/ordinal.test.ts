import { describe, expect, it } from "vitest";
import { ordinal } from "@/lib/game/ordinal";

describe("ordinal", () => {
  it("écrit 1er en français", () => {
    expect(ordinal(1, "fr")).toBe("1ᵉʳ");
  });

  it("écrit Xᵉ pour les autres rangs en français", () => {
    expect(ordinal(2, "fr")).toBe("2ᵉ");
    expect(ordinal(11, "fr")).toBe("11ᵉ");
  });

  it("gère les suffixes irréguliers st/nd/rd/th en anglais", () => {
    expect(ordinal(1, "en")).toBe("1st");
    expect(ordinal(2, "en")).toBe("2nd");
    expect(ordinal(3, "en")).toBe("3rd");
    expect(ordinal(4, "en")).toBe("4th");
  });

  it("l'exception 11/12/13 reste en -th en anglais malgré le chiffre final 1/2/3", () => {
    expect(ordinal(11, "en")).toBe("11th");
    expect(ordinal(12, "en")).toBe("12th");
    expect(ordinal(13, "en")).toBe("13th");
  });

  it("reprend le cycle normal après 13 (21 => st, 22 => nd)", () => {
    expect(ordinal(21, "en")).toBe("21st");
    expect(ordinal(22, "en")).toBe("22nd");
    expect(ordinal(23, "en")).toBe("23rd");
    expect(ordinal(24, "en")).toBe("24th");
  });
});
