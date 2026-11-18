/**
 * A truncated MAGISTRATS.xml reads as a wave of departures. Past the share of active magistrats an
 * ordinary import deactivates, the extraction is held incomplete rather than believed.
 */
export function isIncompleteExtraction(
  magistrats: { active: number; deactivations: number },
  maxDeactivationRatio: number,
): boolean {
  return magistrats.deactivations > magistrats.active * maxDeactivationRatio;
}
