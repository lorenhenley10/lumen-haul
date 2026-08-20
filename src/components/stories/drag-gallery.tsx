"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { ImageAsset } from "@/content/types";
import { useReducedMotion } from "@/lib/hooks";
import { ImageLightbox } from "@/components/media/image-lightbox";

interface DragGalleryProps {
  stills: ImageAsset[];
  /** Set name, for the viewer's corner label. */
  label: string;
  className?: string;
}

const FRICTION = 0.92;
const MIN_VELOCITY = 0.05;

/**
 * A pointer that moved further than this between down and up was a DRAG, and
 * must not also count as a click on the frame underneath it. Without the test,
 * every throw ends by opening whatever was under your finger.
 */
const CLICK_SLOP_PX = 6;

/** How much of the cloud has to stay on screen. Past this the drag stops. */
const PAN_MARGIN_VW = 30;

/**
 * The canvas is 200vw x 200vh offset by half a viewport, so a child at `p`
 * percent sits at `2p - 50` viewport units. These convert between the two.
 *
 * It used to be 300% and, with the scatter that went with it, put four of six
 * frames between 101vw and 149vw — off the right-hand side of a canvas nobody
 * had dragged yet. The report was "I just see two images", and it was exactly
 * right.
 */
const CANVAS_SPAN = 200;
const CANVAS_OFFSET = 50;
const toCanvasPercent = (viewportUnits: number) =>
  (viewportUnits + CANVAS_OFFSET) / (CANVAS_SPAN / 100);

/**
 * Where each frame sits, in viewport units, before any dragging.
 *
 * A phyllotaxis spiral: each step turns by the golden angle and steps out by
 * the square root of the index, which is how sunflower seeds pack. It gives a
 * dense middle and a loose edge for free, at any count, without a table of
 * hand-placed coordinates that only works for six.
 *
 * The radii are deliberately WIDER THAN THE VIEWPORT. Frames landing half cut
 * by an edge is the whole affordance: a tidy cluster with clean margins reads
 * as a finished composition, and nobody drags a finished composition. Something
 * disappearing off the side is what says there is more.
 */
function scatter(index: number, total: number) {
  const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
  const angle = index * GOLDEN_ANGLE;
  // sqrt keeps the area per frame even; the floor stops a two-frame set from
  // stacking both in the middle.
  const spread = total <= 1 ? 0 : Math.sqrt(index / (total - 1));

  // Wider than tall: the viewport is, and matching it keeps the cloud from
  // reading as a column.
  const radiusX = 52 * spread;
  const radiusY = 40 * spread;

  // A deterministic wobble off the spiral. Seeded arithmetic rather than
  // Math.random() so the server and the client agree and the composition is
  // art-directable.
  const jitterX = ((index * 37) % 11) - 5;
  const jitterY = ((index * 53) % 9) - 4;

  return {
    x: 50 + radiusX * Math.cos(angle) + jitterX,
    y: 50 + radiusY * Math.sin(angle) + jitterY,
  };
}

/**
 * Drag-to-explore contact sheet.
 *
 * A canvas larger than the viewport, scattered with stills, that the user
 * throws around with the pointer. Momentum is hand-rolled rather than pulled
 * from a physics plugin: it is twenty lines, it has no licensing question
 * attached, and it keeps the interaction readable for whoever maintains this
 * next.
 *
 * `touch-action: none` is what makes this work on a phone — without it the
 * browser claims the gesture for page scroll before we ever see it.
 *
 * Clicking a frame opens the same viewer the stills section uses, so arrows,
 * Escape, fullscreen and keyboard navigation all behave the way they do there.
 *
 * Under reduced motion the canvas degrades to an ordinary scrollable grid: the
 * content is all still reachable and still opens the viewer, it just doesn't
 * fly.
 */
export function DragGallery({ stills, label, className }: DragGalleryProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  // Where the pointer went down, and how far it has travelled since — the
  // click/drag test.
  const origin = useRef({ x: 0, y: 0, distance: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const apply = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
  }, []);

  /**
   * Hold the cloud on screen.
   *
   * Without this a hard flick sends it into empty space and the section looks
   * broken — there is nothing out there to find, because everything is in the
   * middle by design.
   */
  const clamp = useCallback(() => {
    const limitX = (window.innerWidth * PAN_MARGIN_VW) / 100;
    const limitY = (window.innerHeight * PAN_MARGIN_VW) / 100;
    position.current.x = Math.min(Math.max(position.current.x, -limitX), limitX);
    position.current.y = Math.min(Math.max(position.current.y, -limitY), limitY);
  }, []);

  const glide = useCallback(() => {
    const step = () => {
      if (dragging.current) return;
      velocity.current.x *= FRICTION;
      velocity.current.y *= FRICTION;
      position.current.x += velocity.current.x;
      position.current.y += velocity.current.y;
      clamp();
      apply();

      if (
        Math.abs(velocity.current.x) > MIN_VELOCITY ||
        Math.abs(velocity.current.y) > MIN_VELOCITY
      ) {
        frame.current = requestAnimationFrame(step);
      }
    };
    step();
  }, [apply, clamp]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const viewer = (
    <ImageLightbox
      images={stills}
      index={openIndex}
      label={label}
      onClose={() => setOpenIndex(null)}
      onNavigate={setOpenIndex}
    />
  );

  if (prefersReducedMotion) {
    return (
      <>
        <div
          className={cn(
            "grid grid-cols-2 gap-4 overflow-y-auto p-container md:grid-cols-3",
            className,
          )}
        >
          {stills.map((still, index) => (
            <button
              key={still.id}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open ${still.alt}`}
              className="cursor-zoom-in"
            >
              <Image
                src={still.src}
                alt={still.alt}
                width={still.width}
                height={still.height}
                className="h-auto w-full rounded-[var(--radius-card)]"
              />
            </button>
          ))}
        </div>
        {viewer}
      </>
    );
  }

  return (
    <>
      <section
        className={cn(
          "relative h-dvh w-full overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className,
        )}
        aria-label="Behind the scenes, drag to explore"
        onPointerDown={(event) => {
          dragging.current = true;
          setIsDragging(true);
          cancelAnimationFrame(frame.current);
          last.current = { x: event.clientX, y: event.clientY };
          origin.current = { x: event.clientX, y: event.clientY, distance: 0 };
          velocity.current = { x: 0, y: 0 };
          (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          const dx = event.clientX - last.current.x;
          const dy = event.clientY - last.current.y;
          position.current.x += dx;
          position.current.y += dy;
          velocity.current = { x: dx, y: dy };
          last.current = { x: event.clientX, y: event.clientY };
          origin.current.distance = Math.hypot(
            event.clientX - origin.current.x,
            event.clientY - origin.current.y,
          );
          clamp();
          apply();
        }}
        onPointerUp={() => {
          dragging.current = false;
          setIsDragging(false);
          frame.current = requestAnimationFrame(glide);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setIsDragging(false);
        }}
        /*
          `pan-y`, not `none`. This section is a full viewport tall, so on a
          phone `none` made it a scroll trap: a swipe anywhere on screen panned
          the cloud and the page underneath could not be scrolled past it.
          `pan-y` gives the vertical gesture back to the page and keeps the
          horizontal one for the cloud. It applies to touch only — a mouse
          still drags both axes, which is why the desktop feel is unchanged.
        */
        style={{ touchAction: "pan-y" }}
      >
        <div
          ref={canvasRef}
          className="absolute will-change-transform"
          style={{
            width: `${CANVAS_SPAN}vw`,
            height: `${CANVAS_SPAN}vh`,
            top: `-${CANVAS_OFFSET}vh`,
            left: `-${CANVAS_OFFSET}vw`,
          }}
        >
          {stills.map((still, index) => {
            const point = scatter(index, stills.length);
            const portrait = still.aspect === "3/4";

            return (
              <figure
                key={still.id}
                className="absolute"
                style={{
                  left: `${toCanvasPercent(point.x)}%`,
                  top: `${toCanvasPercent(point.y)}%`,
                  // Pulled back from the anchor by half its own size so the
                  // spiral centres each frame rather than hanging it off its
                  // top-left corner.
                  transform: "translate(-50%, -50%)",
                  width: portrait ? "17vw" : "24vw",
                  minWidth: 200,
                }}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    // A throw ends with a click event on whatever is under the
                    // pointer. Only a pointer that stayed put opens the viewer.
                    //
                    // `detail` is the click count for a real pointer and 0 for
                    // a keyboard activation. Without that half of the test, a
                    // drag that ended over empty canvas leaves the travelled
                    // distance high and the next Enter press gets swallowed —
                    // the frames would stop being keyboard-operable after the
                    // first throw.
                    if (event.detail > 0 && origin.current.distance > CLICK_SLOP_PX) {
                      return;
                    }
                    setOpenIndex(index);
                  }}
                  aria-label={`Open ${still.alt}`}
                  className="block w-full cursor-zoom-in"
                >
                  <Image
                    src={still.src}
                    alt={still.alt}
                    width={still.width}
                    height={still.height}
                    draggable={false}
                    sizes="(min-width: 768px) 24vw, 60vw"
                    className="h-auto w-full rounded-[var(--radius-card)] shadow-base select-none"
                  />
                </button>
              </figure>
            );
          })}
        </div>

        <p className="pointer-events-none absolute bottom-container left-1/2 -translate-x-1/2 text-caption text-muted-foreground">
          Drag to explore
        </p>
      </section>
      {viewer}
    </>
  );
}
