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
    "nav.maVille": "Ma ville",
    "nav.villes": "Villes",
    "nav.jumelages": "Jumelages",
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

    "villes.titre": "Les villes du monde",
    "villes.introduction":
      "Visite une autre ville pour lui donner +1 population — une seule fois par ville et par jour.",
    "villes.nom": "Ville",
    "villes.pays": "Pays",
    "villes.population": "Population",
    "villes.visiter": "Visiter",
    "villes.dejaVisitee": "Déjà visitée aujourd'hui",
    "villes.aucuneAutreVille": "Il n'y a pas encore d'autre ville à visiter.",
    "villes.influencer": "Influencer",
    "villes.dejaInfluencee": "Déjà influencée aujourd'hui",
    "villes.quotaAtteint": "Quota atteint",
    "villes.actionsRestantes": "Actions d'influence restantes aujourd'hui :",
    "villes.antiVille": "AntiVille",
    "villes.greve": "Grève",
    "villes.greveNote": "bloquée 24 h",
    "villes.contamination": "Contamination",
    "villes.contaminationNote": "−10 % hab.",
    "villes.propagande": "Propagande",
    "villes.propagandeNote": "−2 influence",
    "villes.enGreve": "En grève",
    "villes.protectionActive": "Protection anti-harcèlement active",
    "villes.quotaAntiVilleAtteint": "Quota AntiVille atteint",
    "villes.antiVilleReussie": "Action lancée.",
    "villes.antiVilleReussieEffetReduit":
      "Action lancée, effet réduit de moitié (déjà attaquée récemment).",
    "villes.antiVilleProtection":
      "Bloqué : protection anti-harcèlement active sur cette ville (2 actions déjà lancées contre elle dans les dernières 24h).",
    "villes.antiVilleQuota": "Quota quotidien d'actions AntiVille atteint (3).",
    "villes.antiVilleErreur": "L'action a échoué. Réessaie dans un instant.",
    "villes.proposerJumelage": "Proposer un jumelage",
    "villes.dejaJumelee": "Déjà jumelée",
    "villes.jumelageQuotaAtteint": "Quota de jumelages atteint",
    "villes.jumelagePropose": "Jumelage proposé.",
    "villes.jumelageErreur": "La proposition a échoué. Réessaie dans un instant.",
    "villes.tousLesPays": "Tous les pays",
    "villes.rechercherPlaceholder": "Chercher une ville",
    "villes.retour": "← Toutes les villes",
    "villes.enVisite": "En visite",
    "villes.visiteeAujourdhui": "Visitée aujourd'hui",
    "villes.revenirDemain": "Reviens demain pour un nouvel habitant.",
    "villes.deJoueur": "de",
    "villes.aucuneVilleCorrespondante": "Aucune ville ne correspond.",
    "villes.protegee": "Protégée",
    "villes.protegeeNote":
      "Tu l'as déjà visée deux fois aujourd'hui : ses effets seraient trop réduits.",
    "villes.pasDeDestruction":
      "Une attaque ne détruit jamais de bâtiment : la ville reste dessinée à son record d'habitants.",
    "villes.maVille": "Ma ville",
    "villes.jumelee": "Jumelée",

    "classement.president": "Président",
    "classement.dans": "de",

    "ciel.jour": "jour",
    "ciel.leverDuSoleil": "lever du soleil",
    "ciel.coucherDuSoleil": "coucher du soleil",
    "ciel.aube": "aube",
    "ciel.crepuscule": "crépuscule",
    "ciel.nuit": "nuit",

    "ville.stadeMaximal": "Stade maximal",
    "ville.seuilA": "à",
    "ville.habitantsAbrege": "hab.",

    "jumelages.titre": "Mes jumelages",
    "jumelages.introduction":
      "Un jumelage actif donne +1 population aux deux villes chaque jour où les deux joueurs sont actifs. 3 jumelages actifs maximum par ville.",
    "jumelages.bonusAccordes": "Bonus de jumelage accordé aujourd'hui à",
    "jumelages.actifs": "Jumelages actifs",
    "jumelages.recues": "Demandes reçues",
    "jumelages.envoyees": "Demandes envoyées",
    "jumelages.aucunJumelageActif": "Aucun jumelage actif pour l'instant.",
    "jumelages.aucuneDemandeRecue": "Aucune demande reçue.",
    "jumelages.aucuneDemandeEnvoyee": "Aucune demande envoyée.",
    "jumelages.accepter": "Accepter",
    "jumelages.refuser": "Refuser",
    "jumelages.annuler": "Annuler",
    "jumelages.depuisLe": "depuis le",
    "jumelages.jumeleeAvecTaVille": "Jumelée avec ta ville",
    "jumelages.demandeEnvoyee": "Demande envoyée",
    "jumelages.voir": "Voir",
    "jumelages.bonusAujourdhui": "+1 habitant aujourd'hui",

    "creationVille.note":
      "Ta ville naîtra au croisement de deux routes, avec une première maison. Son plan est unique et ne changera plus : c'est celui que tu vois derrière.",
    "creationVille.region": "Ta région",
    "creationVille.regionPlaceholder": "Choisis une région",

    "nav.classement": "Classement",

    "classement.titre": "Se classer",
    "classement.mondial": "Mondial",
    "classement.national": "National",
    "classement.regional": "Régional",
    "classement.maPosition": "Ma position",
    "classement.aucuneVille": "Aucune ville dans ce classement pour l'instant.",

    "region.titre": "Choisis ta région",
    "region.introduction":
      "Les villes de ton pays sont aussi classées par région : choisis celle qui correspond à ta ville.",
    "region.bouton": "Confirmer ma région",
    "region.erreurGenerique": "Le choix de région a échoué. Réessaie dans un instant.",
    "region.actuelle": "Région",
    "region.changerTitre": "Changer de région",
    "region.changerBouton": "Changer",
    "region.changerNote": "Possible une fois tous les 30 jours.",
    "region.delaiRestant": "Prochain changement possible dans",
    "region.jours": "jours",

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
    "nav.maVille": "My city",
    "nav.villes": "Cities",
    "nav.jumelages": "Twinnings",
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

    "villes.titre": "The world's cities",
    "villes.introduction":
      "Visit another city to give it +1 population — once per city, per day.",
    "villes.nom": "City",
    "villes.pays": "Country",
    "villes.population": "Population",
    "villes.visiter": "Visit",
    "villes.dejaVisitee": "Already visited today",
    "villes.aucuneAutreVille": "There's no other city to visit yet.",
    "villes.influencer": "Influence",
    "villes.dejaInfluencee": "Already influenced today",
    "villes.quotaAtteint": "Quota reached",
    "villes.actionsRestantes": "Influence actions left today:",
    "villes.antiVille": "AntiVille",
    "villes.greve": "Strike",
    "villes.greveNote": "blocked 24h",
    "villes.contamination": "Contamination",
    "villes.contaminationNote": "−10% res.",
    "villes.propagande": "Propaganda",
    "villes.propagandeNote": "−2 influence",
    "villes.enGreve": "On strike",
    "villes.protectionActive": "Anti-harassment protection active",
    "villes.quotaAntiVilleAtteint": "AntiVille quota reached",
    "villes.antiVilleReussie": "Action launched.",
    "villes.antiVilleReussieEffetReduit":
      "Action launched, effect halved (already attacked recently).",
    "villes.antiVilleProtection":
      "Blocked: anti-harassment protection is active on this city (2 actions already launched against it in the last 24h).",
    "villes.antiVilleQuota": "Daily AntiVille action quota reached (3).",
    "villes.antiVilleErreur": "The action failed. Please try again in a moment.",
    "villes.proposerJumelage": "Propose a twinning",
    "villes.dejaJumelee": "Already twinned",
    "villes.jumelageQuotaAtteint": "Twinning quota reached",
    "villes.jumelagePropose": "Twinning proposed.",
    "villes.jumelageErreur": "The proposal failed. Please try again in a moment.",
    "villes.tousLesPays": "All countries",
    "villes.rechercherPlaceholder": "Search for a city",
    "villes.retour": "← All cities",
    "villes.enVisite": "Visiting",
    "villes.visiteeAujourdhui": "Visited today",
    "villes.revenirDemain": "Come back tomorrow for a new resident.",
    "villes.deJoueur": "by",
    "villes.aucuneVilleCorrespondante": "No matching city.",
    "villes.protegee": "Protected",
    "villes.protegeeNote":
      "You've already targeted it twice today: its effects would be too reduced.",
    "villes.pasDeDestruction":
      "An attack never destroys a building: the city stays drawn at its all-time record population.",
    "villes.maVille": "My city",
    "villes.jumelee": "Twinned",

    "classement.president": "President",
    "classement.dans": "in",

    "ciel.jour": "day",
    "ciel.leverDuSoleil": "sunrise",
    "ciel.coucherDuSoleil": "sunset",
    "ciel.aube": "dawn",
    "ciel.crepuscule": "dusk",
    "ciel.nuit": "night",

    "ville.stadeMaximal": "Max stage",
    "ville.seuilA": "at",
    "ville.habitantsAbrege": "res.",

    "jumelages.titre": "My twinnings",
    "jumelages.introduction":
      "An active twinning gives +1 population to both cities every day both players are active. 3 active twinnings maximum per city.",
    "jumelages.bonusAccordes": "Twinning bonus granted today to",
    "jumelages.actifs": "Active twinnings",
    "jumelages.recues": "Received requests",
    "jumelages.envoyees": "Sent requests",
    "jumelages.aucunJumelageActif": "No active twinning yet.",
    "jumelages.aucuneDemandeRecue": "No received request.",
    "jumelages.aucuneDemandeEnvoyee": "No sent request.",
    "jumelages.accepter": "Accept",
    "jumelages.refuser": "Decline",
    "jumelages.annuler": "Cancel",
    "jumelages.depuisLe": "since",
    "jumelages.jumeleeAvecTaVille": "Twinned with your city",
    "jumelages.demandeEnvoyee": "Request sent",
    "jumelages.voir": "View",
    "jumelages.bonusAujourdhui": "+1 resident today",

    "creationVille.note":
      "Your city will be born at the crossing of two roads, with a first house. Its layout is unique and will never change: it's the one you see behind.",
    "creationVille.region": "Your region",
    "creationVille.regionPlaceholder": "Pick a region",

    "nav.classement": "Rankings",

    "classement.titre": "Get ranked",
    "classement.mondial": "World",
    "classement.national": "National",
    "classement.regional": "Regional",
    "classement.maPosition": "My position",
    "classement.aucuneVille": "No city in this ranking yet.",

    "region.titre": "Pick your region",
    "region.introduction":
      "Cities in your country are also ranked by region: pick the one your city belongs to.",
    "region.bouton": "Confirm my region",
    "region.erreurGenerique": "The region choice failed. Please try again in a moment.",
    "region.actuelle": "Region",
    "region.changerTitre": "Change region",
    "region.changerBouton": "Change",
    "region.changerNote": "Possible once every 30 days.",
    "region.delaiRestant": "Next change possible in",
    "region.jours": "days",

    "erreurs.connexionRequise": "Log in to access this page.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type DictionaryKey = keyof (typeof dictionaries)["fr"];

export function traduire(locale: Locale, cle: DictionaryKey): string {
  return dictionaries[locale][cle];
}
