# `supabase/`

Migrations SQL versionnées avec le code (voir `docs/GUIDE-METHODE.md` §7
et `docs/DECISIONS.md` §1 point 2 — anti-triche côté serveur).

- `0001_jalon1_naitre_quelque_part.sql` — tables `countries`, `users`,
  `cities` (réduites au périmètre du Jalon 1) et la fonction
  `creer_ville()`, point d'entrée unique pour créer le profil joueur et
  sa ville dans la même transaction.
- `0002_jalon1_seed_pays.sql` — liste complète des pays (ISO 3166-1
  alpha-2, noms fr/en), voir `docs/DECISIONS.md` §4 Jalon 1.

Pour lier ce dossier à ton projet Supabase une fois créé sur
supabase.com :

```bash
npx supabase login
npx supabase link --project-ref <ton-project-ref>
npx supabase db push
```

Plus rapide sans CLI : coller le contenu des deux fichiers, dans
l'ordre, dans l'éditeur SQL du tableau de bord Supabase (Project → SQL
Editor → New query → Run).
