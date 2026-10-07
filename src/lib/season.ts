/**
 * The season shown by default: the current year from March 1st, otherwise the
 * previous year (so winter flights early in the year still count towards the
 * season that started the previous spring, e.g. the Kelman Clock).
 */
export function currentSeason(now: Date = new Date()): number {
  const startOfSeason = new Date(now.getFullYear(), 2, 1);
  return startOfSeason < now ? now.getFullYear() : now.getFullYear() - 1;
}
