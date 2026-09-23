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
