"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Shared motion. One easing curve and one duration scale across the app, so
 * transitions feel like one hand made them.
 *
 * Everything here is motivated: `Reveal` sequences a list so the eye lands on
 * the newest item first, `Overlay` shows a dialog arriving from its trigger,
 * and `Swap` covers a view change that would otherwise jump. Nothing loops,
 * and nothing gates whether content is readable.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Staggered entrance for a list. Ordinal drives the delay, capped so a long
 * feed does not make the last card wait.
 *
 * This one is CSS, not Motion, and moves only the transform. A JS-driven
 * opacity fade leaves the card at `opacity: 0` whenever the animation never
 * gets a frame, which is what a throttled background tab does. Content must
 * never depend on an animation running to be readable.
 */
export function Reveal({
  children,
  index = 0,
  className = "",
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={`reveal-rise ${className}`}
      style={{ "--reveal-delay": `${Math.min(index, 6) * 50}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/**
 * Dialog surface: scrim fades, card rises.
 *
 * Rendered through a portal onto `document.body`. Dialogs are triggered from
 * all over the tree, including inside the sticky header, which sets
 * `backdrop-filter` and `z-index: 20` and therefore caps a stacking context.
 * A `z-40` overlay nested in there can never rise above page content, so it
 * appears behind the page. The portal takes it out of every local context.
 */
export function Overlay({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  const reduce = useReducedMotion();

  // Portals need a DOM target, so wait for the client before rendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The page behind a dialog must not scroll away under it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto overscroll-contain bg-[oklch(18%_0.02_155/0.55)] backdrop-blur-[2px] sm:items-start sm:p-4 sm:py-12"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 cursor-default"
          />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="relative w-full max-w-md pt-10 sm:pt-0"
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/** Crossfade between views that replace each other in place. */
export function Swap({ swapKey, children }: { swapKey: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={swapKey}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
