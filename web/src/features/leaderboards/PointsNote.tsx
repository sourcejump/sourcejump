// How points are counted, in plain words, from the formula the API uses. Says so while it's still a draft.
import type { Schemas } from "@/api/client";

const numbers = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

export function PointsNote({
  formula,
  legacy,
}: {
  formula: Schemas["PointsFormula"];
  /** The pre-2.0 view, counted on the old site's tiers. */
  legacy: boolean;
}) {
  const growth = formula.finish_growth_percent / 100;
  const share = formula.median_share_percent;
  const shareWords =
    share === 25 ? "a quarter" : share === 50 ? "half" : `${share}%`;
  return (
    <div className="text-text-muted flex flex-col gap-1 text-sm">
      {formula.draft && (
        <p className="text-text">
          Points are a draft until the community agrees on a formula.
        </p>
      )}
      <p>
        Finishing a map earns {numbers.format(formula.finish_base)} points at
        tier 1, and {numbers.format(growth)} times more with each tier up. On
        top of that, each map&apos;s world record is worth extra: more on harder
        maps, and a little more the more players have finished it. The record
        holder gets all of it, and the further behind you are, the smaller your
        share. A time as far behind as the map&apos;s median player gets{" "}
        {shareWords}. A bonus is worth {formula.bonus_percent}% of a map at its
        own tier.{" "}
        {legacy
          ? "Pre-2.0 records are counted on the old site's tiers and never count toward 2.0."
          : "Each style counts on its own, and pre-2.0 runs don't count."}
      </p>
      {!legacy && !formula.tiers && <p>Points start once maps have tiers.</p>}
    </div>
  );
}
