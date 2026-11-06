"use client";
// Players online across listed servers over the last day, week, month or year. Hovering, tapping or arrow
// keys read a point: players and servers at that time. Every range arrives with the page, so switching is
// instant.
import { type ReactNode, useState } from "react";
import type { Schemas } from "@/api/client";
import { Card } from "@/ui/Card";
import { LineChart } from "@/ui/LineChart";
import { Segmented } from "@/ui/Segmented";

type Range = Schemas["ActivityRange"];

const ranges: { value: Range; label: string }[] = [
  { value: "day", label: "24 hours" },
  { value: "week", label: "7 days" },
  { value: "month", label: "1 month" },
  { value: "year", label: "1 year" },
];

const peakLabels: Record<Range, string> = {
  day: "24-hour peak",
  week: "7-day peak",
  month: "1-month peak",
  year: "1-year peak",
};

// UTC, like every date on the site, so the server and the visitor render the same text.
const time = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});
const day = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const date = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function ServerActivity({
  activity,
}: {
  activity: Partial<Record<Range, Schemas["ServerActivity"]>>;
}) {
  const [range, setRange] = useState<Range>("day");
  const [active, setActive] = useState<number | null>(null);
  const current = activity[range];
  const points = current?.points ?? [];
  // "Now" is the day's latest bucket whichever range is shown: the longer ranges' buckets are averages.
  const now = activity.day?.points.at(-1) ?? points.at(-1);
  const hovered = active === null ? undefined : points[active];
  if (!current || !now || points.length < 2) return null;
  const peak = Math.max(...points.map((point) => point.players));

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* While the chart is hovered, its point replaces the line; the chart has no tooltip of its own. */}
        <p
          aria-live="polite"
          className="text-text-muted flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm tabular-nums"
        >
          {hovered ? (
            <>
              <Stat value={hovered.players}>
                {hovered.players === 1 ? "player" : "players"}
                {range !== "day" && " on average"}
              </Stat>
              <Stat value={hovered.servers}>
                {hovered.servers === 1 ? "server" : "servers"}
              </Stat>
              <span className="text-text-subtle">
                {when(hovered.at, current.bucket_minutes)}
              </span>
            </>
          ) : (
            <>
              <Stat value={now.players}>online now</Stat>
              <Stat value={now.servers}>
                {now.servers === 1 ? "server" : "servers"}
              </Stat>
              <span>
                {peakLabels[range]}{" "}
                <span className="text-text text-lg font-bold">{peak}</span>
              </span>
            </>
          )}
        </p>
        <Segmented
          label="Range"
          options={ranges}
          value={range}
          onChange={(value) => {
            setRange(value as Range);
            setActive(null);
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <LineChart
          size="sm"
          label={`Players online over the last ${ranges.find((r) => r.value === range)?.label}. Use the arrow keys to read each point.`}
          points={points.map((p) => ({ x: Date.parse(p.at), y: p.players }))}
          active={active}
          onActive={setActive}
          formatValue={(value) => String(Math.round(value))}
        />
        {/* Indented by the value labels' width, so the dates sit under the plot's ends. */}
        <div className="text-text-subtle flex justify-between pl-10 text-xs tabular-nums">
          <span>{edge(points[0]?.at, range)}</span>
          <span>{edge(points.at(-1)?.at, range)}</span>
        </div>
      </div>
    </Card>
  );
}

/** A number in the line over the chart, with what it counts after it. */
function Stat({ value, children }: { value: number; children: ReactNode }) {
  return (
    <span>
      <span className="text-text text-lg font-bold">{value}</span> {children}
    </span>
  );
}

/** The bucket a point covers: a time span within a day, or the whole day. */
function when(at: string, minutes: number): string {
  const start = new Date(at);
  if (minutes >= 1440) return date.format(start);
  const end = new Date(start.getTime() + minutes * 60_000);
  return `${day.format(start)}, ${time.format(start)}–${time.format(end)} UTC`;
}

/** The time axis's ends: times for a day, dates for longer, with the year for a year. */
function edge(at: string | undefined, range: Range): string {
  if (!at) return "";
  const start = new Date(at);
  if (range === "day") return `${time.format(start)} UTC`;
  return range === "year" ? date.format(start) : day.format(start);
}
