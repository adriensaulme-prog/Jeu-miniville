import type { Locale } from "@/lib/i18n/dictionaries";
import { QUOTA_VISITE_QUOTIDIEN } from "@/lib/game/visites";

/**
 * Règles du jeu (docs/A-INTEGRER.md §27 C) — v1 : le cœur de boucle
 * (visites, activités et jauges, influence, AntiVille, jumelages). Les
 * autres chapitres (pays et ressources, décisions diplomatiques et
 * guerre, mégaprojets, technologies, monuments) s'ajouteront au rythme
 * des jalons. Contenu FR + EN dès cette version (DECISIONS.md §1 point 5).
 *
 * Les chiffres cités doivent rester ceux du serveur (la source de vérité
 * est toujours la base) : le plafond de visites vient de
 * QUOTA_VISITE_QUOTIDIEN, les autres sont recopiés des migrations
 * (influence 5/jour, AntiVille 3/jour, 3 jumelages actifs, fenêtre de 5
 * minutes du choix d'activité) — à relire quand l'un d'eux change.
 */
export interface SectionRegles {
  id: string;
  titre: Record<Locale, string>;
  paragraphes: Record<Locale, string[]>;
}

export const SECTIONS_REGLES: SectionRegles[] = [
  {
    id: "principe",
    titre: { fr: "Le principe", en: "The idea" },
    paragraphes: {
      fr: [
        "Tu as une ville, dans un pays. Elle grandit grâce aux autres joueurs : chaque fois que quelqu'un la visite, elle gagne des habitants. À toi de visiter les autres villes, de peser sur elles et de faire monter la tienne dans les classements.",
        "Plus ta ville a d'habitants, plus elle débloque de bâtiments, de quartiers et de possibilités.",
      ],
      en: [
        "You have a city, in a country. It grows thanks to other players: every time someone visits it, it gains residents. Visit other cities, weigh in on them and climb the rankings with yours.",
        "The more residents your city has, the more buildings, districts and options it unlocks.",
      ],
    },
  },
  {
    id: "visites",
    titre: { fr: "Visiter une ville", en: "Visiting a city" },
    paragraphes: {
      fr: [
        "Ouvre la page d'une ville : au bout de quelques secondes, la visite est comptée toute seule (« +1 visite »), sans bouton à cliquer. Ta propre ville compte aussi.",
        `Chaque visite apporte en général +1 habitant à la ville visitée. Si son Résidentiel est en crise, le gain peut être nul. Tu peux visiter une même ville ${QUOTA_VISITE_QUOTIDIEN} fois par jour au maximum, avec une heure d'écart entre deux visites.`,
      ],
      en: [
        "Open a city's page: after a few seconds the visit is counted automatically (“+1 visit”), no button to click. Your own city counts too.",
        `Each visit usually brings +1 resident to the visited city. If its Residential is in crisis, the gain may be zero. You can visit the same city at most ${QUOTA_VISITE_QUOTIDIEN} times a day, with an hour between two visits.`,
      ],
    },
  },
  {
    id: "activites",
    titre: { fr: "Activités et jauges", en: "Activities and gauges" },
    paragraphes: {
      fr: [
        "Chaque visite est rattachée à une activité (Résidentiel, Loisirs, Commerce, Services, Industrie, Énergie, Recherche — les plus avancées se débloquent avec la taille de la ville). Une activité est tirée au sort ; juste après la visite, tu peux en choisir une autre (le choix est alors définitif pour cette visite, dans les 5 minutes).",
        "Les visites reçues remplissent les jauges de la ville : Crise, Équilibré ou Point fort pour chaque activité. Un point fort donne un avantage (par exemple, plus de chances de gagner un habitant en plus avec le Commerce), une crise un handicap. Le maire peut recommander une activité aux visiteurs.",
      ],
      en: [
        "Each visit is tied to an activity (Residential, Leisure, Commerce, Services, Industry, Energy, Research — the more advanced ones unlock as the city grows). One is drawn at random; right after the visit you can pick another (the choice is then final for that visit, within 5 minutes).",
        "Visits received fill the city's gauges: Crisis, Balanced or Strength for each activity. A strength gives an edge (for example, a better chance of an extra resident with Commerce), a crisis a handicap. The mayor can recommend an activity to visitors.",
      ],
    },
  },
  {
    id: "influence",
    titre: { fr: "Influence", en: "Influence" },
    paragraphes: {
      fr: [
        "Tu peux influencer la ville d'un autre joueur : elle gagne des points d'influence (jusqu'à 5 actions par jour, quelques secondes d'écart). Une ville en grève ne peut pas être influencée.",
        "Le record d'influence d'une ville débloque des monuments, un palier après l'autre : ils apparaissent hors de la ville et se retrouvent avec « Voir où il est » dans le panneau Monuments.",
      ],
      en: [
        "You can influence another player's city: it gains influence points (up to 5 actions a day, a few seconds apart). A city on strike cannot be influenced.",
        "A city's influence record unlocks monuments, one tier after another: they appear outside the city and can be found with “Show me where” in the Monuments panel.",
      ],
    },
  },
  {
    id: "antiville",
    titre: { fr: "AntiVille", en: "AntiCity" },
    paragraphes: {
      fr: [
        "Tu peux aussi nuire à une ville (jusqu'à 3 actions par jour, jamais sur la tienne) : la Grève bloque son influence un temps, la Contamination fait perdre des habitants, la Propagande fait perdre de l'influence.",
        "Chaque attaque a sa parade : l'Industrie protège de la Grève, les Services de la Contamination, les Loisirs de la Propagande. Plus une ville est attaquée dans la journée, plus son état s'aggrave (incidents, troubles, émeutes, crise), mais la solidarité récompense les visiteurs qui l'aident.",
      ],
      en: [
        "You can also hurt a city (up to 3 actions a day, never your own): Strike blocks its influence for a while, Contamination makes it lose residents, Propaganda makes it lose influence.",
        "Each attack has its counter: Industry protects against Strike, Services against Contamination, Leisure against Propaganda. The more a city is attacked in a day, the worse its state gets (incidents, unrest, riots, crisis), but solidarity rewards the visitors who help it.",
      ],
    },
  },
  {
    id: "jumelages",
    titre: { fr: "Jumelages", en: "Twinning" },
    paragraphes: {
      fr: [
        "Deux villes peuvent se jumeler (jusqu'à 3 jumelages actifs par ville, avec l'accord de l'autre joueur). Chaque jour où les deux joueurs ont été actifs, les deux villes gagnent un habitant.",
      ],
      en: [
        "Two cities can twin (up to 3 active twinnings per city, with the other player's agreement). Every day both players have been active, both cities gain a resident.",
      ],
    },
  },
  {
    id: "bientot",
    titre: { fr: "La suite", en: "More to come" },
    paragraphes: {
      fr: [
        "Les pays et leurs ressources, les décisions diplomatiques et la guerre, les mégaprojets et les technologies existent déjà dans le jeu : leurs règles seront détaillées ici dans une prochaine version.",
      ],
      en: [
        "Countries and their resources, diplomatic decisions and war, megaprojects and technologies already exist in the game: their rules will be detailed here in a later version.",
      ],
    },
  },
];
