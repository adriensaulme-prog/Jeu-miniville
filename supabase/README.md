# `supabase/`

Migrations SQL versionnées avec le code (voir `docs/GUIDE-METHODE.md` §7
et `docs/DECISIONS.md` §1 point 2 — anti-triche côté serveur).

Vide pour l'instant. La première migration (tables `users`, `cities`,
`countries` — cahier des charges §28) arrive au Jalon 1.

Pour lier ce dossier à ton projet Supabase une fois créé sur
supabase.com :

```bash
npx supabase login
npx supabase link --project-ref <ton-project-ref>
npx supabase db push
```
