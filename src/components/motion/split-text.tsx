"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import { gsap, useGSAP } from "@/lib/gsap";
import { duration, gsapEase, scrollStart } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";

interface SplitTextProps {
  text: string;
  className?: string;
  /** Granularity of the stagger. `char` for short display lines only. */
  by?: "word" | "char";
  delay?: number;
  immediate?: boolean;
  start?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

/**
 * Masked text reveal — words (or characters) rising out of a clipped line.
 *
 * The split happens in JSX rather than by mutating the DOM after mount, which
 * matters for two reasons: the markup is identical on server and client (no
 * hydration mismatch), and there is no flash of unsplit text before the
 * splitter runs.
 *
 * Accessibility: the wrapper carries the real string via `aria-label` and the
 * fragments are hidden, so assistive tech reads a sentence, not an alphabet.
 */
export function SplitText({
  text,
  className,
  by = "word",
  delay = 0,
  immediate = false,
  start = scrollStart.reveal,
  as: Tag = "span",
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useGSAP(
    () => {
      if (prefersReducedMotion || !ref.current) return;

      gsap.fromTo(
        ref.current.querySelectorAll("[data-split-part]"),
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: duration.page,
          ease: gsapEase.outExpo,
          delay,
          stagger: by === "char" ? 0.025 : 0.06,
          scrollTrigger: immediate
            ? undefined
            : { trigger: ref.current, start, toggleActions: "play none none none" },
        },
      );
    },
    { scope: ref, dependencies: [prefersReducedMotion, text] },
  );

  const words = text.split(" ");

  return (
    // @ts-expect-error — polymorphic ref, narrowed by the caller's `as`.
    <Tag ref={ref} className={cn(className)} aria-label={text}>
      {words.map((word, wordIndex) => (
        <span
          key={`${word}-${wordIndex}`}
          aria-hidden
          className="reveal-mask inline-block align-bottom"
          // Descenders and italic overhang get clipped by the mask without a
          // little horizontal breathing room.
          style={{ paddingRight: "0.08em", marginRight: "0.16em" }}
        >
          {by === "word" ? (
            <span data-split-part className="inline-block">
              {word}
            </span>
          ) : (
            word.split("").map((char, charIndex) => (
              <span
                key={`${char}-${charIndex}`}
                data-split-part
                className="inline-block"
              >
                {char}
              </span>
            ))
          )}
        </span>
      ))}
    </Tag>
  );
}
