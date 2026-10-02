import { ShowroomClient } from "./ShowroomClient";

// Outil de développement (docs/BATIMENTS-ET-PACKS.md §2) : jamais dans
// le jeu publié, jamais lié depuis la navigation. Pas de garde d'accès
// dédiée pour l'instant (même statut que les scripts de villes de test
// — usage local uniquement, voir docs/GUIDE-METHODE.md).
export default function ShowroomPage() {
  return <ShowroomClient />;
}
