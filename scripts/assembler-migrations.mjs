// Assemble toutes les migrations de supabase/migrations/ en UN seul fichier SQL,
// dans l'ordre numérique, pour initialiser un projet Supabase NEUF (production)
// d'un seul collage dans l'éditeur SQL.
//
//   npm run schema:complet            -> écrit supabase/schema-complet.sql
//   node scripts/assembler-migrations.mjs chemin/sortie.sql
//
// Le fichier produit n'est pas versionné (voir .gitignore) : il se régénère à
// la demande, il ne peut donc jamais être en retard sur les migrations.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dossier = join(process.cwd(), "supabase", "migrations");
const sortie = process.argv[2] ?? join(process.cwd(), "supabase", "schema-complet.sql");

const fichiers = readdirSync(dossier)
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();

// Les numéros doivent se suivre sans trou : un trou signalerait une migration oubliée.
fichiers.forEach((f, i) => {
  const attendu = String(i + 1).padStart(4, "0");
  if (!f.startsWith(attendu + "_")) {
    throw new Error(`Migration manquante ou mal numérotée : attendu ${attendu}_…, trouvé ${f}`);
  }
});

const morceaux = fichiers.map(
  (f) => `-- =====================================================================\n-- ${f}\n-- =====================================================================\n\n${readFileSync(join(dossier, f), "utf-8").trim()}\n`
);
const entete = `-- jeu_miniville : schéma complet (${fichiers.length} migrations, ${fichiers[0]} -> ${fichiers.at(-1)}).\n-- Généré par scripts/assembler-migrations.mjs — à coller en une fois dans l'éditeur SQL d'un projet Supabase NEUF,\n-- puis exécuter : notify pgrst, 'reload schema';\n\n`;
writeFileSync(sortie, entete + morceaux.join("\n"), "utf-8");
console.log(`${fichiers.length} migrations assemblées -> ${sortie}`);
