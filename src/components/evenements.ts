import { traduire, type Locale } from "@/lib/i18n/dictionaries";
import { EMOJI_ACTIVITE } from "@/components/JaugesActivites";
import type { Activite } from "@/lib/game/activites";
import { typeTechnologie } from "@/lib/game/technologies";
import { typeMonument } from "@/lib/game/monuments";

/**
 * Événements d'une ville (table city_events, lecture publique) et leur
 * texte lisible — partagé par le bulletin municipal (Jalon 18) et la page
 * publique d'une ville (A-INTEGRER §26 C). Jamais de nombre codé en dur
 * dans une chaîne traduite : toujours interpolé autour des libellés.
 */
export interface EvenementBulletin {
  id: string;
  type:
    | "manifestation"
    | "attaque_recue"
    | "megaprojet_construit"
    | "technologie_debloquee"
    | "monument_debloque"
    | "guerre";
  activite: Activite | null;
  type_action: "greve" | "contamination" | "propagande" | null;
  valeur: number | null;
  created_at: string;
}

/** Texte d'un événement, ou null s'il n'a pas de rendu (donnée incomplète). */
export function libelleEvenement(locale: Locale, e: EvenementBulletin): string | null {
  const pop = traduire(locale, "ville.population").toLowerCase();
  if (e.type === "manifestation" && e.activite) {
    return `${traduire(locale, "bulletin.manifestation")} ${EMOJI_ACTIVITE[e.activite]} ${traduire(locale, `activite.${e.activite}`)} : −${e.valeur} ${pop}`;
  }
  if (e.type === "attaque_recue" && e.type_action) {
    const base = traduire(locale, `villes.${e.type_action}`);
    if (e.type_action === "greve" && e.valeur != null) {
      return `${base} — ${traduire(locale, "villes.antiVilleDureeBlocage").toLowerCase()} ${Math.round(e.valeur * 10) / 10} h`;
    }
    return e.valeur != null ? `${base} — −${e.valeur}` : base;
  }
  if (e.type === "megaprojet_construit" && e.activite) {
    return `${traduire(locale, "bulletin.megaprojetConstruit")} ${EMOJI_ACTIVITE[e.activite]} ${traduire(locale, `activite.${e.activite}`)}`;
  }
  if (e.type === "technologie_debloquee" && e.valeur != null && typeTechnologie(e.valeur)) {
    return `${traduire(locale, "bulletin.technologieDebloquee")} ${traduire(locale, `technologie.type.${typeTechnologie(e.valeur)!}`)}`;
  }
  if (e.type === "monument_debloque" && e.valeur != null && typeMonument(e.valeur)) {
    return `${traduire(locale, "bulletin.monumentDebloque")} ${traduire(locale, `monument.type.${typeMonument(e.valeur)!}`)}`;
  }
  if (e.type === "guerre" && e.valeur != null) {
    return `${traduire(locale, "bulletin.guerre")} : −${e.valeur} ${pop}`;
  }
  return null;
}

/**
 * Événements qu'un joueur a envie de partager : les réussites (mégaprojet
 * construit, technologie, monument). Les attaques subies, manifestations
 * et pertes de guerre restent dans le bulletin, sans bouton de partage.
 */
export function evenementPartageable(e: EvenementBulletin): boolean {
  return (
    (e.type === "megaprojet_construit" || e.type === "technologie_debloquee" || e.type === "monument_debloque") &&
    libelleEvenement("fr", e) !== null
  );
}

/** Chemin public d'une ville, ou d'un événement précis de cette ville. */
export function cheminPartage(villeId: string, evenementId?: string): string {
  return evenementId ? `/v/${villeId}?evenement=${evenementId}` : `/v/${villeId}`;
}
