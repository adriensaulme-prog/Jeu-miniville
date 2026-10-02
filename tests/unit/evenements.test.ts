import { describe, expect, it } from "vitest";
import {
  cheminPartage,
  evenementPartageable,
  libelleEvenement,
  type EvenementBulletin,
} from "@/components/evenements";

/** A-INTEGRER §26 C : texte des événements, partagé bulletin / page publique. */
const evt = (e: Partial<EvenementBulletin>): EvenementBulletin => ({
  id: "e1",
  type: "monument_debloque",
  activite: null,
  type_action: null,
  valeur: null,
  created_at: "2026-10-02T10:00:00Z",
  ...e,
});

describe("libellé des événements", () => {
  it("monument débloqué : palier => nom du monument, dans les deux langues", () => {
    expect(libelleEvenement("fr", evt({ type: "monument_debloque", valeur: 0 }))).toBe("Nouveau monument : Borne commémorative");
    expect(libelleEvenement("en", evt({ type: "monument_debloque", valeur: 0 }))).toBe("New monument: Commemorative marker");
  });

  it("technologie débloquée et mégaprojet construit", () => {
    expect(libelleEvenement("fr", evt({ type: "technologie_debloquee", valeur: 0 }))).toMatch(/^Technologie débloquée : /);
    expect(libelleEvenement("fr", evt({ type: "megaprojet_construit", activite: "commerce" }))).toBe(
      "Mégaprojet construit : 🛒 Commerce"
    );
  });

  it("manifestation, attaque et guerre gardent le texte historique du bulletin", () => {
    expect(libelleEvenement("fr", evt({ type: "manifestation", activite: "commerce", valeur: 3 }))).toBe(
      "Manifestation contre le manque de 🛒 Commerce : −3 population"
    );
    expect(libelleEvenement("fr", evt({ type: "attaque_recue", type_action: "contamination", valeur: 2 }))).toMatch(/— −2$/);
    expect(libelleEvenement("fr", evt({ type: "attaque_recue", type_action: "greve", valeur: 1.26 }))).toMatch(/1,?\.?3? ?h$|1\.3 h$/);
    expect(libelleEvenement("fr", evt({ type: "guerre", valeur: 5 }))).toBe(
      "Perte de population due au conflit en cours : −5 population"
    );
  });

  it("donnée incomplète : pas de texte", () => {
    expect(libelleEvenement("fr", evt({ type: "monument_debloque", valeur: null }))).toBeNull();
    expect(libelleEvenement("fr", evt({ type: "monument_debloque", valeur: 99 }))).toBeNull();
    expect(libelleEvenement("fr", evt({ type: "megaprojet_construit", activite: null }))).toBeNull();
  });
});

describe("événements partageables", () => {
  it("seules les réussites se partagent, jamais les attaques, manifestations ni pertes de guerre", () => {
    expect(evenementPartageable(evt({ type: "monument_debloque", valeur: 3 }))).toBe(true);
    expect(evenementPartageable(evt({ type: "technologie_debloquee", valeur: 0 }))).toBe(true);
    expect(evenementPartageable(evt({ type: "megaprojet_construit", activite: "energie" }))).toBe(true);
    expect(evenementPartageable(evt({ type: "attaque_recue", type_action: "greve", valeur: 2 }))).toBe(false);
    expect(evenementPartageable(evt({ type: "manifestation", activite: "commerce", valeur: 3 }))).toBe(false);
    expect(evenementPartageable(evt({ type: "guerre", valeur: 5 }))).toBe(false);
    // Une réussite sans texte exploitable n'est pas proposée.
    expect(evenementPartageable(evt({ type: "monument_debloque", valeur: 99 }))).toBe(false);
  });

  it("chemin public d'une ville ou d'un événement précis", () => {
    expect(cheminPartage("v1")).toBe("/v/v1");
    expect(cheminPartage("v1", "e1")).toBe("/v/v1?evenement=e1");
  });
});
