// A country flag from its ISO 3166-1 alpha-2 code, or a question-mark placeholder when there's no country.
import "flag-icons/css/flag-icons.min.css";
import { Tooltip } from "./Tooltip";
import { classNames } from "./classNames";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

/**
 * flag-icons' stylesheet points at one SVG per country, so a browser downloads only the flags it shows.
 * `hint` replaces the tooltip, e.g. to tell a player how to set their country.
 */
export function Flag({
  code,
  hint,
  className,
}: {
  code: string | null | undefined;
  hint?: string;
  className?: string;
}) {
  const valid = code && /^[A-Z]{2}$/.test(code) ? code : null;
  const label = valid
    ? (countryNames.of(valid) ?? valid)
    : "No country set on Steam";
  // Not flag-icons' base `fi` class: it sizes the box in em and fits the art inside it, which leaves gaps.
  const flag = valid ? (
    <span
      role="img"
      aria-label={label}
      title={hint ? undefined : label}
      tabIndex={hint ? 0 : undefined}
      className={classNames(
        `fi-${valid.toLowerCase()} inline-block h-3.75 w-5 shrink-0 rounded-sm bg-cover bg-center align-middle shadow-[0_0_0_1px_var(--color-border-strong)]`,
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
        "bg-surface-raised text-text-subtle inline-flex h-3.75 w-5 shrink-0 items-center justify-center rounded-sm align-middle shadow-[0_0_0_1px_var(--color-border-strong)]",
        className,
      )}
    >
      <span aria-hidden className="text-[0.75em] leading-none font-bold">
        ?
      </span>
    </span>
  );
  return hint ? <Tooltip content={hint}>{flag}</Tooltip> : flag;
}
