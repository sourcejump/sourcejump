// The points formula, worked out the way the API's SQL `points_for` does (migration 0058), for the pages
// that explain it with examples. The API's stored points stay the only ones shown on leaderboards.
import type { Schemas } from "@/api/client";

export type PointsPolicy = Pick<
  Schemas["PointsFormula"],
  | "finish_base"
  | "finish_growth_percent"
  | "record_tier_points"
  | "record_finisher_points"
  | "median_share_percent"
  | "min_median_gap_percent"
  | "bonus_percent"
>;

/** What finishing a track of this tier earns. */
export function finishPoints(policy: PointsPolicy, tier: number): number {
  return (
    policy.finish_base * (policy.finish_growth_percent / 100) ** (tier - 1)
  );
}

/** What a board's world record is worth on top of finishing. */
export function recordValue(
  policy: PointsPolicy,
  tier: number,
  finishers: number,
): number {
  return (
    policy.record_tier_points * tier +
    policy.record_finisher_points * Math.log(1 + finishers)
  );
}

/**
 * The share of the record value a time earns. `behind` and `medianBehind` are how far behind the record the
 * time and the median time are, as fractions of the record (0.1 is 10% slower).
 */
export function recordShare(
  policy: PointsPolicy,
  behind: number,
  medianBehind: number,
): number {
  const distance = Math.max(medianBehind, policy.min_median_gap_percent / 100);
  return (
    (policy.median_share_percent / 100) ** Math.min(100, behind / distance)
  );
}

/** A personal best's points on a main track. */
export function points(
  policy: PointsPolicy,
  board: { tier: number; finishers: number; medianBehind: number },
  behind: number,
): number {
  return (
    finishPoints(policy, board.tier) +
    recordValue(policy, board.tier, board.finishers) *
      recordShare(policy, behind, board.medianBehind)
  );
}
