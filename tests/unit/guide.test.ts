import { describe, expect, it } from "vitest";
import { ETAPES_GUIDE, JOURS_NOUVEAU_JOUEUR, estNouveauJoueur, pageDuGuide } from "@/lib/game/guide";
import { dictionaries, locales } from "@/lib/i18n/dictionaries";

/** A-INTEGRER §26 F : parcours de découverte des nouveaux joueurs. */
describe("guide de démarrage", () => {
  it("chaque étape a un texte (et un libellé de lien) dans toutes les langues", () => {
    expect(ETAPES_GUIDE.length).toBe(5);
    for (const l of locales) {
      const d = dictionaries[l] as Record<string, string>;
      for (const e of ETAPES_GUIDE) {
        expect(d[e.texte]?.trim().length).toBeGreaterThan(10);
        if (e.lien) expect(d[e.lien.libelle]?.trim().length).toBeGreaterThan(2);
      }
      for (const cle of ["guide.titre", "guide.suivant", "guide.passer", "guide.terminer", "guide.revoir"]) {
        expect(d[cle]?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("la carte ne s'affiche que sur les écrans du jeu", () => {
    for (const p of ["/ville", "/villes", "/jumelages", "/classement", "/palmares", "/pays", "/villes/x"]) {
      expect(pageDuGuide(p), p).toBe(true);
    }
    for (const p of ["/", "/connexion", "/inscription", "/regles", "/ville/creer", "/ville/region", "/ville/noms", "/dev/showroom"]) {
      expect(pageDuGuide(p), p).toBe(false);
    }
    expect(pageDuGuide(null)).toBe(false);
  });

  it("un compte est nouveau pendant 14 jours, pas après", () => {
    const maintenant = new Date("2026-10-20T12:00:00Z");
    const il = (jours: number) => new Date(maintenant.getTime() - jours * 86_400_000).toISOString();
    expect(estNouveauJoueur(il(0), maintenant)).toBe(true);
    expect(estNouveauJoueur(il(JOURS_NOUVEAU_JOUEUR - 1), maintenant)).toBe(true);
    expect(estNouveauJoueur(il(JOURS_NOUVEAU_JOUEUR + 1), maintenant)).toBe(false);
    expect(estNouveauJoueur(undefined, maintenant)).toBe(false);
    expect(estNouveauJoueur("pas une date", maintenant)).toBe(false);
  });
});
