"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

export function ConnexionForm({
  locale,
  redirection,
}: {
  locale: Locale;
  redirection?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    setEnCours(false);

    if (error) {
      setErreur(traduire(locale, "connexion.erreur"));
      return;
    }

    router.push(redirection && redirection.startsWith("/") ? redirection : "/ville");
    router.refresh();
  }

  return (
    <form onSubmit={envoyer} className="field">
      <div className="field">
        <label htmlFor="connexionEmail">{traduire(locale, "connexion.email")}</label>
        <input
          id="connexionEmail"
          className="input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="connexionMotDePasse">{traduire(locale, "connexion.motDePasse")}</label>
        <input
          id="connexionMotDePasse"
          className="input"
          type="password"
          required
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
      </div>
      {erreur ? <p className="note" style={{ color: "var(--bad)" }}>{erreur}</p> : null}
      <button type="submit" disabled={enCours} className="btn primary block">
        {traduire(locale, "connexion.bouton")}
      </button>
    </form>
  );
}
