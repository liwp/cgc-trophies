import CONFIG from "trophies-config";
import type { Trophy } from "../types";

export function resolveTrophy<T extends Trophy>(trophy: T, season: number): T {
  if (!("history" in trophy) || !trophy.history?.length) return trophy;

  const match = trophy.history
    .filter((version) => version.untilSeason >= season)
    .sort((a, b) => a.untilSeason - b.untilSeason)[0];

  if (!match) return trophy;

  const { untilSeason: _untilSeason, ...overrides } = match;
  return { ...trophy, ...overrides };
}

export function resolveTrophies(season: number): Trophy[] {
  return CONFIG.trophies.map((trophy) => resolveTrophy(trophy, season));
}
