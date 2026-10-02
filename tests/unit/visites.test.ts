import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QUOTA_VISITE_QUOTIDIEN } from "@/lib/game/visites";

/**
 * Parité TypeScript / SQL du plafond de visites quotidien
 * (docs/A-INTEGRER.md §27 A) : la dernière migration qui définit
 * plafond_visites_quotidien() doit renvoyer la même valeur que la
 * constante TypeScript, et visiter_ville() ne doit plus contenir de
 * littéral en dur dans sa dernière définition.
 */
const dossier = join(process.cwd(), "supabase", "migrations");
const migrations = readdirSync(dossier)
  .filter((f) => f.endsWith(".sql"))
  .sort();

function derniereMigrationDefinissant(motif: RegExp): string {
  const f = [...migrations].reverse().find((nom) => motif.test(readFileSync(join(dossier, nom), "utf-8")));
  if (!f) throw new Error(`Aucune migration ne définit ${motif}`);
  return readFileSync(join(dossier, f), "utf-8");
}

describe("plafond de visites quotidien", () => {
  it("la constante TypeScript est celle de plafond_visites_quotidien() en SQL", () => {
    const sql = derniereMigrationDefinissant(/function public\.plafond_visites_quotidien\(\)/);
    const bloc = sql.slice(sql.indexOf("function public.plafond_visites_quotidien()"));
    const valeur = /select\s+(\d+)\s*;/.exec(bloc);
    expect(valeur).not.toBeNull();
    expect(Number(valeur![1])).toBe(QUOTA_VISITE_QUOTIDIEN);
  });

  it("la dernière définition de visiter_ville() appelle la fonction au lieu d'un littéral", () => {
    const sql = derniereMigrationDefinissant(/function public\.visiter_ville\(/);
    const corps = sql.slice(sql.lastIndexOf("function public.visiter_ville("));
    expect(corps).toMatch(/v_nb_aujourdhui >= public\.plafond_visites_quotidien\(\)/);
    expect(corps).not.toMatch(/v_nb_aujourdhui >= \d/);
  });
});
