import { describe, expect, it } from "vitest";
import { finishPoints, points, recordShare, recordValue } from "./points";

const draft = {
  finish_base: 10,
  finish_growth_percent: 150,
  record_tier_points: 40,
  record_finisher_points: 40,
  median_share_percent: 25,
  min_median_gap_percent: 5,
  bonus_percent: 25,
};

describe("points", () => {
  it("matches the API's numbers", () => {
    // The API's test board (`leaderboards.rs`): T3, 30 s and 33 s, so the median is 5% behind.
    const board = { tier: 3, finishers: 2, medianBehind: 0.05 };
    expect(points(draft, board, 0)).toBeCloseTo(186.44, 2);
    expect(points(draft, board, 0.1)).toBeCloseTo(32.75, 2);
    expect(finishPoints(draft, 10)).toBeCloseTo(384.4, 1);
    expect(recordValue(draft, 1, 5)).toBeCloseTo(111.67, 2);
  });

  it("judges a close median as at least the floor", () => {
    expect(recordShare(draft, 0.01, 0.001)).toBeCloseTo(0.25 ** 0.2, 6);
  });

  it("bottoms out instead of underflowing", () => {
    expect(recordShare(draft, 1000, 0.05)).toBeGreaterThan(0);
  });
});
