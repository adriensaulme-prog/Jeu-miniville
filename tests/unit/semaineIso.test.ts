import { describe, expect, it } from "vitest";
import { debutSemaineIso } from "@/lib/game/semaineIso";

describe("debutSemaineIso", () => {
  it("un jour en milieu de semaine retombe sur le lundi de la même semaine", () => {
    expect(debutSemaineIso(new Date("2026-09-24T15:30:00Z"))).toBe("2026-09-21");
  });

  it("un lundi retombe sur lui-même", () => {
    expect(debutSemaineIso(new Date("2026-09-21T00:00:01Z"))).toBe("2026-09-21");
  });

  it("un dimanche retombe sur le lundi précédent (semaine ISO, pas la semaine US)", () => {
    expect(debutSemaineIso(new Date("2026-09-27T23:59:00Z"))).toBe("2026-09-21");
  });

  it("ignore l'heure du jour, seule la date UTC compte", () => {
    const matin = new Date("2026-09-24T00:05:00Z");
    const soir = new Date("2026-09-24T23:55:00Z");
    expect(debutSemaineIso(matin)).toBe(debutSemaineIso(soir));
  });

  it("traverse correctement un changement de mois", () => {
    expect(debutSemaineIso(new Date("2026-10-01T10:00:00Z"))).toBe("2026-09-28");
  });

  it("traverse correctement un changement d'année", () => {
    expect(debutSemaineIso(new Date("2027-01-01T10:00:00Z"))).toBe("2026-12-28");
  });
});
