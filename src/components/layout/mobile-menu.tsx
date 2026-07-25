"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { primaryNav } from "@/content/site";
import { duration, ease, stagger } from "@/lib/motion";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Full-screen navigation for < lg.
 *
 * Opens as a blurred sheet scaling down from the top edge, so it reads as
 * unfolding from the header rather than sliding in from nowhere. Items stagger
 * in behind it.
 *
 * Closing on route change is handled here rather than at every call site —
 * tapping a link navigates and dismisses in one gesture.
 */
export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
    // Intentionally keyed on pathname only: this fires on navigation, not when
    // the identity of onClose changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          className="fixed inset-0 z-[var(--z-menu)] flex origin-top flex-col bg-background/80 backdrop-blur-xl lg:hidden"
          initial={{ opacity: 0, scaleY: 0.92 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0.96 }}
          transition={{ duration: duration.base, ease: ease.inOutQuart }}
        >
          <div className="flex items-center justify-end pt-container container">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 px-4 py-2 text-caption uppercase"
            >
              Close
            </button>
          </div>

          <nav className="flex w-full flex-1 flex-col justify-center">
            <ul className="container divide-y divide-border">
              {primaryNav.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: duration.base,
                    ease: ease.outExpo,
                    delay: 0.08 + index * stagger.base,
                  }}
                >
                  <Link
                    href={item.href}
                    className="block py-5 text-display"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          <div className="container pb-8">
            <Link
              href="/studio#contact"
              onClick={onClose}
              className="block rounded-[var(--radius)] bg-white/10 py-4 text-center text-caption uppercase"
            >
              Start a project
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
