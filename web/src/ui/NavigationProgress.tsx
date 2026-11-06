"use client";
// The thin accent bar across the top of the window while a link's page loads. It starts when a Link is followed
// and finishes when Next reports that navigation done, so it never claims a page is ready before it is. How long
// a page takes can't be known ahead, so in between it moves quickly at first and slows towards 90%.
import { useLinkStatus } from "next/link";
import { useEffect, useSyncExternalStore } from "react";

type Phase = "idle" | "start" | "loading" | "done";

// One bar for the whole page, so its state lives here rather than in a component: how many links are loading
// their page (Next reports each through `NavigationPending`), and where the bar is.
let pending = 0;
let phase: Phase = "idle";
let frame: number | undefined;
let timer: number | undefined;
const listeners = new Set<() => void>();

function show(next: Phase) {
  phase = next;
  for (const listener of listeners) listener();
}

function change(by: number) {
  const before = pending > 0;
  pending = Math.max(0, pending + by);
  const now = pending > 0;
  if (now === before) return;
  window.clearTimeout(timer);
  if (frame !== undefined) cancelAnimationFrame(frame);
  if (now) {
    // Placed at the start without a transition, then let go towards 90% once that has been drawn.
    show("start");
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => show("loading"));
    });
  } else {
    show("done");
    // Long enough to fill the bar and fade it out.
    timer = window.setTimeout(() => show("idle"), 500);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Rendered inside every Link: tells the bar while that link's page is loading. */
export function NavigationPending() {
  const { pending: loading } = useLinkStatus();
  useEffect(() => {
    if (!loading) return;
    change(1);
    return () => change(-1);
  }, [loading]);
  return null;
}

const styles: Record<Exclude<Phase, "idle">, string> = {
  start: "scale-x-0 transition-none",
  // A slow ease-out: most of the way within a second or two, then barely moving while the page is still out.
  loading:
    "scale-x-90 transition-[scale] duration-[10s] ease-[cubic-bezier(0.1,0.7,0.1,1)]",
  // Fills the rest quickly, then fades.
  done: "scale-x-100 opacity-0 transition-[scale,opacity] duration-200 ease-out [transition-delay:0s,200ms]",
};

export function NavigationProgress() {
  const current = useSyncExternalStore(
    subscribe,
    () => phase,
    () => "idle" as const,
  );
  if (current === "idle") return null;
  return (
    <div
      aria-hidden
      // Its own layer in the page fade (motion.css), so the fade doesn't hide it.
      style={{ viewTransitionName: "navigation-progress" }}
      className={`bg-accent pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left ${styles[current]}`}
    />
  );
}
