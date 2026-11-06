// One server on the Servers page: a picture of its map, its country's flag, hostname, address, players and a
// Join link, which phones leave out because they can't open it. On phones it's a card under a banner of the map,
// with the map's name and the players on it; wider, a compact row with the map as a thumbnail. Staff rows add
// badges and tools, and show unlisted servers dimmed with a dashed edge.
import { Check, ImageOff } from "lucide-react";
import type { ReactNode } from "react";
import type { Schemas } from "@/api/client";
import { formatAgo } from "@/features/runs/time";
import { Badge } from "@/ui/Badge";
import { buttonClasses } from "@/ui/Button";
import { classNames } from "@/ui/classNames";
import { Flag } from "@/ui/Flag";
import { Link } from "@/ui/Link";
import { ServerAddress } from "./ServerAddress";

type Server = Schemas["ListedServer"];

export function ServerRow({
  server,
  unlisted = false,
  badges,
  tools,
  eager = false,
}: {
  server: Server;
  /** Shown to staff only: the public list never has unlisted servers. */
  unlisted?: boolean;
  badges?: ReactNode;
  /** Staff controls after Join, kept at full strength when the row is dimmed. */
  tools?: ReactNode;
  /** Load the map's picture at once and first, not when scrolled near: for the rows on screen from the start. */
  eager?: boolean;
}) {
  const address = `${server.ip}:${server.port}`;
  // Each part is dimmed on its own, not inside one wrapper, so the staff tools stay at full strength.
  const dim = classNames(
    "transition-opacity duration-(--duration-base)",
    unlisted ? "opacity-50" : !server.online && "opacity-60",
  );
  const connected = "Runs on this server count on SourceJump";
  return (
    <ServerRowFrame
      unlisted={unlisted}
      className="relative flex flex-col sm:h-full sm:flex-row sm:items-center sm:gap-3 sm:p-3"
    >
      {/* Whether the server is up, down the box's left edge: green while it reports in, red once it has gone
          quiet. Left at full strength when the rest of a row is dimmed, since it's the row's status. */}
      <span
        className={classNames(
          "absolute inset-y-0 left-0 z-10 w-1",
          server.online ? "bg-success" : "bg-danger",
        )}
      >
        <span className="sr-only">{server.online ? "Online" : "Offline"}</span>
      </span>
      <span
        className={classNames(
          "border-border bg-surface-raised relative flex h-28 shrink-0 items-end justify-between gap-3 overflow-hidden border-b p-3",
          "sm:h-18 sm:w-32 sm:rounded-sm sm:border sm:p-0",
          dim,
        )}
      >
        <MapPicture image={server.map_image} eager={eager} />
        {/* On phones the map's name and the players sit on the picture; wider, they have columns of their own. */}
        <span className="relative min-w-0 sm:hidden">
          <OnPicture>
            <MapName server={server} />
          </OnPicture>
        </span>
        <span className="relative shrink-0 sm:hidden">
          <OnPicture>
            <Players server={server} />
          </OnPicture>
        </span>
      </span>
      <span
        className={classNames(
          "flex min-w-0 flex-1 flex-col gap-0.5 p-3 sm:p-0",
          dim,
        )}
      >
        {/* Badges that don't fit beside the name wrap under it rather than squeezing it. */}
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex min-w-0 items-center gap-2">
            {/* Only a known country: Flag's placeholder speaks of Steam, which a server has nothing to do with. */}
            {server.country_code && <Flag code={server.country_code} />}
            <span className="min-w-0 font-bold break-words sm:truncate">
              {server.hostname}
            </span>
            {server.connected && (
              // Phones have no room for the word, so the badge shrinks to a tick.
              <Badge
                tone="accent"
                title={connected}
                className="shrink-0 px-1 sm:hidden"
              >
                <Check aria-hidden />
                <span className="sr-only">Connected</span>
              </Badge>
            )}
          </span>
          {server.connected && (
            <Badge
              tone="accent"
              title={connected}
              className="shrink-0 max-sm:hidden"
            >
              Connected
            </Badge>
          )}
          {badges}
        </span>
        <span className="text-text-muted flex min-w-0 text-sm max-sm:hidden">
          <MapName server={server} />
        </span>
        <span className="flex">
          <ServerAddress address={address} />
        </span>
      </span>
      <span
        className={classNames(
          // Only as wide as Join, so it sits as far in from the right edge as the picture does from the left, with
          // the count just above it.
          "flex shrink-0 flex-col items-center justify-center gap-1 max-sm:hidden",
          dim,
        )}
      >
        <Players server={server} stacked />
        {server.online && (
          <a
            href={`steam://connect/${address}`}
            className={classNames(
              buttonClasses({ variant: "soft", size: "xs" }),
              // One width on every row, so Join lines up down the list whatever the count above it.
              "w-14",
            )}
          >
            Join
          </a>
        )}
      </span>
      {tools && (
        <span className="flex shrink-0 items-center justify-end gap-1 px-3 pb-3 sm:p-0">
          {tools}
        </span>
      )}
    </ServerRowFrame>
  );
}

/**
 * The map's cover. Always the small file, the banner on a phone too: the large one is about ten times the bytes,
 * a lot for a list, and the map's own page shows it.
 */
function MapPicture({
  image,
  eager,
}: {
  image: Server["map_image"];
  eager: boolean;
}) {
  if (!image) {
    return (
      <span
        aria-hidden
        className="text-text-subtle absolute inset-0 flex items-center justify-center"
      >
        <ImageOff className="size-5" />
      </span>
    );
  }
  return (
    // The API stores each picture at the sizes it's shown at, so there's nothing for Next's resizer to do.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.thumbnail_url}
      alt=""
      loading={eager ? "eager" : "lazy"}
      // The first rows' pictures are on screen at once, the biggest thing there on a phone: fetch them ahead of
      // anything that can wait.
      fetchPriority={eager ? "high" : "auto"}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

/** A label over the map's picture, see-through and blurring what's behind it so it reads on any picture. */
function OnPicture({ children }: { children: ReactNode }) {
  return (
    <span className="bg-bg/60 ring-border-strong/60 flex min-w-0 rounded-sm px-2.5 py-1 text-sm ring-1 backdrop-blur-md">
      {children}
    </span>
  );
}

function MapName({ server }: { server: Server }) {
  return server.map_has_page ? (
    <Link
      href={`/maps/${server.map}`}
      className="hover:text-accent truncate font-bold transition-colors duration-(--duration-fast)"
    >
      {server.map}
    </Link>
  ) : (
    <span className="truncate font-bold">{server.map}</span>
  );
}

/**
 * Players out of slots while online, else when it was last heard from. `stacked` is the wider row's column,
 * where "Last seen" takes two short lines.
 */
function Players({
  server,
  stacked = false,
}: {
  server: Server;
  stacked?: boolean;
}) {
  if (!server.online) {
    return (
      <span
        className={classNames(
          "text-text-muted text-sm whitespace-nowrap",
          stacked && "flex flex-col items-center text-center text-xs",
        )}
      >
        <span>Last seen</span>{" "}
        <time dateTime={server.last_seen_at}>
          {formatAgo(server.seen_minutes_ago)}
        </time>
      </span>
    );
  }
  return (
    <span className="flex items-center whitespace-nowrap tabular-nums">
      <span className="text-sm">
        {/* All bold, so the players and the slots share one height and baseline; only the players are coloured,
            green with someone on, red when it's empty. A hair of space either side of the slash keeps a wide 0
            from crowding it the way a narrow 1 doesn't. */}
        <span className="font-bold">
          <span className={server.players > 0 ? "text-success" : "text-danger"}>
            {server.players}
          </span>
          <span className="text-text-muted">
            <span className="mx-px">/</span>
            {server.max_slots}
          </span>
        </span>
        {/* Left out on a narrow card, where it would cut the map's name short. */}
        {!stacked && (
          <span className="text-text-muted @max-xs:hidden"> playing</span>
        )}
      </span>
    </span>
  );
}

/**
 * The row's box, shared with the staff-only row of a server listed before it was ever heard from; `className`
 * lays out what's inside.
 */
export function ServerRowFrame({
  unlisted = false,
  className,
  children,
}: {
  unlisted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={classNames(
        "border-border bg-surface @container overflow-hidden rounded-lg border",
        unlisted && "border-dashed",
        className,
      )}
    >
      {children}
    </div>
  );
}
