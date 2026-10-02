import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { nePlusSuivreVille, suivreVille } from "@/app/suivi/actions";

/**
 * « Suivre » / « Ne plus suivre » une ville (A-INTEGRER §26 D). Composant
 * serveur : un simple formulaire vers l'action serveur. À n'afficher que
 * pour la ville d'un AUTRE joueur, connecté.
 */
export function BoutonSuivre({
  locale,
  villeId,
  suivie,
  quotaAtteint = false,
}: {
  locale: Locale;
  villeId: string;
  suivie: boolean;
  /** Vrai si la liste est pleine : « Suivre » est alors désactivé (le serveur refuserait). */
  quotaAtteint?: boolean;
}) {
  return (
    <form action={suivie ? nePlusSuivreVille : suivreVille}>
      <input type="hidden" name="villeId" value={villeId} />
      <button className="btn small" type="submit" disabled={!suivie && quotaAtteint} aria-pressed={suivie}>
        {suivie ? `★ ${traduire(locale, "suivi.nePlusSuivre")}` : `☆ ${traduire(locale, "suivi.suivre")}`}
      </button>
    </form>
  );
}
