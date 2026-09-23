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
    <form onSubmit={envoyer} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {traduire(locale, "connexion.email")}
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
        {traduire(locale, "connexion.motDePasse")}
        <input
          type="password"
          required
          autoComplete="current-password"
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
        {traduire(locale, "connexion.bouton")}
      </button>
    </form>
  );
}
