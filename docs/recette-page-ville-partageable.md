# Recette — A-INTEGRER §26 C : page publique d'une ville, partageable

À jouer par Adrien. **Aucune migration.**

```bash
npm run dev
```

## Ce qu'il faut juger

1. Sur **Ma ville**, un bouton **« Partager ma ville »** : il copie
   (ou, sur mobile, ouvre la feuille de partage avec) un lien du type
   `…/v/<id>`.
2. Ouvre ce lien dans une **fenêtre de navigation privée** (donc sans être
   connecté) : la ville s'affiche en 3D avec son nom, son pays, son maire,
   son rang, sa population, ses réussites (mégaprojets, technologies,
   monuments) et des boutons **Créer un compte / Se connecter**.
3. Chaque réussite a son bouton **« Partager »** : le lien obtenu
   (`…/v/<id>?evenement=…`) ouvre la page avec cet événement en haut dans
   un encadré « Événement partagé ». Les mêmes boutons existent dans le
   **bulletin municipal** de Ma ville et de Villes.
4. **Connecté**, la même page affiche « Visiter cette ville » (ou « Voir ma
   ville » pour la tienne).
5. Un lien cassé ou inventé renvoie une **vraie page 404**.

## À savoir avant de juger

- **Seules les réussites se partagent** (mégaprojet, technologie,
  monument). Les attaques subies, manifestations et pertes de guerre
  restent privées au bulletin du maire : ni affichées sur la page
  publique, ni partageables. Dis-moi si tu préfères autrement.
- **« Passage n°1 » et « accession à la présidence »** (cités par le cahier
  des charges) ne sont pas partageables : ces moments ne sont pas
  enregistrés comme événements. C'est le journal mondial (chantier A du
  §26) qui les journalisera.
- **Pas d'image d'aperçu** dans les messageries (WhatsApp, etc.) : le
  lien affiche le nom de la ville et une description, pas la vue 3D.
- **Le pseudo du maire est visible** sur la page publique (il l'est déjà
  dans les classements).
- La page publique ne **modifie rien** : un inconnu qui la visite ne
  déclenche aucun calcul en base.

## Tests automatisés couvrant ce chantier

```bash
npx vitest run tests/unit/evenements.test.ts
npx playwright test tests/e2e/partage-ville.spec.ts
```
