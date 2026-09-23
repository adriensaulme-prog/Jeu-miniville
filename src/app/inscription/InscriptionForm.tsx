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
    return (
      <p className="rounded bg-green-50 p-4 text-green-800">
        {traduire(locale, "inscription.confirmationEnvoyee")}
      </p>
    );
  }

  return (
    <form onSubmit={envoyer} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {traduire(locale, "inscription.email")}
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {traduire(locale, "inscription.motDePasse")}
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>
      {erreur ? <p className="text-sm text-red-600">{erreur}</p> : null}
      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {traduire(locale, "inscription.bouton")}
      </button>
    </form>
  );
}
