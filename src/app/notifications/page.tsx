import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, traduire } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { exigerRegionChoisie } from "@/lib/supabase/gardes";
import { libelleJournal, type LigneJournal } from "@/components/journal";

const TAILLE = 50;

/**
 * Centre de notifications (docs/A-INTEGRER.md §26 B, cahier des charges
 * §23) : ce qui concerne ma ville et mon pays ces 30 derniers jours —
 * présidence gagnée ou perdue, guerres, alliances, réussites et attaques
 * subies. Lecture de notifications_joueur() (migration 0042) ; le « non
 * lu » est affiché UNE fois, puis la page marque tout comme lu.
 * Notifications poussées du navigateur : chantier à part (permissions,
 * abonnement, envoi), non fait ici.
 */
export default async function NotificationsPage() {
  const locale = await getLocale();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profil } = await supabase.from("users").select("id, country_id").eq("id", user.id).maybeSingle();
  if (!profil) redirect("/ville/creer");
  await exigerRegionChoisie(supabase, user.id);

  const colonneNomPays = locale === "fr" ? "nom_fr" : "nom_en";
  const { data: paysBruts } = await supabase.from("countries").select(`id, nom:${colonneNomPays}`);
  const noms = new Map((paysBruts ?? []).map((p) => [p.id as string, p.nom as string]));
  const nomPays = (id: string) => noms.get(id) ?? id;

  const { data } = await supabase.rpc("notifications_joueur", { p_joueur_id: user.id, p_limite: TAILLE });
  const lignes = ((data ?? []) as LigneJournal[])
    .map((l) => ({ l, texte: libelleJournal(locale, l, nomPays, profil!.country_id as string) }))
    .filter((x): x is { l: LigneJournal; texte: string } => x.texte !== null);

  // Tout ce qui vient d'être affiché est désormais lu (le « non lu » ci-dessus reste visible cette fois).
  await supabaseAdmin.rpc("marquer_notifications_lues", { p_joueur_id: user.id });

  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });

  return (
    <main className="screen" aria-label={traduire(locale, "notifications.titre")}>
      <article className="center-card regles">
        <h1 className="h2">{traduire(locale, "notifications.titre")}</h1>
        <p className="note">{traduire(locale, "notifications.intro")}</p>
        {lignes.length === 0 ? (
          <p className="empty">{traduire(locale, "notifications.vide")}</p>
        ) : (
          <ol className="journal-liste">
            {lignes.map(({ l, texte }) => (
              <li key={l.id} className={l.non_lue ? "non-lue" : undefined}>
                <time dateTime={l.quand}>{date.format(new Date(l.quand))}</time>
                <span>
                  {l.non_lue ? <b className="badge info">{traduire(locale, "notifications.nouveau")}</b> : null}{" "}
                  {texte}
                  {l.ville_id && l.type === "ville_en_crise" ? (
                    <>
                      {" "}
                      <Link href={`/v/${l.ville_id}`} className="journal-lien">
                        {traduire(locale, "journal.voirLaVille")} →
                      </Link>
                    </>
                  ) : l.ville_id && l.type !== "president_perdu" ? (
                    <>
                      {" "}
                      <Link href="/ville" className="journal-lien">
                        {traduire(locale, "notifications.voirMaVille")} →
                      </Link>
                    </>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        )}
        <p className="note">
          <Link href="/journal" style={{ color: "var(--focus)" }}>
            {traduire(locale, "notifications.voirLeJournal")} →
          </Link>
        </p>
      </article>
    </main>
  );
}
