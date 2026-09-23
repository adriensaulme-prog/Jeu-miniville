"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { estLocaleValide, LOCALE_COOKIE } from ".";

/** Change la langue (cookie 1 an) et revient sur la page d'origine. */
export async function definirLocale(formData: FormData) {
  const locale = formData.get("locale");
  const retour = formData.get("retour");

  if (typeof locale === "string" && estLocaleValide(locale)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  redirect(typeof retour === "string" && retour ? retour : "/");
}
