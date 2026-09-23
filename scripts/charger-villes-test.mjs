#!/usr/bin/env node
// Charge supabase/seed/villes-de-test.json dans Supabase : des villes
// fictives (is_test = true) pour tester rendu, classements et
// interactions sans attendre de vrais joueurs — voir
// docs/GUIDE-METHODE.md, section "Les villes de test".
//
// JAMAIS EN PRODUCTION. Aucun garde-fou automatique ne peut encore le
// garantir : ce projet n'a qu'un seul environnement Supabase pour
// l'instant (voir docs/DECISIONS.md §10 point 8/9 sur le déploiement).
// Quand un vrai projet de production existera, distinct de celui de
// dev/recette, ne fais tourner ce script que contre celui de dev/recette.
//
// Idempotent : supprime d'abord toutes les villes/comptes is_test
// existants avant de recharger depuis le JSON, donc rejouable à volonté.
//
// Usage : node scripts/charger-villes-test.mjs

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

process.loadEnvFile(".env.local");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const cheminSeed = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "seed",
  "villes-de-test.json"
);

function domainePourAuth(id) {
  return `${id}@test.jeu-miniville.local`;
}

function niveauPourPopulation(population) {
  if (population >= 100000) return 5;
  if (population >= 40000) return 4;
  if (population >= 15000) return 3;
  if (population >= 5000) return 2;
  if (population >= 1000) return 1;
  return 0;
}

async function supprimerVillesDeTestExistantes() {
  const { data: profils, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("is_test", true);
  if (error) throw new Error(`Lecture des profils de test : ${error.message}`);

  for (const profil of profils ?? []) {
    const { error: erreurSuppression } = await supabaseAdmin.auth.admin.deleteUser(profil.id);
    if (erreurSuppression) {
      throw new Error(`Suppression du compte de test ${profil.id} : ${erreurSuppression.message}`);
    }
  }
  console.log(`Villes de test précédentes supprimées : ${(profils ?? []).length}.`);
}

async function creerVilleDeTest(ville) {
  const { data: authData, error: erreurAuth } = await supabaseAdmin.auth.admin.createUser({
    email: domainePourAuth(ville.id),
    password: `test-${ville.id}-${Math.random().toString(36).slice(2)}`,
    email_confirm: true,
  });
  if (erreurAuth || !authData.user) {
    throw new Error(`Création du compte auth pour ${ville.id} : ${erreurAuth?.message}`);
  }
  const userId = authData.user.id;

  const paysId = ville.pays.toUpperCase();
  const niveau = niveauPourPopulation(ville.population);

  const { error: erreurProfil } = await supabaseAdmin.from("users").insert({
    id: userId,
    pseudo: ville.pseudo,
    country_id: paysId,
    is_test: true,
  });
  if (erreurProfil) {
    throw new Error(`Création du profil pour ${ville.id} : ${erreurProfil.message}`);
  }

  const { data: villeCreee, error: erreurVille } = await supabaseAdmin
    .from("cities")
    .insert({
      nom: ville.ville,
      owner_id: userId,
      country_id: paysId,
      population: ville.population,
      population_max: ville.population,
      influence: ville.influence,
      activite: ville.activite_7j ?? 0,
      niveau,
      is_test: true,
    })
    .select("id")
    .single();
  if (erreurVille) {
    throw new Error(`Création de la ville ${ville.id} : ${erreurVille.message}`);
  }

  const { error: erreurCityId } = await supabaseAdmin
    .from("users")
    .update({ city_id: villeCreee.id })
    .eq("id", userId);
  if (erreurCityId) {
    throw new Error(`Rattachement de la ville à l'utilisateur ${ville.id} : ${erreurCityId.message}`);
  }

  return villeCreee.id;
}

async function chargerJumelages(jumelages, idVilleParCleTest) {
  const STATUT_JSON_VERS_DB = {
    accepte: "actif",
    en_attente: "en_attente",
    refuse: "refuse",
  };

  for (const j of jumelages ?? []) {
    const villeProposanteId = idVilleParCleTest.get(j.ville);
    const villeCibleeId = idVilleParCleTest.get(j.cible);
    if (!villeProposanteId || !villeCibleeId) {
      console.warn(`Jumelage ignoré (ville inconnue) : ${j.ville} -> ${j.cible}`);
      continue;
    }
    const statut = STATUT_JSON_VERS_DB[j.statut] ?? "en_attente";
    const { error } = await supabaseAdmin.from("jumelages").insert({
      ville_proposante_id: villeProposanteId,
      ville_ciblee_id: villeCibleeId,
      statut,
      accepte_le: statut === "actif" ? new Date().toISOString() : null,
    });
    if (error) {
      console.warn(`Jumelage ${j.ville} -> ${j.cible} non chargé : ${error.message}`);
    }
  }
}

async function main() {
  const brut = await readFile(cheminSeed, "utf-8");
  const seed = JSON.parse(brut);

  await supprimerVillesDeTestExistantes();

  const idVilleParCleTest = new Map();
  for (const ville of seed.villes) {
    const id = await creerVilleDeTest(ville);
    idVilleParCleTest.set(ville.id, id);
    console.log(`Créée : ${ville.ville} (${ville.id}) — ${ville.stade_attendu}`);
  }

  await chargerJumelages(seed.jumelages, idVilleParCleTest);

  console.log(
    `\n${seed.villes.length} villes de test chargées, ${(seed.jumelages ?? []).length} jumelages tentés.`
  );
  console.log(
    "Note : seed.presidents_attendus n'est pas encore exploité (concept 'président' pas encore implémenté)."
  );
}

main().catch((err) => {
  console.error("Échec du chargement des villes de test :", err.message);
  process.exit(1);
});
