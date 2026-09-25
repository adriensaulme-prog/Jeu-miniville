/**
 * Lundi (UTC, "YYYY-MM-DD") de la semaine ISO 8601 contenant la date
 * donnée — même convention que `date_trunc('week', ...)` côté SQL
 * (votes_pays, Jalon 10), pour que l'app et la base s'accordent sur
 * "cette semaine" sans se repasser la date calculée.
 */
export function debutSemaineIso(maintenant: Date = new Date()): string {
  const jour = maintenant.getUTCDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  const joursDepuisLundi = jour === 0 ? 6 : jour - 1;
  const lundi = new Date(
    Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate() - joursDepuisLundi)
  );
  return lundi.toISOString().slice(0, 10);
}
