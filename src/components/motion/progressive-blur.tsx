import { cn } from "@/lib/cn";

interface ProgressiveBlurProps {
  className?: string;
  /** Number of stacked layers. More = smoother ramp, more compositing cost. */
  layers?: number;
  /** Blur radius of the strongest layer, in px. */
  maxBlur?: number;
  /** Which edge the blur intensifies toward. */
  side?: "bottom" | "top";
}

/**
 * A blur that ramps from nothing to strong across a band, used to sink UI text
 * into footage without a hard scrim edge.
 *
 * A single large `backdrop-filter` with a gradient mask bands badly. Stacking
 * several progressively stronger, progressively offset layers approximates a
 * true blur gradient and stays smooth. Eight layers is the point of
 * diminishing returns.
 *
 * Server component — it is pure CSS, so it costs no client JS.
 */
export function ProgressiveBlur({
  className,
  layers = 7,
  maxBlur = 24,
  side = "bottom",
}: ProgressiveBlurProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      {Array.from({ length: layers }, (_, i) => {
        const step = (i + 1) / layers;
        // Each layer starts later and blurs harder than the one beneath it.
        const start = side === "bottom" ? (i / layers) * 100 : 100 - (i / layers) * 100;
        const gradient =
          side === "bottom"
            ? `linear-gradient(to bottom, transparent ${start}%, black ${Math.min(start + 100 / layers, 100)}%)`
            : `linear-gradient(to top, transparent ${100 - start}%, black ${Math.max(100 - start - 100 / layers, 0)}%)`;

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${(maxBlur * step * step).toFixed(2)}px)`,
              WebkitBackdropFilter: `blur(${(maxBlur * step * step).toFixed(2)}px)`,
              maskImage: gradient,
              WebkitMaskImage: gradient,
            }}
          />
        );
      })}
    </div>
  );
}
