import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AspectRatio } from "@/content/types";

const aspectClass: Record<AspectRatio, string> = {
  "16/9": "aspect-video",
  "3/4": "aspect-[3/4]",
  "1/1": "aspect-square",
  "9/16": "aspect-[9/16]",
};

interface MediaFrameProps {
  children: ReactNode;
  /** Omit to fill the parent instead of imposing a ratio (full-bleed usage). */
  aspect?: AspectRatio;
  rounded?: boolean;
  className?: string;
  /** Renders a dev-only badge so stand-in media can't ship unnoticed. */
  placeholder?: boolean;
}

/**
 * The box every piece of media lives in.
 *
 * It exists to guarantee three things, on every surface, without each caller
 * remembering them: the space is reserved before load (no layout shift), the
 * background under a transparent/loading frame is black rather than page
 * grey, and overflow is clipped so scale-on-hover has something to crop against.
 */
export function MediaFrame({
  children,
  aspect,
  rounded = false,
  className,
  placeholder = false,
}: MediaFrameProps) {
  return (
    <div
      className={cn(
        "group relative h-full w-full overflow-hidden bg-black",
        aspect && aspectClass[aspect],
        rounded && "rounded-[var(--radius-card)]",
        className,
      )}
    >
      {children}
      {placeholder && process.env.NODE_ENV !== "production" && (
        <span className="pointer-events-none absolute top-2 left-2 z-[var(--z-content)] rounded-full bg-black/70 px-2 py-0.5 text-[10px] tracking-normal text-white/70">
          Placeholder
        </span>
      )}
    </div>
  );
}
