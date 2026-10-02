import Link from "next/link";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { libelleJournal, type LigneJournal } from "@/components/journal";

const TAILLE = 60;

/**
 * Journal du monde (docs/A-INTEGRER.md §26 A, cahier des charges §22) :
 * un fil public, sans connexion, des faits importants à l'échelle du jeu —
 * changements de présidence, guerres, alliances, mégaprojets, grands
 * monuments. Lecture pure de journal_monde() (migration 0042).
 */
export default async function JournalPage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";

  const { data: paysBruts } = await supabase.from("countries").select(`id, nom:${colonneNomPays}`);
  const noms = new Map((paysBruts ?? []).map((p) => [p.id as string, p.nom as string]));
  const nomPays = (id: string) => noms.get(id) ?? id;

  const { data } = await supabase.rpc("journal_monde", { p_limite: TAILLE });
  const lignes = ((data ?? []) as LigneJournal[])
    .map((l) => ({ l, texte: libelleJournal(locale, l, nomPays) }))
    .filter((x): x is { l: LigneJournal; texte: string } => x.texte !== null);

  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });

  return (
    <main className="screen" aria-label={traduire(locale, "journal.titre")}>
      <article className="center-card regles">
        <h1 className="h2">{traduire(locale, "journal.titre")}</h1>
        <p className="note">{traduire(locale, "journal.intro")}</p>
        {lignes.length === 0 ? (
          <p className="empty">{traduire(locale, "journal.vide")}</p>
        ) : (
          <ol className="journal-liste">
            {lignes.map(({ l, texte }) => (
              <li key={l.id}>
                <time dateTime={l.quand}>{date.format(new Date(l.quand))}</time>
                <span>
                  {texte}
                  {l.ville_id ? (
                    <>
                      {" "}
                      <Link href={`/v/${l.ville_id}`} className="journal-lien">
                        {traduire(locale, "journal.voirLaVille")} →
                      </Link>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        )}
      </article>
    </main>
  );
}
