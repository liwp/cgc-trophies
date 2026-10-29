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
 * computeHeightLoss reproduces the "Analyse task" height loss of the BGA's IGC
 * viewer (igcviewer.bgaladder.net, default zones), checked to within 5m on 21
 * of the club's 2022-2025 flights. It gives no result when the declared task
 * in the IGC file wasn't flown, so we accept missing some real cases. 100m is a
 * deliberately sensitive margin — a borderline case can still flag for a human
 * to check in the viewer.
 */
export const HEIGHT_LOSS_MARGIN_M = 100;

export function shouldWarnHeightLoss(
  computed: number,
  reported: number,
): boolean {
  return computed > reported + HEIGHT_LOSS_MARGIN_M;
}
