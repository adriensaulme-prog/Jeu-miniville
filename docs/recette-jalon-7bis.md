# Recette — Jalon 7bis : « La ville continue de grandir »

À jouer par Adrien. Objectif : juger si une grande ville continue de
s'étendre de façon crédible au-delà de 40 000 habitants, et si elle reste
fluide.

```bash
npm run dev
```

## Ce qu'il faut juger

1. **Une grande ville** — page **Villes**, clique **Belval-sur-Loire**
   (114 000 habitants, 30 blocs) : elle s'affiche en 3D derrière le
   panneau. Avant ce jalon, elle était bloquée à 16 blocs. Est-ce que la
   silhouette te plaît (tours plus hautes au centre, plus basses au bord,
   champs et routes de campagne qui partent du bord de la ville) ?
2. **Comparer avec une ville moyenne** — clique ensuite **Montclair**
   (78 000) puis un hameau : la caméra doit se recadrer à chaque fois sur
   la ville entière, même si tu avais zoomé à la main juste avant.
3. **Zoomer, dézoomer, déplacer** sur la grande ville : les ombres
   doivent couvrir toute la ville (pas de tours sans ombre au bord), le
   brouillard doit rester loin de la ville, pas dessus.
4. **Sur ton téléphone** (`http://192.168.1.16:3000`, même Wi-Fi) : est-ce
   fluide sur Belval-sur-Loire ?
5. **Ta propre ville** — elle a changé d'aspect une fois avec ce jalon
   (voir ci-dessous). Recharge plusieurs fois : elle doit maintenant être
   identique à chaque fois.

## ⚠ Points à trancher

- **Toutes les villes ont changé d'aspect une fois** (plan des blocs,
  maisons, voitures, forêts) : c'est ce qui garantit désormais qu'une
  ville qui grandit ne déplace jamais ce qui est déjà construit. J'ai
  tranché sans toi parce qu'il n'existe que les villes de test et ton
  hameau à 1 habitant (`DECISIONS.md` §10 point 18) : dis-le si tu
  voulais garder l'ancien plan.
- **Plafond de rendu pour les très grandes villes ?** (point 19) — pas de
  limite, comme demandé, mais une ville à 1 million d'habitants fait
  1,25 million de sommets. Si tu veux, je crée une ville de test géante
  (500 000 ou 1 million) pour que tu juges la fluidité sur ton téléphone
  avant de décider.
- **Un stade au-delà de Métropole ?** (point 20, ex. « Mégapole » à
  250 000) — le rendu continue de grandir mais le nom de stade reste
  Métropole au-delà de 100 000.

## Tests automatisés couvrant ce jalon

```bash
npm test          # dont tests/unit/ville3dCroissance.test.ts : seuils,
                   # repères 28/58 blocs, stabilité (un bloc ouvert ne
                   # bouge jamais), rayon de ville, carte d'occlusion
npm run test:e2e  # dont "le sol est bien dessiné"
```
