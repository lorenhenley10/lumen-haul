"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";

export interface TabItem {
  label: string;
  /** Provide for navigation, omit for in-page selection (`onSelect`). */
  href?: string;
}

interface TabNavProps {
  items: readonly TabItem[];
  /** Index of the active item, or -1 for none. */
  activeIndex: number;
  onSelect?: (index: number) => void;
  className?: string;
  /** Unique per instance — two nav strips must not share one indicator. */
  layoutId: string;
}

/**
 * The pill tab strip.
 *
 * Used twice with different jobs: as the site's primary navigation in the
 * header, and as the section switcher on /studio. Both need the same sliding
 * white indicator, so it lives here once.
 *
 * The indicator is a `layoutId` element rather than a measured-and-translated
 * div: Motion handles the FLIP maths, so the pill tracks correctly through
 * font loading, window resizes and horizontal scrolling of the strip — all of
 * which break the manual approach.
 */
export function TabNav({
  items,
  activeIndex,
  onSelect,
  className,
  layoutId,
}: TabNavProps) {
  return (
    <nav className={cn("relative w-fit max-w-full shadow-base", className)}>
      <ul className="hide-scrollbar relative flex w-fit max-w-full items-center overflow-x-auto rounded-full bg-white/10 backdrop-blur-lg">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const content = (
            <>
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-full bg-white"
                  transition={{ duration: duration.base, ease: ease.inOutQuart }}
                />
              )}
              <span
                className={cn(
                  "relative z-[var(--z-media)] whitespace-nowrap transition-colors",
                  isActive ? "text-primary-foreground" : "text-foreground",
                )}
                style={{ transitionDuration: "var(--duration-fast)" }}
              >
                {item.label}
              </span>
            </>
          );

          // 14px text on a 20px line box, plus py-2, gives a 36px strip —
          // the reference's nav and studio tab bars measure exactly that.
          // `leading-5` is explicit because the body default is 1.3 (18.2px),
          // which would leave the strip 2px short.
          const classes =
            "relative grid place-items-center rounded-full px-6 py-2 text-ui leading-5 uppercase";

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={classes}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect?.(index)}
                  className={classes}
                  aria-current={isActive ? "true" : undefined}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
