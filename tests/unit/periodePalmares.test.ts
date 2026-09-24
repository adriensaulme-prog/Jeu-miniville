import { describe, expect, it } from "vitest";
import { depuisPourPeriode } from "@/lib/game/periodePalmares";

const AUJOURDHUI = new Date("2026-09-24T15:30:00Z");

describe("depuisPourPeriode", () => {
  it("depuis toujours = pas de borne (null)", () => {
    expect(depuisPourPeriode("toujours", AUJOURDHUI)).toBeNull();
  });

  it("aujourd'hui = le jour courant en UTC", () => {
    expect(depuisPourPeriode("jour", AUJOURDHUI)).toBe("2026-09-24");
  });

  it("cette semaine = fenêtre glissante de 7 jours (aujourd'hui inclus)", () => {
    expect(depuisPourPeriode("semaine", AUJOURDHUI)).toBe("2026-09-18");
  });

  it("ce mois = fenêtre glissante de 30 jours (aujourd'hui inclus)", () => {
    expect(depuisPourPeriode("mois", AUJOURDHUI)).toBe("2026-08-26");
  });

  it("ignore l'heure du jour, seule la date UTC compte", () => {
    const matin = new Date("2026-09-24T00:05:00Z");
    const soir = new Date("2026-09-24T23:55:00Z");
    expect(depuisPourPeriode("jour", matin)).toBe(depuisPourPeriode("jour", soir));
  });

  it("traverse correctement un changement de mois", () => {
    const premierMars = new Date("2026-03-01T10:00:00Z");
    expect(depuisPourPeriode("semaine", premierMars)).toBe("2026-02-23");
  });
});
