import { defineConfig } from "@playwright/test";

// Charge .env.local (clés Supabase) pour les tests qui parlent
// directement à l'API admin Supabase (service_role), en plus du
// serveur Next.js lancé ci-dessous qui les charge lui-même.
process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Depuis le Jalon 6bis, /ville pèse ~150 Ko de JS rien que pour
  // Three.js : trop de requêtes simultanées dessus la toute première
  // fois (avant que le serveur de dev ne l'ait compilée à la demande)
  // font échouer les tests par pur effet de charge, pas un vrai bug —
  // voir docs/DECISIONS.md §4, journal du Jalon 6bis.
  workers: 2,
  // /ville enchaîne ~26 appels Supabase séquentiels (≈100-400 ms chacun) :
  // plusieurs secondes de rendu, donc le délai par défaut de 5 s des
  // assertions (toHaveURL après connexion) était dépassé — la vraie
  // « flakiness de connexion » documentée depuis des jours. Délai
  // allongé en attendant de paralléliser ces appels (voir
  // docs/DECISIONS.md §4, journal du préchauffage).
  expect: { timeout: 20_000 },
  // Délai global d'un test (30 s par défaut) : trop court pour un scénario
  // qui enchaîne plusieurs pages lentes (login + /villes + actions).
  timeout: 60_000,
  // Préchauffe les pages (compilation à la demande du serveur de dev),
  // voir tests/e2e/prechauffage.ts.
  globalSetup: "./tests/e2e/prechauffage.ts",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
