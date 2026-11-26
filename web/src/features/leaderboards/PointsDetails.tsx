// The points formula in numbers: what each tier is worth, one map worked through, and the exact formula, for
// players who want more than the plain-words summary above it.
import type { ReactNode } from "react";
import type { Schemas } from "@/api/client";
import { DividedSection } from "@/ui/Divided";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/ui/Table";
import { finishPoints, points, recordShare, recordValue } from "./points";

const whole = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const seconds = new Intl.NumberFormat("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percent = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 1,
});

/** Tiers listed when none are published yet. */
const DEFAULT_TIERS = 10;

/** The worked example: a tier 3 map whose median player is 10% behind a 30 s record. */
const EXAMPLE = {
  tier: 3,
  finishers: 50,
  record: 30,
  median: 33,
  times: [30, 31.5, 33, 36, 45],
};

export function PointsDetails({
  formula,
}: {
  formula: Schemas["PointsFormula"];
}) {
  const tiers = Array.from(
    { length: formula.tier_count ?? DEFAULT_TIERS },
    (_, i) => i + 1,
  );
  const example = {
    tier: EXAMPLE.tier,
    finishers: EXAMPLE.finishers,
    medianBehind: EXAMPLE.median / EXAMPLE.record - 1,
  };
  const share = formula.median_share_percent / 100;
  const growth = formula.finish_growth_percent / 100;

  return (
    <>
      <DividedSection className="grid gap-6 pt-5 lg:grid-cols-2">
        <Part
          title="What each tier is worth"
          intro="Points for finishing, and for the world record (finishing included) on a map that 10 or 100 players have finished."
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tier</TableHeaderCell>
                <TableHeaderCell numeric>Finish</TableHeaderCell>
                <TableHeaderCell numeric>WR, 10</TableHeaderCell>
                <TableHeaderCell numeric>WR, 100</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.map((tier) => (
                <TableRow key={tier}>
                  <TableCell>{tier}</TableCell>
                  <TableCell numeric>
                    {whole.format(finishPoints(formula, tier))}
                  </TableCell>
                  {[10, 100].map((finishers) => (
                    <TableCell key={finishers} numeric>
                      {whole.format(
                        finishPoints(formula, tier) +
                          recordValue(formula, tier, finishers),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Part>

        <Part
          title="An example"
          intro={`A tier ${EXAMPLE.tier} map that ${EXAMPLE.finishers} players have finished. The world record is ${seconds.format(EXAMPLE.record)} s, and the median player is ${percent.format(example.medianBehind)} behind it, at ${seconds.format(EXAMPLE.median)} s. Finishing is worth ${whole.format(finishPoints(formula, EXAMPLE.tier))}, and the record ${whole.format(recordValue(formula, EXAMPLE.tier, EXAMPLE.finishers))} more.`}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell numeric>Time</TableHeaderCell>
                <TableHeaderCell numeric>Behind</TableHeaderCell>
                <TableHeaderCell numeric>Share</TableHeaderCell>
                <TableHeaderCell numeric>Points</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {EXAMPLE.times.map((time) => {
                const behind = time / EXAMPLE.record - 1;
                return (
                  <TableRow key={time}>
                    <TableCell numeric>{seconds.format(time)} s</TableCell>
                    <TableCell numeric>
                      {behind === 0 ? "WR" : percent.format(behind)}
                    </TableCell>
                    <TableCell numeric>
                      {percent.format(
                        recordShare(formula, behind, example.medianBehind),
                      )}
                    </TableCell>
                    <TableCell numeric>
                      {whole.format(points(formula, example, behind))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Part>
      </DividedSection>

      <DividedSection className="pt-5">
        <Part title="The exact formula">
          <dl className="flex flex-col gap-3 text-sm">
            <Term name="Finishing">
              <Formula>
                {decimal.format(formula.finish_base)} × {decimal.format(growth)}
                <sup>tier − 1</sup>
              </Formula>
            </Term>
            <Term name="Record value">
              <Formula>
                {decimal.format(formula.record_tier_points)} × tier +{" "}
                {decimal.format(formula.record_finisher_points)} × ln(1 +
                players)
              </Formula>
              Players: everyone with a time on the map in that style. The
              natural log makes each new player add a little less.
            </Term>
            <Term name="Behind">
              <Formula>your time ÷ world record − 1</Formula>
              {seconds.format(EXAMPLE.median)} s on a{" "}
              {seconds.format(EXAMPLE.record)} s record is{" "}
              {percent.format(example.medianBehind)} behind.
            </Term>
            <Term name="Median behind">
              How far behind the median player is, counted as at least{" "}
              {formula.min_median_gap_percent}%, so a map where everyone is
              close to the record doesn&apos;t punish small gaps.
            </Term>
            <Term name="Your share">
              <Formula>
                {decimal.format(share)}
                <sup>behind ÷ median behind</sup>
              </Formula>
              All of it at the world record, {formula.median_share_percent}% at
              the median player, and {formula.median_share_percent}% of that
              again for each further step as far.
            </Term>
            <Term name="Your points">
              <Formula>finishing + record value × your share</Formula>A bonus
              earns {formula.bonus_percent}% of that, at the bonus&apos;s own
              tier.
            </Term>
            <Term name="Your total">
              Your points on every map you&apos;ve finished, added up per style.
              Main maps and bonuses are ranked apart.
            </Term>
          </dl>
          <p className="text-text-muted text-sm">
            A map&apos;s points move whenever its world record, its median time
            or its number of players changes, so yours can go up or down without
            you playing.
          </p>
        </Part>
      </DividedSection>
    </>
  );
}

function Part({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-bold">{title}</h3>
      {intro && <p className="text-text-muted text-sm">{intro}</p>}
      {children}
    </section>
  );
}

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
      <dt className="text-text shrink-0 sm:w-32">{name}</dt>
      <dd className="text-text-muted flex flex-col gap-1">{children}</dd>
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <span className="bg-surface-raised text-text w-fit rounded-sm px-2 py-0.5 tabular-nums">
      {children}
    </span>
  );
}
