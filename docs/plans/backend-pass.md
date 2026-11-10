# Backend pass: notes from the frontend polish pass
Things seen from the website's side on 2026-11-10 (branch `polish/frontend-pass`), for the backend pass that follows. Observations, not decisions; delete this file when the pass is done.

## Seen in the browser
- **`GET /v1/me` answers 401 to a signed-out visitor.** Pages that check the session in the browser (`useSignedInPlayer`: Servers, Community, a run's page) log a failed request in the console on every visit. A 200 with no player would keep the console clean; the server-side check (`signedInPlayer`) would need the same change.
- **Post excerpts lose the breaks between blocks.** A list becomes "bhop_eazy, a short warm-up bhop_monster_jam, long and technical", and a heading runs into the paragraph after it ("A heading Paragraphs with…"). The excerpt is built in `posts/`; a space or separator per block would fix it.
- **`GET /v1/maps/{map}` is large.** 37 KB for `bhop_maze` on sample data: `tracks` is 32 KB (every style's board head and record history for each of 3 tracks) and `legacy_record_history` 8.6 KB, while the page opens on one style and track. Worth checking what the first paint needs against what could load when a style is chosen.
- **`/v1/runs` and `/v1/players` have no total.** Boards say "Top 25 of 34 players" under the list; Activity and Players can only show the button. A total (or a cheap estimate) would let every list end the same way.

## To measure before changing anything
- Local responses on sample data are 2–40 ms, which says little. Time the same endpoints on beta, with the legacy import and 5k maps: `/v1/maps`, `/v1/players`, `/v1/runs`, the two leaderboards, a busy map and a busy profile.
- Caddy compresses in production (`encode zstd gzip`); the API itself sends no `Cache-Control` or `ETag` on public reads. Whether short public caching is worth it depends on the beta timings.
- Dev-mode page loads (2–4 s on first visit) are Next compiling, not the API. Measure pages on a production build.

## Not backend, but found on the way
- CI skips `test:ui`, and the style guide baselines on `main` were already stale (they predated the footer's Help link). They are current again as of this branch.
