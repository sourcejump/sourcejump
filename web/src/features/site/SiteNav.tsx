"use client";
// Header navigation: section links on wide screens, a menu on narrow ones. Marks the current section.
import { Link } from "@/ui/Link";
import { usePathname } from "next/navigation";
import { classNames } from "@/ui/classNames";
import { MobileSiteNav } from "./MobileSiteNav";
import { isCurrent, sections } from "./navigation";

/**
 * On pages with a dynamic address, such as a profile, the path is only known per request. SiteHeader shows
 * `SiteNavLinks` without a current section while it streams in, so every page's shell stays static.
 */
export function SiteNav() {
  return <SiteNavLinks pathname={usePathname()} />;
}

export function SiteNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <>
      <nav aria-label="Main" className="hidden h-full lg:block">
        <ul className="flex h-full items-stretch gap-6">
          {sections.map(({ href, label }) => {
            const current = isCurrent(href, pathname);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={classNames(
                    "flex items-center border-b-2 pt-0.5 text-sm transition-colors duration-(--duration-fast)",
                    current
                      ? "border-accent text-accent"
                      : "text-text-muted hover:text-text border-transparent",
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <MobileSiteNav pathname={pathname} />
    </>
  );
}
