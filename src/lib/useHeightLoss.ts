import useSWR from "swr";
import type { HeightLossResult } from "../types";
import { computeHeightLoss, parseIgc } from "./igc";

async function fetchAndCompute(url: string): Promise<HeightLossResult | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const text = await res.text();
  const igc = parseIgc(text);
  return computeHeightLoss(igc);
}

export function useHeightLoss(flightId: string | undefined): {
  result: HeightLossResult | null | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useSWR(
    flightId ? `https://api.bgaladder.net/api/FlightIGC/${flightId}` : null,
    fetchAndCompute,
    { revalidateOnFocus: false },
  );

  return { result: data, isLoading };
}
