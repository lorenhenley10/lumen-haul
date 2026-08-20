"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { useMounted, useReducedMotion } from "@/lib/hooks";
import { useLenis } from "@/components/providers/lenis-provider";
import type { ImageAsset } from "@/content/types";

interface ImageLightboxProps {
  images: ImageAsset[];
  /** Index of the open frame, or null when the viewer is closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  /** Set name, shown quietly in the corner so a frame is never orphaned. */
  label: string;
}

/**
 * The stills viewer.
 *
 * Two states, not one. The LIGHTBOX floats the frame over a blurred page with
 * its controls; FULLSCREEN drops the controls, blacks the surround and hands
 * the frame the whole screen. Clicking the photograph moves between them, and
 * that is the only thing clicking the photograph ever does.
 *
 * The click targets are what make this work, so they are precise:
 *
 *  - the photograph is a real <button> sized to the image box, so "click the
 *    image" means the pixels, not the letterboxing around them,
 *  - the surround is a separate layer underneath it, so "click outside"
 *    genuinely means outside,
 *  - the controls are siblings ABOVE both, so a click on an arrow never falls
 *    through to the close-on-backdrop handler.
 *
 * With `object-contain` inside a fill layer these three would collapse into one
 * box and the arrows would close the viewer.
 *
 * Native fullscreen is requested but never depended on: iOS Safari refuses
 * `requestFullscreen` on anything that is not a <video>. The fullscreen VIEW is
 * therefore CSS, and the native call is an enhancement on top of it — so the
 * interaction behaves identically on a phone, minus the browser chrome hiding.
 */
export function ImageLightbox({
  images,
  index,
  onClose,
  onNavigate,
  label,
}: ImageLightboxProps) {
  const mounted = useMounted();
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {index !== null && images[index] && (
        <LightboxShell
          key="stills-lightbox"
          images={images}
          index={index}
          onClose={onClose}
          onNavigate={onNavigate}
          label={label}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

function LightboxShell({
  images,
  index,
  onClose,
  onNavigate,
  label,
}: ImageLightboxProps & { index: number }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();
  // Motion's animations are JS-driven, so the reduced-motion block in
  // globals.css — which only neutralises CSS transitions — never reaches them.
  // Collapsing the durations here is what actually honours the preference; the
  // viewer still opens, it just arrives instead of travelling.
  const seconds = (value: number) => (prefersReducedMotion ? 0 : value);
  const [fullscreen, setFullscreen] = useState(false);
  // Whether the browser actually granted native fullscreen. Without this the
  // exit path can't tell "the user left fullscreen" from "the request was
  // refused and we are only in the CSS state".
  const nativeFullscreen = useRef(false);

  const image = images[index];
  const total = images.length;

  const go = useCallback(
    (delta: number) => onNavigate((index + delta + total) % total),
    [index, total, onNavigate],
  );

  // --- Fullscreen ----------------------------------------------------------
  const enterFullscreen = useCallback(() => {
    setFullscreen(true);
    dialogRef.current
      ?.requestFullscreen?.()
      .then(() => {
        nativeFullscreen.current = true;
      })
      .catch(() => {
        // Refused (iOS Safari on a non-video element). The CSS state below
        // already fills the viewport, so there is nothing to recover from.
        nativeFullscreen.current = false;
      });
  }, []);

  const exitFullscreen = useCallback(() => {
    setFullscreen(false);
    if (nativeFullscreen.current && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    nativeFullscreen.current = false;
  }, []);

  // The browser can leave fullscreen without us — Escape, a gesture, the OS.
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && nativeFullscreen.current) {
        nativeFullscreen.current = false;
        setFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Closing from inside fullscreen must not leave the page in it.
  useEffect(
    () => () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    },
    [],
  );

  // --- Scroll lock ---------------------------------------------------------
  // Both halves, same as the film player: Lenis owns the wheel, the body style
  // owns touch, keyboard and scrollbar drag.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const instance = lenis.current;
    document.body.style.overflow = "hidden";
    instance?.stop();
    return () => {
      document.body.style.overflow = previousOverflow;
      instance?.start();
    };
  }, [lenis]);

  // --- Focus ---------------------------------------------------------------
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  // --- Keyboard ------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          // Escape unwinds one layer at a time, so it never throws away more
          // than the user asked for.
          if (fullscreen) exitFullscreen();
          else onClose();
          break;
        case "ArrowRight":
          event.preventDefault();
          go(1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          go(-1);
          break;
        case "Tab": {
          const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])',
          );
          if (!focusables?.length) break;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
          break;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, exitFullscreen, onClose, go]);

  // --- Neighbour prefetch --------------------------------------------------
  // Arrowing through a set should not wait on a network round trip per frame.
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => {
      const neighbour = images[(i + total) % total];
      if (!neighbour || neighbour.placeholder) return;
      const preload = new window.Image();
      preload.src = neighbour.src;
    });
  }, [index, images, total]);

  const chromeClass = cn(
    "absolute z-[calc(var(--z-player)+1)] transition-opacity duration-[var(--duration-base)]",
    fullscreen && "pointer-events-none opacity-0",
  );

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${label}, frame ${index + 1} of ${total}`}
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: seconds(duration.base), ease: ease.outExpo }}
      className={cn(
        "fixed inset-0 z-[var(--z-player)] outline-none transition-colors duration-[var(--duration-base)]",
        fullscreen ? "bg-black" : "bg-background/90 backdrop-blur-xl",
      )}
    >
      {/* The surround. Clicking it closes; the photograph sits on top of it and
          stops the event before it gets here. */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        onClick={() => (fullscreen ? exitFullscreen() : onClose())}
      >
        <motion.button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (fullscreen) exitFullscreen();
            else enterFullscreen();
          }}
          aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
          className={cn(
            "block max-w-full",
            fullscreen ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
          initial={prefersReducedMotion ? false : { scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: seconds(duration.slow), ease: ease.outExpo }}
        >
          {/* Keyed so arrowing to the next frame mounts a new element and
              fades it up, rather than swapping bytes inside one that is
              already on screen — which shows as a flash of the old frame at
              the new frame's size. */}
          <motion.span
            key={image.id}
            className="block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: seconds(duration.fast), ease: ease.outQuad }}
          >
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            // Full resolution, deliberately. These frames are already encoded
            // for the web at 1600px on the long side, so the optimiser has
            // nothing left to save — and it refuses SVG, which is what a
            // stand-in frame is.
            unoptimized
            priority
            className={cn(
              // Animating max-* is animating layout, which is normally the
              // wrong instinct. It is right here: one absolutely-centred
              // element with no siblings to reflow, both ends are concrete
              // viewport units, and it is the only way the frame GROWS into
              // fullscreen instead of cutting to it.
              "h-auto w-auto object-contain transition-[max-height,max-width] duration-[var(--duration-base)] ease-[var(--ease-out-expo)]",
              fullscreen
                ? "max-h-svh max-w-[100vw]"
                : "max-h-[82svh] max-w-[88vw]",
            )}
          />
          </motion.span>
        </motion.button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className={cn(
          chromeClass,
          "top-container right-container grid size-10 place-items-center rounded-full bg-white/10 backdrop-blur-lg transition-colors hover:bg-white/20",
        )}
      >
        <span aria-hidden className="text-base leading-none">
          ✕
        </span>
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous frame"
            className={cn(
              chromeClass,
              "top-1/2 left-container grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur-lg transition-colors hover:bg-white/20",
            )}
          >
            <span aria-hidden className="text-base leading-none">
              ‹
            </span>
          </button>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next frame"
            className={cn(
              chromeClass,
              "top-1/2 right-container grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur-lg transition-colors hover:bg-white/20",
            )}
          >
            <span aria-hidden className="text-base leading-none">
              ›
            </span>
          </button>
        </>
      )}

      <div
        className={cn(
          chromeClass,
          "right-container bottom-container left-container flex items-baseline justify-between gap-4",
        )}
      >
        <p className="min-w-0 truncate text-caption text-muted-foreground">
          {label}
        </p>
        {/* Never wraps: "[01 / 06]" breaking across two lines in a corner reads
            as a layout failure, and the set name is the half that can afford
            to be cut. */}
        <p className="shrink-0 text-caption tabular-nums whitespace-nowrap text-muted-foreground">
          [{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}]
        </p>
      </div>
    </motion.div>
  );
}
