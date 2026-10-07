import CONFIG from "trophies-config";
import type { Trophy } from "../types";

export interface TrophyNav {
  prev: Trophy | null;
  next: Trophy | null;
}

export function getTrophyNav(trophyId: string): TrophyNav {
  const list = CONFIG.trophies;
  const index = list.findIndex((t) => t.id === trophyId);

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index < list.length - 1 ? list[index + 1] : null,
  };
}
