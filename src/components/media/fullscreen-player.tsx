"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { useMounted } from "@/lib/hooks";
import { useLenis } from "@/components/providers/lenis-provider";
import { useVideo } from "./video-provider";

/** Seconds -> MM:SS. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const IDLE_MS = 2500;

/**
 * The fullscreen film player.
 *
 * Mounted once, at the root, and driven entirely by `useVideo().activeFilm` —
 * any card, reel slide, story block or CTA anywhere in the app opens it by
 * calling `openFilm({ id, title, asset })`.
 *
 * Deliberate choices worth keeping:
 *  - Controls are WORDS, not icons. It reads as a cutting-room monitor, and it
 *    removes the icon-legibility problem on a moving background entirely.
 *  - The overlay is a real modal: focus is trapped, the page behind is inert
 *    to scroll (Lenis stopped AND body locked), and Escape always closes.
 *  - Controls auto-hide after idle but ALWAYS return on any pointer or key
 *    input, and never hide while the video is paused.
 */
export function FullscreenPlayer() {
  const { activeFilm, closeFilm, muted, setMuted } = useVideo();
  const mounted = useMounted();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {activeFilm && (
        <PlayerShell
          key={activeFilm.id}
          onClose={closeFilm}
          muted={muted}
          setMuted={setMuted}
          title={activeFilm.title}
          asset={activeFilm.asset}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface PlayerShellProps {
  onClose: () => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  title: string;
  asset: import("@/content/types").VideoAsset;
}

function PlayerShell({
  onClose,
  muted,
  setMuted,
  title,
  asset,
}: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lenis = useLenis();

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(asset.duration ?? 0);
  const [buffering, setBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  // A film that 404s or uses a codec the browser can't decode must not leave
  // the spinner turning forever — that reads as a hang rather than a failure.
  const [failed, setFailed] = useState(false);

  // --- Scroll lock ---------------------------------------------------------
  // Both halves are required: Lenis owns the wheel, the body style owns
  // everything else (touch, keyboard, scrollbar drag).
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    // Capture the instance we actually stopped, so cleanup restarts the same
    // one even if the provider has rebuilt Lenis in the meantime.
    const instance = lenis.current;
    document.body.style.overflow = "hidden";
    instance?.stop();
    return () => {
      document.body.style.overflow = previousOverflow;
      instance?.start();
    };
  }, [lenis]);

  // --- Focus management ----------------------------------------------------
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  const play = useCallback(() => {
    void videoRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => videoRef.current?.pause(), []);

  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) play();
    else pause();
  }, [play, pause]);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(
      Math.max(0, video.currentTime + delta),
      video.duration || 0,
    );
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      // Never hide the controls on a paused video — a still frame with no
      // affordances looks like a crash.
      if (!videoRef.current?.paused) setControlsVisible(false);
    }, IDLE_MS);
  }, []);

  // Controls start visible (initial state), so this effect only has to arm the
  // first hide — calling revealControls() here would set state synchronously
  // during mount for no benefit.
  useEffect(() => {
    idleTimer.current = setTimeout(() => {
      if (!videoRef.current?.paused) setControlsVisible(false);
    }, IDLE_MS);
    return () => clearTimeout(idleTimer.current);
  }, []);

  // --- Keyboard ------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      revealControls();
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          break;
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(5);
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-5);
          break;
        case "m":
          event.preventDefault();
          setMuted(!muted);
          break;
        case "f":
          event.preventDefault();
          void toggleNativeFullscreen(dialogRef.current);
          break;
        case "Tab": {
          // Focus trap: the dialog is the only reachable region.
          const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, [tabindex]:not([tabindex="-1"])',
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
  }, [onClose, togglePlay, seekBy, muted, setMuted, revealControls]);

  // --- Scrubbing -----------------------------------------------------------
  const seekToPointer = useCallback((clientX: number) => {
    const track = scrubRef.current;
    const video = videoRef.current;
    if (!track || !video || !video.duration) return;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - left) / width, 0), 1);
    video.currentTime = ratio * video.duration;
    setCurrent(video.currentTime);
  }, []);

  useEffect(() => {
    if (!scrubbing) return;
    const onMove = (event: PointerEvent) => seekToPointer(event.clientX);
    const onUp = () => setScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [scrubbing, seekToPointer]);

  const progress = total > 0 ? current / total : 0;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-0 z-[var(--z-player)] bg-background outline-none"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: duration.slow, ease: ease.outExpo }}
      onPointerMove={revealControls}
    >
      <div className="relative h-full w-full select-none bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          poster={asset.poster}
          playsInline
          autoPlay
          muted={muted}
          aria-label={title}
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            setControlsVisible(true);
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onError={() => {
            setFailed(true);
            setBuffering(false);
          }}
          onTimeUpdate={(e) => {
            if (!scrubbing) setCurrent(e.currentTarget.currentTime);
          }}
          onLoadedMetadata={(e) => setTotal(e.currentTarget.duration)}
          onEnded={() => setControlsVisible(true)}
        >
          {asset.sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>

        {/* Playback failure — poster stays visible behind this. */}
        {failed && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 px-container">
            <div className="text-center">
              <p className="text-caption text-muted-foreground">
                This film can&rsquo;t be played right now.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-full bg-white/10 px-6 py-3 text-caption uppercase backdrop-blur-lg transition-colors hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Buffering indicator */}
        <AnimatePresence>
          {buffering && !failed && (
            <motion.div
              className="pointer-events-none absolute inset-0 grid place-items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="size-8 animate-spin rounded-full border border-white/25 border-t-white" />
              <span className="sr-only">Loading</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close film"
          className={cn(
            "absolute top-container right-container z-[calc(var(--z-player)+1)] grid size-10 place-items-center rounded-full bg-white/10 backdrop-blur-lg transition-opacity hover:bg-white/20",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDuration: "var(--duration-fast)" }}
        >
          <span aria-hidden className="text-base leading-none">
            ✕
          </span>
        </button>

        {/* Control bar */}
        <div
          className={cn(
            "pointer-events-none absolute right-0 bottom-0 left-0 z-[calc(var(--z-player)+1)] bg-linear-to-b from-transparent to-black/70 px-container pb-8 transition-opacity",
            controlsVisible ? "opacity-100" : "opacity-0",
          )}
          style={{ transitionDuration: "var(--duration-base)" }}
        >
          {/* Title — mobile only; desktop keeps the frame clean. */}
          <div className="pb-5 lg:hidden">
            <p className="text-display">{title}</p>
          </div>

          {/* Scrubber */}
          <div
            className="pointer-events-auto cursor-pointer py-3"
            onPointerDown={(event) => {
              setScrubbing(true);
              seekToPointer(event.clientX);
            }}
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(total)}
            aria-valuenow={Math.round(current)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(total)}`}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") seekBy(5);
              if (event.key === "ArrowLeft") seekBy(-5);
            }}
          >
            <div ref={scrubRef} className="relative h-0.5 w-full bg-white/25">
              <div
                className="absolute inset-y-0 left-0 w-full origin-left bg-white"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-8 pt-5 lg:px-8">
            <div className="pointer-events-auto flex items-center gap-8 max-lg:w-full max-lg:justify-between">
              <button
                type="button"
                onClick={togglePlay}
                className="text-caption uppercase transition-opacity hover:opacity-60"
              >
                {playing ? "Pause" : "Play"}
              </button>
              <p className="text-caption tabular-nums">
                {formatTime(current)} / {formatTime(total)}
              </p>
            </div>

            <div className="pointer-events-auto flex items-center gap-8 max-lg:hidden">
              <button
                type="button"
                onClick={() => setMuted(!muted)}
                className="text-caption uppercase transition-opacity hover:opacity-60"
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              <button
                type="button"
                onClick={() => void toggleNativeFullscreen(dialogRef.current)}
                className="text-caption uppercase transition-opacity hover:opacity-60"
              >
                Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

async function toggleNativeFullscreen(element: HTMLElement | null) {
  if (!element) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await element.requestFullscreen();
  } catch {
    // Safari on iPhone refuses fullscreen on non-video elements; the overlay
    // already fills the screen, so there is nothing to recover from.
  }
}
