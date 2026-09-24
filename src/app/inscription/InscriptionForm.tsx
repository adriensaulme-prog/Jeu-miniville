"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { traduire, type Locale } from "@/lib/i18n/dictionaries";

export function InscriptionForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
    });

    setEnCours(false);

    if (error) {
      setErreur(error.message);
      return;
    }

    setSucces(true);
  }

  if (succes) {
    return <p className="toast">{traduire(locale, "inscription.confirmationEnvoyee")}</p>;
  }

  return (
    <form onSubmit={envoyer} className="field">
      <div className="field">
        <label htmlFor="inscriptionEmail">{traduire(locale, "inscription.email")}</label>
        <input
          id="inscriptionEmail"
          className="input"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="inscriptionMotDePasse">{traduire(locale, "inscription.motDePasse")}</label>
        <input
          id="inscriptionMotDePasse"
          className="input"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
      </div>
      {erreur ? <p className="note" style={{ color: "var(--bad)" }}>{erreur}</p> : null}
      <button type="submit" disabled={enCours} className="btn primary block">
        {traduire(locale, "inscription.bouton")}
      </button>
    </form>
  );
}
