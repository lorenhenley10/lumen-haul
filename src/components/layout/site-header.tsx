"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { primaryNav, socialLinks } from "@/content/site";
import { TabNav } from "./tab-nav";
import { MobileMenu } from "./mobile-menu";

/**
 * Fixed header.
 *
 * Always over the media, never a solid bar: a short gradient wash gives the
 * nav pill something to sit on when it's over a bright frame, without ever
 * drawing a horizontal edge across the film.
 *
 * The pill itself is the only nav on desktop. Below `lg` it collapses to a
 * home button plus a full-screen menu.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeIndex = primaryNav.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[var(--z-header)] flex justify-center bg-linear-to-b from-background/20 to-transparent pt-container">
        <div className="relative z-[var(--z-content)] container flex items-center justify-between lg:grid lg:grid-cols-6">
          {/* Desktop: wordmark home link (col 1) */}
          <Link
            href="/"
            className="text-caption uppercase transition-opacity hover:opacity-60 max-lg:hidden"
          >
            Lumen Haul
          </Link>

          <TabNav
            items={primaryNav}
            activeIndex={activeIndex}
            layoutId="primary-nav-indicator"
            className="col-span-4 mx-auto max-lg:hidden"
          />

          <div className="flex items-center justify-end gap-1 max-lg:hidden">
            {socialLinks.map((link) => (
              <IconButton key={link.label} label={link.label} href={link.href}>
                {link.icon === "instagram" ? "◎" : "in"}
              </IconButton>
            ))}
          </div>

          {/* Mobile bar */}
          <Link
            href="/"
            aria-label="Home"
            className="text-caption uppercase lg:hidden"
          >
            Lumen Haul
          </Link>
          <div className="flex items-center justify-end gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-full bg-white/10 px-4 py-2 text-caption uppercase backdrop-blur-lg"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function IconButton({
  children,
  label,
  href,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "grid size-9 place-items-center rounded-full bg-white/10 text-caption backdrop-blur-lg transition-colors hover:bg-white/20",
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label={label}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        <span aria-hidden>{children}</span>
      </a>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={className}>
      <span aria-hidden>{children}</span>
    </button>
  );
}
