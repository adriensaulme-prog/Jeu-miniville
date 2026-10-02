import { notFound } from "next/navigation";
import { ShowroomClient } from "./ShowroomClient";

// Outil de développement (docs/BATIMENTS-ET-PACKS.md §2) : jamais dans
// le jeu publié, jamais lié depuis la navigation. En production la page
// n'existe pas (404) : l'outil sert uniquement en local, pour juger les
// modèles de bâtiments (voir docs/GUIDE-METHODE.md).
export default function ShowroomPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ShowroomClient />;
}
