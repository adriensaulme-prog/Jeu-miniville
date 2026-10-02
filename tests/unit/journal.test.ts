import { describe, expect, it } from "vitest";
import { libelleJournal, type LigneJournal } from "@/components/journal";

/** A-INTEGRER §26 A/B : texte du journal du monde et des notifications. */
const pays: Record<string, string> = { FR: "France", DE: "Allemagne", EE: "Estonie" };
const nomPays = (id: string) => pays[id] ?? id;
const ligne = (l: Partial<LigneJournal>): LigneJournal => ({
  id: "x",
  type: "alliance",
  quand: "2026-10-02T10:00:00Z",
  ville_id: null,
  ville_nom: null,
  country_id: null,
  cible_country_id: null,
  autre_ville_nom: null,
  valeur: null,
  activite: null,
  type_action: null,
  resultat: null,
  ...l,
});

describe("libellé du journal", () => {
  it("présidence : la ville, le pays et l'ancienne n°1", () => {
    const l = ligne({ type: "president", ville_nom: "Lyon", country_id: "FR", autre_ville_nom: "Paris" });
    expect(libelleJournal("fr", l, nomPays)).toBe("Lyon prend la tête de France, devant Paris.");
    expect(libelleJournal("en", l, nomPays)).toBe("Lyon takes the lead in France, ahead of Paris.");
  });

  it("présidence vue par son propriétaire (notifications)", () => {
    expect(libelleJournal("fr", ligne({ type: "president_acquis", ville_nom: "Lyon", country_id: "FR" }), nomPays)).toBe(
      "Ta ville Lyon prend la tête de France."
    );
    expect(
      libelleJournal("fr", ligne({ type: "president_perdu", ville_nom: "Lyon", country_id: "FR", autre_ville_nom: "Paris" }), nomPays)
    ).toBe("Ta ville Lyon perd la tête de France au profit de Paris.");
    // Sans successeur connu, une phrase qui reste correcte.
    expect(libelleJournal("fr", ligne({ type: "president_perdu", ville_nom: "Lyon", country_id: "FR" }), nomPays)).toBe(
      "Ta ville Lyon n'est plus la première de France."
    );
  });

  it("une ville qui est son propre prédécesseur n'est pas une nouvelle de présidence", () => {
    const meme = ligne({ type: "president", ville_nom: "Lyon", country_id: "FR", autre_ville_nom: "Lyon" });
    expect(libelleJournal("fr", meme, nomPays)).toBeNull();
    expect(libelleJournal("fr", ligne({ type: "president", ville_nom: "Lyon", country_id: "FR" }), nomPays)).toBeNull();
    const perdu = ligne({ type: "president_perdu", ville_nom: "Lyon", country_id: "FR", autre_ville_nom: "Lyon" });
    expect(libelleJournal("fr", perdu, nomPays)).toBe("Ta ville Lyon n'est plus la première de France.");
  });

  it("guerre déclarée : neutre dans le journal, personnalisée pour un joueur du pays concerné", () => {
    const l = ligne({ type: "guerre_declaree", country_id: "FR", cible_country_id: "DE" });
    expect(libelleJournal("fr", l, nomPays)).toBe("France déclare la rivalité à Allemagne : un conflit s'ouvre.");
    expect(libelleJournal("fr", l, nomPays, "FR")).toBe("Ton pays (France) entre en conflit avec Allemagne.");
    expect(libelleJournal("fr", l, nomPays, "DE")).toBe("France attaque ton pays : un conflit s'ouvre.");
    expect(libelleJournal("fr", l, nomPays, "EE")).toBe("France déclare la rivalité à Allemagne : un conflit s'ouvre.");
  });

  it("guerre terminée : les trois issues", () => {
    const base = { type: "guerre_terminee" as const, country_id: "FR", cible_country_id: "DE" };
    expect(libelleJournal("fr", ligne({ ...base, resultat: "attaquant" }), nomPays)).toBe(
      "France l'emporte sur Allemagne à l'issue du conflit."
    );
    expect(libelleJournal("fr", ligne({ ...base, resultat: "defenseur" }), nomPays)).toBe(
      "Allemagne résiste et l'emporte sur France à l'issue du conflit."
    );
    expect(libelleJournal("fr", ligne({ ...base, resultat: "egalite" }), nomPays)).toBe(
      "Le conflit entre France et Allemagne se termine sur une égalité."
    );
  });

  it("alliance", () => {
    expect(libelleJournal("en", ligne({ type: "alliance", country_id: "FR", cible_country_id: "DE" }), nomPays)).toBe(
      "France and Allemagne form an alliance."
    );
  });

  it("événement de ville : nommé dans le journal public, sans le nom dans les notifications", () => {
    const l = ligne({ type: "monument_debloque", ville_nom: "Lyon", valeur: 9 });
    expect(libelleJournal("fr", l, nomPays)).toBe("Lyon — Nouveau monument : Mur des remerciements");
    expect(libelleJournal("fr", { ...l, non_lue: false }, nomPays)).toBe("Nouveau monument : Mur des remerciements");
  });

  it("donnée incomplète : pas de texte (la ligne est écartée par la page)", () => {
    expect(libelleJournal("fr", ligne({ type: "monument_debloque", ville_nom: "Lyon", valeur: 99 }), nomPays)).toBeNull();
  });
});
