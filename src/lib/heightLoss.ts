/**
 * Margin (metres) by which the IGC-computed height loss must exceed the BGA
 * value before we flag a likely under-report.
 *
 * BGA's reported height loss is effectively `max(actual, 1000)` — it reads
 * 1000 for within-limit flights and the real figure only when over the limit.
 * So this flags flights whose computed loss clears the recorded value (and the
 * 1000m limit) by a clear margin, which suggests the pilot-reported figure was
 * understated to dodge the limit.
 *
 * computeHeightLoss applies the BGA Ladder's start and finish rules to the
 * IGC file, taking the valid start that gives the least height loss, as the
 * pilot may choose it (rule 5.1 Note 1). So it's the least height loss the
 * pilot could have claimed: a warning means no valid start gets within the
 * reported figure. Flights whose IGC declaration wasn't flown (e.g. Cloud
 * Rally variable barrels) give no result, so we accept missing some real
 * cases. On the club's 2022-2025 flights, 4 warn. 100m is a deliberately
 * sensitive margin — a borderline case can still flag for a human to check in
 * the IGC viewer.
 */
export const HEIGHT_LOSS_MARGIN_M = 100;

export function shouldWarnHeightLoss(
  computed: number,
  reported: number,
): boolean {
  return computed > reported + HEIGHT_LOSS_MARGIN_M;
}
