import { getLocale, traduire } from "@/lib/i18n";
import { SECTIONS_REGLES } from "@/lib/game/regles";
import { RevoirGuide } from "@/components/RevoirGuide";

/**
 * Règles du jeu (docs/A-INTEGRER.md §27 C) — page publique, lisible sans
 * compte (un visiteur curieux peut comprendre le jeu avant de s'inscrire).
 * Accessible depuis un lien discret de la barre du haut.
 */
export default async function ReglesPage() {
  const locale = await getLocale();
  return (
    <main className="screen nobar" aria-label={traduire(locale, "regles.titre")}>
      <article className="center-card regles">
        <h1 className="h2">{traduire(locale, "regles.titre")}</h1>
        <p className="note">{traduire(locale, "regles.intro")}</p>
        {SECTIONS_REGLES.map((s) => (
          <section key={s.id} id={s.id} className="regles-section">
            <h2 className="h3">{s.titre[locale]}</h2>
            {s.paragraphes[locale].map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        ))}
        <div>
          <RevoirGuide locale={locale} />
        </div>
      </article>
    </main>
  );
}
