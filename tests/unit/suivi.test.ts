import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QUOTA_VILLES_SUIVIES } from "@/lib/game/suivi";

/**
 * Parité TypeScript / SQL du quota de villes suivies
 * (docs/A-INTEGRER.md §26 D) : la dernière migration qui définit
 * suivre_ville() doit refuser à la même valeur que la constante TS.
 */
const dossier = join(process.cwd(), "supabase", "migrations");

describe("quota de villes suivies", () => {
  it("la constante TypeScript est celle de suivre_ville() en SQL", () => {
    const fichiers = readdirSync(dossier)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .reverse();
    const f = fichiers.find((nom) => /function public\.suivre_ville\(/.test(readFileSync(join(dossier, nom), "utf-8")));
    expect(f).toBeDefined();
    const sql = readFileSync(join(dossier, f!), "utf-8");
    const corps = sql.slice(sql.indexOf("function public.suivre_ville("));
    const seuil = /v_nb >= (\d+)/.exec(corps);
    expect(seuil).not.toBeNull();
    expect(Number(seuil![1])).toBe(QUOTA_VILLES_SUIVIES);
    expect(corps).toContain(`(${QUOTA_VILLES_SUIVIES})`);
  });
});
