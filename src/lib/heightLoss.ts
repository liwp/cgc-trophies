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
 * Calibrated against real flights: computeHeightLoss matches BGA within a few
 * metres for ~half of flights and otherwise UNDER-reads (so we accept missing
 * some real cases). Its largest observed OVER-read was ~130m; 100m is a
 * deliberately sensitive margin — a borderline over-read can still flag for a
 * human to check via the tooltip.
 */
export const HEIGHT_LOSS_MARGIN_M = 100;

export function shouldWarnHeightLoss(
  computed: number,
  reported: number,
): boolean {
  return computed > reported + HEIGHT_LOSS_MARGIN_M;
}
