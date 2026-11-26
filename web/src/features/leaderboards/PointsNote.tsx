// How points are counted, in plain words and one chart, from the formula the API uses. Says so while it's
// still a draft.
import type { Schemas } from "@/api/client";
import { Card } from "@/ui/Card";

const numbers = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

export function PointsNote({
  formula,
  legacy,
}: {
  formula: Schemas["PointsFormula"];
  /** The pre-2.0 view, counted on the old site's tiers. */
  legacy: boolean;
}) {
  const growth = formula.finish_growth_percent / 100;
  const tier5 = formula.finish_base * growth ** 4;
  return (
    <Card className="grid gap-6 md:grid-cols-2 md:items-center">
      <div className="flex flex-col gap-3 text-sm">
        <h2 className="font-bold">How points work</h2>
        {formula.draft && (
          <p className="text-text">
            This is a draft until the community agrees on a formula.
          </p>
        )}
        <p className="text-text-muted">
          <span className="text-text">Finishing a map</span> earns points by its
          tier: {numbers.format(formula.finish_base)} at tier 1, and{" "}
          {numbers.format(growth)} times more with each tier up, so tier 5 is
          worth {whole.format(tier5)}.
        </p>
        <p className="text-text-muted">
          <span className="text-text">Each world record</span> is worth extra on
          top: more on harder maps, and a little more the more players have
          finished the map. The record holder gets all of it. Everyone else gets
          a share, smaller the further behind they are. How far behind counts is
          judged against the map&apos;s median player, so short and long maps
          are treated alike.
        </p>
        <p className="text-text-muted">
          A bonus is worth {formula.bonus_percent}% of a map at its own tier.{" "}
          {legacy
            ? "Pre-2.0 records are counted on the old site's tiers and never count toward 2.0."
            : "Each style counts on its own, and pre-2.0 runs don't count."}
        </p>
        {!legacy && !formula.tiers && (
          <p className="text-text-muted">Points start once maps have tiers.</p>
        )}
      </div>
      <ShareChart sharePercent={formula.median_share_percent} />
    </Card>
  );
}

/** How far behind the record the chart reaches, in multiples of the median player's distance. */
const REACH = 3;
const W = 300;
const H = 100;

/**
 * The share of a record's value a time earns, by how far behind the record it is: all of it at the record,
 * `sharePercent` as far behind as the median player, and the same fraction again for each such distance.
 */
function ShareChart({ sharePercent }: { sharePercent: number }) {
  const share = sharePercent / 100;
  const steps = 60;
  const curve = Array.from({ length: steps + 1 }, (_, i) => {
    const behind = (i / steps) * REACH;
    return `${i === 0 ? "M" : "L"}${(behind / REACH) * W},${(1 - share ** behind) * H}`;
  }).join(" ");
  const marks = [
    { behind: 0, name: "World record", value: "all of it" },
    {
      behind: 1,
      name: "Median player",
      value: `${whole.format(sharePercent)}%`,
    },
    {
      behind: 2,
      name: "Twice as far",
      value: `${numbers.format(Math.round(share ** 2 * 1000) / 10)}%`,
    },
  ];
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-text-muted text-xs">
        Share of a world record&apos;s extra points
      </figcaption>
      <div className="border-border-strong relative mt-5 h-40 border-b border-l">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden
        >
          <path
            d={`${curve} L${W},${H} L0,${H} Z`}
            className="fill-accent-soft"
          />
          <path
            d={curve}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            className="stroke-accent motion-draw"
          />
        </svg>
        {marks.map((mark) => {
          const left = (mark.behind / REACH) * 100;
          const top = (1 - share ** mark.behind) * 100;
          return (
            <div
              key={mark.name}
              className="absolute"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <span className="bg-accent border-surface absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" />
              <span className="absolute bottom-2 left-2 text-xs whitespace-nowrap">
                <span className="text-text">{mark.name}</span>{" "}
                <span className="text-text-muted">{mark.value}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-text-muted text-xs">
        Further behind the world record →
      </p>
    </figure>
  );
}
