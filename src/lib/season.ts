/**
 * The season shown by default: the current year from March 1st, otherwise the
 * previous year (so winter flights early in the year still count towards the
 * season that started the previous spring, e.g. the Kelman Clock).
 */
export function currentSeason(now: Date = new Date()): number {
  const startOfSeason = new Date(now.getFullYear(), 2, 1);
  return startOfSeason < now ? now.getFullYear() : now.getFullYear() - 1;
}

/** The first season with BGA Ladder data for the club. */
export const FIRST_SEASON = 2007;

/**
 * The latest season the picker offers: the current calendar year (the default
 * trophy season is the calendar year, so January flights already count).
 */
export function latestSeason(now: Date = new Date()): number {
  return now.getFullYear();
}

/** Bring a season (e.g. from a hand-edited ?season=) into the offered range. */
export function clampSeason(season: number, now: Date = new Date()): number {
  return Math.min(Math.max(season, FIRST_SEASON), latestSeason(now));
}
