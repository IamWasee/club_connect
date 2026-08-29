"use client";

import { useId } from "react";

import { ClubScene } from "@/components/ClubScenes";
import type { Club } from "@/demo/types";

/**
 * The artwork the whole club page sits on.
 *
 * With the banner gone this is the club's only picture, so it does more work
 * than the old tiling motif did: it is a scene of the thing the club does,
 * anchored to the bottom of the viewport and faded out toward the top, where
 * the masthead and the feed live. Text never has to compete with it.
 */
export function ClubBackdrop({ club }: { club: Pick<Club, "pattern" | "themeColor"> }) {
  const id = useId();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* A wash of the club colour, rising from the floor of the scene. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 78% at 50% 106%, ${club.themeColor}26, transparent 72%)`,
        }}
      />

      {/*
        `h-auto` + the viewBox keeps the scene's proportions at any width, so it
        is never stretched. The minimum width holds the drawing at a usable
        scale on a phone — below it the scene would collapse into a thin strip
        along the bottom of the screen — and the overflow is cropped either side.
      */}
      <svg
        className="absolute bottom-0 left-1/2 h-auto w-full min-w-[900px] -translate-x-1/2"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id={`fade-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.24" stopColor="#fff" stopOpacity="0.32" />
            <stop offset="0.55" stopColor="#fff" stopOpacity="1" />
          </linearGradient>
          <mask id={`mask-${id}`}>
            <rect width="1440" height="900" fill={`url(#fade-${id})`} />
          </mask>
        </defs>

        {/* The ink is the club's colour pulled toward the page's own text
            colour. `--color-ink` flips with the theme, so the drawing darkens
            on paper and lightens on a dark canvas without a second palette. */}
        <g
          mask={`url(#mask-${id})`}
          style={{ color: `color-mix(in oklab, ${club.themeColor} 62%, var(--color-ink))` }}
          className="opacity-[0.3] dark:opacity-[0.34]"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ClubScene pattern={club.pattern} />
        </g>
      </svg>
    </div>
  );
}

/**
 * The same scene, boxed. Used where a club has to be previewed rather than
 * entered — picking the artwork when a club is created.
 */
export function ClubArtSwatch({
  club,
  className = "",
}: {
  club: Pick<Club, "pattern" | "themeColor">;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMax slice"
    >
      <rect width="1440" height="900" fill={club.themeColor} opacity="0.09" />
      <g
        style={{ color: `color-mix(in oklab, ${club.themeColor} 70%, var(--color-ink))` }}
        opacity="0.5"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ClubScene pattern={club.pattern} />
      </g>
    </svg>
  );
}
