/**
 * Dictionnaires fr/en. Règle du projet (GUIDE-METHODE.md §9) : toute
 * chaîne affichée passe par une clé, et les deux traductions sont
 * remplies au même moment que la clé est créée — jamais de clé
 * orpheline. La parité fr/en est vérifiée par
 * tests/unit/dictionaries.test.ts.
 */

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const dictionaries = {
  fr: {
    "accueil.titre": "jeu_miniville",
    "accueil.nomProvisoire": "(nom provisoire)",
    "accueil.description":
      "Développe ta ville, fais vivre ton pays, pèse sur les décisions internationales.",
    "accueil.creerCompte": "Créer un compte",
    "accueil.seConnecter": "Se connecter",
    "accueil.voirMaVille": "Voir ma ville",

    "nav.langue": "Langue",
    "nav.seDeconnecter": "Se déconnecter",

    "inscription.titre": "Créer un compte",
    "inscription.email": "Adresse e-mail",
    "inscription.motDePasse": "Mot de passe",
    "inscription.bouton": "Créer mon compte",
    "inscription.dejaCompte": "Déjà un compte ?",
    "inscription.confirmationEnvoyee":
      "Compte créé. Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.",
    "inscription.lienConnexion": "Se connecter",

    "connexion.titre": "Se connecter",
    "connexion.email": "Adresse e-mail",
    "connexion.motDePasse": "Mot de passe",
    "connexion.bouton": "Se connecter",
    "connexion.pasDeCompte": "Pas encore de compte ?",
    "connexion.lienInscription": "Créer un compte",
    "connexion.erreur": "Adresse e-mail ou mot de passe incorrect.",

    "creationVille.titre": "Naître quelque part",
    "creationVille.introduction":
      "Dernière étape : choisis ton pseudo, le nom de ta ville, et le pays qui l'accueille.",
    "creationVille.pseudo": "Ton pseudo",
    "creationVille.nomVille": "Nom de ta ville",
    "creationVille.pays": "Pays",
    "creationVille.paysPlaceholder": "Choisis un pays",
    "creationVille.bouton": "Fonder ma ville",
    "creationVille.erreurChamps": "Merci de remplir tous les champs.",
    "creationVille.erreurGenerique":
      "La création de ta ville a échoué. Réessaie dans un instant.",

    "ville.population": "Population",
    "ville.influence": "Influence",
    "ville.activite": "Activité",
    "ville.niveau": "Niveau",
    "ville.pays": "Pays",

    "niveau.0": "Hameau",
    "niveau.1": "Village",
    "niveau.2": "Bourg",
    "niveau.3": "Ville",
    "niveau.4": "Grande ville",
    "niveau.5": "Métropole",

    "erreurs.connexionRequise": "Connecte-toi pour accéder à cette page.",
  },
  en: {
    "accueil.titre": "jeu_miniville",
    "accueil.nomProvisoire": "(working title)",
    "accueil.description":
      "Grow your city, bring your country to life, and weigh in on international decisions.",
    "accueil.creerCompte": "Create an account",
    "accueil.seConnecter": "Log in",
    "accueil.voirMaVille": "See my city",

    "nav.langue": "Language",
    "nav.seDeconnecter": "Log out",

    "inscription.titre": "Create an account",
    "inscription.email": "Email address",
    "inscription.motDePasse": "Password",
    "inscription.bouton": "Create my account",
    "inscription.dejaCompte": "Already have an account?",
    "inscription.confirmationEnvoyee":
      "Account created. Check your inbox to confirm your address, then log in.",
    "inscription.lienConnexion": "Log in",

    "connexion.titre": "Log in",
    "connexion.email": "Email address",
    "connexion.motDePasse": "Password",
    "connexion.bouton": "Log in",
    "connexion.pasDeCompte": "No account yet?",
    "connexion.lienInscription": "Create an account",
    "connexion.erreur": "Wrong email address or password.",

    "creationVille.titre": "Born somewhere",
    "creationVille.introduction":
      "Last step: pick your nickname, your city's name, and the country that hosts it.",
    "creationVille.pseudo": "Your nickname",
    "creationVille.nomVille": "Your city's name",
    "creationVille.pays": "Country",
    "creationVille.paysPlaceholder": "Pick a country",
    "creationVille.bouton": "Found my city",
    "creationVille.erreurChamps": "Please fill in every field.",
    "creationVille.erreurGenerique":
      "Creating your city failed. Please try again in a moment.",

    "ville.population": "Population",
    "ville.influence": "Influence",
    "ville.activite": "Activity",
    "ville.niveau": "Level",
    "ville.pays": "Country",

    "niveau.0": "Hamlet",
    "niveau.1": "Village",
    "niveau.2": "Town",
    "niveau.3": "City",
    "niveau.4": "Big city",
    "niveau.5": "Metropolis",

    "erreurs.connexionRequise": "Log in to access this page.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type DictionaryKey = keyof (typeof dictionaries)["fr"];

export function traduire(locale: Locale, cle: DictionaryKey): string {
  return dictionaries[locale][cle];
}
