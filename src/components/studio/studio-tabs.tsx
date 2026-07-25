"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { TabNav } from "@/components/layout/tab-nav";
import { cn } from "@/lib/cn";
import type { StudioSection } from "@/content/types";

interface StudioTabsProps {
  sections: StudioSection[];
}

/**
 * The /studio section switcher.
 *
 * IMPORTANT — this is a CONTENT SWITCHER, not scroll-spy anchor navigation.
 * Only the selected panel exists in the DOM at a time, and the page height
 * changes as you move between them (the reference ranges from ~1700px on the
 * shortest panel to ~3600px on the longest). Building this as anchors down one
 * long page would look similar in a screenshot and behave nothing like it.
 *
 * The panel swap is INSTANT. Verified by sampling the reference across 24
 * consecutive frames during a tab change: the content block stayed at
 * `opacity: 1` with no transform throughout. The only thing that animates is
 * the pill indicator, which slides and resizes to the new tab — handled for us
 * by TabNav's Motion `layoutId`.
 *
 * Adding a fade here would be a plausible-looking mistake. Don't.
 */
export function StudioTabs({ sections }: StudioTabsProps) {
  /*
   * Deep links: /studio#contact is linked from the footer, the mobile menu and
   * the header CTA, so a cold load on a hash must open that panel.
   *
   * The hash is read through useSyncExternalStore rather than copied into
   * state by a mount effect. An effect would render panel 0 first and then
   * immediately re-render to the right one — a visible flash of the wrong
   * content, and a second render on every mount.
   */
  const hash = useSyncExternalStore(
    useCallback((onChange: () => void) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    }, []),
    () => window.location.hash.slice(1),
    () => "",
  );

  // null = the visitor hasn't picked a tab yet, so the hash still governs.
  const [selected, setSelected] = useState<number | null>(null);

  const hashIndex = sections.findIndex((section) => section.id === hash);
  const activeIndex = selected ?? (hashIndex >= 0 ? hashIndex : 0);

  // Keep the address bar honest as the visitor moves between panels, without
  // pushing history entries that would make Back feel broken. replaceState
  // does not emit `hashchange`, so this cannot feed back into the store above.
  useEffect(() => {
    const section = sections[activeIndex];
    if (section) window.history.replaceState(null, "", `#${section.id}`);
  }, [activeIndex, sections]);

  const active = sections[activeIndex];

  return (
    <>
      <div className="relative mt-16 w-fit max-w-full">
        <TabNav
          items={sections.map((section) => ({ label: section.label }))}
          activeIndex={activeIndex}
          onSelect={setSelected}
          layoutId="studio-nav-indicator"
          className="shadow-base"
        />
        {/* Edge fade over the horizontally-scrolling strip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-[var(--z-media)] w-12 rounded-full bg-linear-to-r from-transparent to-background/75"
        />
      </div>

      <section className="mt-8 pb-16">
        <div id={active.id}>
          <h2 className="text-heading mb-6">{active.heading}</h2>

          {active.rows && (
            <div>
              {active.rows.map((row) => (
                <div
                  key={row.label}
                  className="grid border-b border-border py-4 last:border-b-0 md:grid-cols-2 lg:grid-cols-4"
                >
                  <p>{row.label}</p>
                  <p className="text-muted-foreground">{row.name}</p>
                  {row.email ? (
                    <a
                      href={`mailto:${row.email}`}
                      className="underline underline-offset-2 transition-opacity hover:opacity-60"
                    >
                      {row.email}
                    </a>
                  ) : (
                    <span />
                  )}
                  <p className="text-muted-foreground">{row.detail}</p>
                </div>
              ))}
            </div>
          )}

          {active.body && (
            <div className={cn("space-y-4 text-prose")}>
              {active.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
