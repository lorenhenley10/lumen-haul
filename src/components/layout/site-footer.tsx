import Link from "next/link";
import Image from "next/image";
import { brand, footerNav, site } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Site footer.
 *
 * On desktop it is FIXED to the bottom of the viewport at a layer below the
 * page, so the last section of content scrolls up and off to uncover it —
 * the footer is revealed, not pushed. Pages that use this must reserve
 * matching bottom space (see `--footer-reveal-height` usage in page shells).
 *
 * On mobile it is a normal static block, because a fixed reveal costs a
 * viewport of scroll on a device that has none to spare.
 */
export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "z-[var(--z-below)] w-full bg-background pt-container lg:fixed lg:bottom-0 lg:left-0",
        className,
      )}
    >
      <div className="container">
        {/* Square mark + set wordmark — see the note in HomeHero. */}
        <div className="relative my-8 flex flex-col items-center gap-4">
          <Image
            src={brand.mark}
            alt=""
            aria-hidden
            width={brand.markWidth}
            height={brand.markHeight}
            unoptimized
            className="h-16 w-auto object-contain"
          />
          <p
            className="w-full text-center font-display font-medium uppercase leading-[0.82] tracking-[-0.04em]"
            style={{ fontSize: "clamp(2.5rem, 12vw, 13rem)" }}
          >
            {site.name}
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center">
          {/*
            A LINK, not the styled paragraph this was. It sits in a pill with a
            ground and a radius, directly above a row of buttons that are all
            clickable — so it reads as one of them, and it was the only thing
            here that did nothing when tapped. Looking pressable and not being
            pressable is worse than looking like plain text.

            Inline by default, but it is a flex child, so it blockifies and the
            padding lands exactly as it did on the div.
          */}
          <a
            href={`mailto:${site.email}`}
            className="rounded-t-2xl rounded-b-md bg-white/10 px-4 py-2 text-caption backdrop-blur-lg transition-colors hover:bg-white/20"
          >
            {site.email}
          </a>
          {/* Column count tracks the number of links so the row stays full —
              a fixed 6 would leave a hole now that Creators is gone. */}
          <div className="mt-2 grid w-full grid-cols-3 gap-2 lg:grid-cols-5">
            {footerNav.map((item) => {
              /*
                Instagram is the one entry that leaves the site. `next/link`
                renders a working anchor for it either way, so this is not a
                broken-link fix — it is that an outbound social link should
                open in its own tab rather than replacing the page someone is
                reading, and that routing it through the client router buys
                prefetch behaviour that means nothing for a foreign origin.

                Detected from the href rather than flagged in content: the
                distinction is about how the link is rendered, and a second
                field to keep in step with the URL beside it is a field that
                will eventually disagree with it.
              */
              const external = item.href.startsWith("http");
              const className =
                "rounded-[var(--radius-card)] bg-white/5 px-3 py-2 text-center text-caption uppercase transition-colors hover:bg-white/15";

              return external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 py-8 max-sm:flex-col">
          <p className="text-center text-caption">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="text-center text-caption">Made in-house</p>
        </div>
      </div>
    </footer>
  );
}
