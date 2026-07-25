"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { VideoAsset } from "@/content/types";
import { useReducedMotion, useSaveData } from "@/lib/hooks";
import { useVideo } from "./video-provider";

interface AutoVideoProps {
  asset: VideoAsset;
  className?: string;
  /**
   * Controlled playback. When supplied it WINS over viewport detection — used
   * by the home reel, where only the current slide plays even though all nine
   * are technically on screen.
   */
  active?: boolean;
  /** Load immediately instead of waiting for proximity. Hero video only. */
  priority?: boolean;
  /** Opt this video into the site-wide audio toggle. Default: always silent. */
  audible?: boolean;
  objectFit?: "cover" | "contain";
  /** 0–1 playback progress, driven by rAF so progress UI stays smooth. */
  onProgress?: (ratio: number) => void;
  onEnded?: () => void;
  loop?: boolean;
}

/**
 * Inline autoplaying video.
 *
 * The whole point of this component is that a page can put twenty of these on
 * screen without melting the device. It enforces, in one place:
 *
 *  - LAZY SOURCE ATTACHMENT. `src` is not attached until the element is within
 *    one viewport of the fold. An unattached <video> costs nothing; twenty
 *    attached ones cost twenty connections.
 *  - OFFSCREEN PAUSE. Scrolling past a video pauses it. So does hiding the tab.
 *  - POSTER AS FLOOR. The poster sits underneath at all times, so a video that
 *    is loading, errored, blocked by autoplay policy, or suppressed by
 *    reduced-motion still renders as a designed frame rather than a black hole.
 *  - REDUCED MOTION / SAVE-DATA. Both hold at the poster and never fetch.
 */
export function AutoVideo({
  asset,
  className,
  active,
  priority = false,
  audible = false,
  objectFit = "cover",
  onProgress,
  onEnded,
  loop = true,
}: AutoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [inView, setInView] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [failed, setFailed] = useState(false);

  const prefersReducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const { muted: globallyMuted } = useVideo();

  const suppressed = prefersReducedMotion || saveData;
  const shouldPlay = (active ?? inView) && !suppressed && !failed;

  // --- Proximity: attach the source, then track on-screen state -------------
  useEffect(() => {
    const el = containerRef.current;
    if (!el || suppressed) return;

    const loader = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          loader.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );

    const player = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 },
    );

    if (!priority) loader.observe(el);
    player.observe(el);

    return () => {
      loader.disconnect();
      player.disconnect();
    };
  }, [priority, suppressed]);

  // --- Play / pause --------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (shouldPlay) {
      // Autoplay rejection is expected (policy, low power mode) and is not an
      // error state — the poster is already showing, so we simply stay there.
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay, shouldLoad, canPlay]);

  // A backgrounded tab keeps decoding video unless we intervene.
  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;
      if (document.hidden) video.pause();
      else if (shouldPlay) void video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [shouldPlay]);

  // --- Progress ------------------------------------------------------------
  // `timeupdate` only fires ~4x/second, which visibly steps a progress bar.
  useEffect(() => {
    if (!onProgress || !shouldPlay) return;
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video && video.duration > 0) {
        onProgress(video.currentTime / video.duration);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onProgress, shouldPlay]);

  const handleEnded = useCallback(() => onEnded?.(), [onEnded]);

  const sources = asset.mobileSources ?? asset.sources;
  // No sources = placeholder asset. Skip the <video> entirely so the poster is
  // the whole component and nothing hits the network.
  const hasSources = sources.length > 0;

  return (
    <div ref={containerRef} className={cn("relative h-full w-full", className)}>
      {/* Poster floor. Always present, always beneath. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.poster}
        alt={asset.alt}
        aria-hidden={!suppressed}
        className={cn(
          "absolute inset-0 h-full w-full",
          objectFit === "cover" ? "object-cover" : "object-contain",
        )}
        draggable={false}
      />

      {!suppressed && hasSources && (
        <video
          ref={videoRef}
          className={cn(
            "relative h-full w-full transition-opacity",
            objectFit === "cover" ? "object-cover" : "object-contain",
            canPlay ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDuration: "var(--duration-base)" }}
          poster={asset.poster}
          muted={audible ? globallyMuted : true}
          loop={loop}
          playsInline
          preload={priority ? "auto" : "none"}
          disablePictureInPicture
          aria-label={asset.alt}
          onCanPlay={() => setCanPlay(true)}
          onError={() => setFailed(true)}
          onEnded={handleEnded}
        >
          {shouldLoad &&
            sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
        </video>
      )}
    </div>
  );
}
