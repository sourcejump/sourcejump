-- The third points draft (Discord, 2026-11-17), provisional for public testing (lead, 2026-11-26). A personal
-- best now also depends on how many finished its board and how far behind the record its median runner is,
-- so those are stored per board beside the best time and tier, and the formula's numbers are handed over as
-- the stored JSON (`PointsPolicy`), rather than one argument each.
--
-- No step after this: the formula in code differs from the one counted with, so the API recounts everything
-- in the background at startup (`leaderboards/standings.rs`): about 3 s on the beta, most of it pre-2.0 records.
-- Until then pages show personal bests' points as 0.

ALTER TABLE standings_boards ADD COLUMN median double precision, ADD COLUMN finishers integer;
UPDATE standings_boards b SET median = m.median, finishers = m.finishers
FROM (SELECT map_id, style, track, percentile_cont(0.5) WITHIN GROUP (ORDER BY time) AS median,
             count(*)::int AS finishers
      FROM personal_bests GROUP BY 1, 2, 3) m
WHERE m.map_id = b.map_id AND m.style = b.style AND m.track = b.track;
-- A board is stored only while it has a personal best, so every row found its values.
ALTER TABLE standings_boards ALTER COLUMN median SET NOT NULL, ALTER COLUMN finishers SET NOT NULL;

DROP FUNCTION personal_best_points(bigint, text, smallint, double precision);
DROP FUNCTION points_for(smallint, double precision, double precision, boolean, double precision,
                         double precision, double precision, double precision, double precision);

-- A personal best's points: a finishing value that grows by `finish_growth_percent` each tier, plus a share
-- of the board's record value. The record value is `record_tier_points` per tier and `record_finisher_points`
-- per ln(1 + finishers), so new maps start with something and busy ones grow slowly. The record earns all of
-- it; a run as far behind the record as the median runner earns `median_share_percent`, and the share keeps
-- shrinking the same way further back. Distance behind is measured as a fraction of the record, so short and
-- long maps are judged alike. The median's distance counts as at least `min_median_gap_percent`, so on a board
-- with a few close times second place isn't judged against a median a hair behind the record. A bonus earns
-- `bonus_percent` of all that at its own tier. NULL (no points) without a tier.
CREATE FUNCTION points_for(
    tier smallint, run_time double precision, best double precision, median double precision,
    finishers integer, bonus boolean, formula jsonb
) RETURNS double precision
LANGUAGE sql IMMUTABLE PARALLEL SAFE
RETURN (
    (formula->>'finish_base')::float8 * power((formula->>'finish_growth_percent')::float8 / 100, tier - 1)
    + ((formula->>'record_tier_points')::float8 * tier
       + (formula->>'record_finisher_points')::float8 * ln(1 + finishers))
      * power((formula->>'median_share_percent')::float8 / 100,
              -- At most 100 times the median's distance: the share is long since nil by then, and a far
              -- bigger power underflows, which is an error in SQL. Pre-2.0 records hold such times.
              least(100, (run_time / best - 1)
                  -- NULL, so no points, rather than an error, for a formula without these numbers: the one the
                  -- totals were counted with before this migration, until the startup recount replaces it.
                  / nullif(greatest(median / best - 1, (formula->>'min_median_gap_percent')::float8 / 100), 0)))
) * CASE WHEN bonus THEN (formula->>'bonus_percent')::float8 / 100 ELSE 1 END;

-- As in migration 0051: from the board's counted values and the counted formula. 0 before the first count.
CREATE FUNCTION personal_best_points(pb_map_id bigint, pb_style text, pb_track smallint, pb_time double precision)
RETURNS double precision
LANGUAGE sql STABLE PARALLEL SAFE
RETURN coalesce((
    SELECT points_for(b.tier, pb_time, b.best, b.median, b.finishers, pb_track > 0, f.formula)
    FROM standings_boards b CROSS JOIN standings_formula f
    WHERE b.map_id = pb_map_id AND b.style = pb_style AND b.track = pb_track
), 0);
