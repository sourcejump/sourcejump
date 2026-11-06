// A country flag from its ISO 3166-1 alpha-2 code, or a question-mark placeholder when there's no country.
import "flag-icons/css/flag-icons.min.css";
import { Tooltip } from "./Tooltip";
import { classNames } from "./classNames";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * Every flag is flag-icons' drawing, filling the same box, so they line up down a list. `md` sits beside a name in
 * rows and lists; `lg` beside a page's title, as on a profile. The drawings are 4:3; each box is a pixel lower at
 * top and bottom than the drawing at its width (24×18 shown 24×16, 32×24 shown 32×22), so flags sit wide like
 * 3:2 ones, yet the drawing isn't rescaled: its halves and thirds (Germany's stripes) still end on whole pixels.
 */
const sizes = {
  md: "h-4 w-6 rounded-[2px]",
  lg: "h-5.5 w-8 rounded-[3px]",
};

// The same faint outline as the other sites' flags: the text color at 10%, just outside the drawing, so a box with
// no flag in it, or one dark at the edge, still shows where it is without a rim drawn over the stripes.
const outline =
  "shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-text)_10%,transparent)]";

/**
 * flag-icons' stylesheet points at one SVG per country, so a browser downloads only the flags it shows. `hint`
 * replaces the tooltip, e.g. to tell a player how to set their country.
 */
export function Flag({
  code,
  hint,
  size = "md",
  className,
}: {
  code: string | null | undefined;
  hint?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const valid = code && /^[A-Z]{2}$/.test(code) ? code : null;
  const label = valid
    ? (countryNames.of(valid) ?? valid)
    : "No country set on Steam";
  const flag = valid ? (
    <span
      role="img"
      aria-label={label}
      title={hint ? undefined : label}
      tabIndex={hint ? 0 : undefined}
      // Not flag-icons' base `fi` class: it sizes the box in em and fits the drawing inside it, which leaves gaps.
      className={classNames(
        `fi-${valid.toLowerCase()} inline-block shrink-0 bg-cover bg-center align-middle`,
        sizes[size],
        outline,
        className,
      )}
    />
  ) : (
    // A flag-sized box with a question mark, so a missing country reads as unknown rather than as a flag.
    <span
      role="img"
      aria-label={label}
      title={hint ? undefined : label}
      tabIndex={hint ? 0 : undefined}
      className={classNames(
        "bg-surface-raised text-text-subtle inline-flex shrink-0 items-center justify-center align-middle",
        sizes[size],
        outline,
        className,
      )}
    >
      <span aria-hidden className="text-[10px] leading-none font-bold">
        ?
      </span>
    </span>
  );
  return hint ? <Tooltip content={hint}>{flag}</Tooltip> : flag;
}
