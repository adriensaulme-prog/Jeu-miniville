import { defineConfig } from "@playwright/test";

// Charge .env.local (clés Supabase) pour les tests qui parlent
// directement à l'API admin Supabase (service_role), en plus du
// serveur Next.js lancé ci-dessous qui les charge lui-même.
process.loadEnvFile(".env.local");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
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
