"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { ImageAsset } from "@/content/types";
import { useReducedMotion } from "@/lib/hooks";

interface DragGalleryProps {
  stills: ImageAsset[];
  className?: string;
}

const FRICTION = 0.92;
const MIN_VELOCITY = 0.05;

/**
 * Drag-to-explore contact sheet.
 *
 * A canvas several viewports wide and tall, scattered with stills, that the
 * user throws around with the pointer. Momentum is hand-rolled rather than
 * pulled from a physics plugin: it is twenty lines, it has no licensing
 * question attached, and it keeps the interaction readable for whoever
 * maintains this next.
 *
 * `touch-action: none` is what makes this work on a phone — without it the
 * browser claims the gesture for page scroll before we ever see it.
 *
 * Under reduced motion the canvas degrades to an ordinary scrollable grid: the
 * content is all still reachable, it just doesn't fly.
 */
export function DragGallery({ stills, className }: DragGalleryProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const apply = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0)`;
  }, []);

  // Momentum loop — runs only while there is momentum left to spend.
  // The recursive step is a local function so it can schedule itself without
  // the callback referencing its own binding.
  const glide = useCallback(() => {
    const step = () => {
      if (dragging.current) return;
      velocity.current.x *= FRICTION;
      velocity.current.y *= FRICTION;
      position.current.x += velocity.current.x;
      position.current.y += velocity.current.y;
      apply();

      if (
        Math.abs(velocity.current.x) > MIN_VELOCITY ||
        Math.abs(velocity.current.y) > MIN_VELOCITY
      ) {
        frame.current = requestAnimationFrame(step);
      }
    };
    step();
  }, [apply]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-4 overflow-y-auto p-container md:grid-cols-3",
          className,
        )}
      >
        {stills.map((still) => (
          <Image
            key={still.id}
            src={still.src}
            alt={still.alt}
            width={still.width}
            height={still.height}
            className="h-auto w-full rounded-[var(--radius-card)]"
          />
        ))}
      </div>
    );
  }

  return (
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
      style={{ touchAction: "none" }}
    >
      <div
        ref={canvasRef}
        className="absolute will-change-transform"
        style={{ width: "300vw", height: "300vh", top: "-100vh", left: "-100vw" }}
      >
        {stills.map((still, index) => {
          // Deterministic scatter — a seeded layout rather than Math.random(),
          // so server and client agree and the composition is art-directable.
          const column = index % 4;
          const row = Math.floor(index / 4);
          const jitterX = ((index * 37) % 13) - 6;
          const jitterY = ((index * 53) % 11) - 5;

          return (
            <figure
              key={still.id}
              className="absolute"
              style={{
                left: `${28 + column * 18 + jitterX}%`,
                top: `${30 + row * 20 + jitterY}%`,
                width: still.aspect === "3/4" ? "14vw" : "20vw",
                minWidth: 180,
              }}
            >
              <Image
                src={still.src}
                alt={still.alt}
                width={still.width}
                height={still.height}
                draggable={false}
                className="h-auto w-full rounded-[var(--radius-card)] select-none"
              />
            </figure>
          );
        })}
      </div>

      <p className="pointer-events-none absolute bottom-container left-1/2 -translate-x-1/2 text-caption text-muted-foreground">
        Drag to explore
      </p>
    </section>
  );
}
