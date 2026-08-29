"use client";

import type { Club, ClubPattern } from "@/demo/types";

/**
 * Per-club artwork, drawn as screenprints rather than diagrams.
 *
 * The earlier pass drew literal line-art (a full pitch with hash marks, a
 * wired circuit board) which read as clip-art. Riso and screenprint posters
 * work the opposite way: a few big flat shapes, one ink over paper, hard
 * contrast, and a lot of empty space. That is what these do now.
 *
 * A club gets two related pieces: `ClubMark` — the solid glyph here, which is
 * small enough to sit in a list — and `ClubScene`, the full drawing the club's
 * page sits on (ClubScenes.tsx). There is deliberately no banner: a colour bar
 * across the top of the page was the one thing making every club look like the
 * same template.
 */

export const PATTERN_CHOICES: Array<{ value: ClubPattern; label: string }> = [
  { value: "field", label: "Pitch" },
  { value: "podium", label: "Debate hall" },
  { value: "filmstrip", label: "Film set" },
  { value: "grid", label: "Blackboard" },
  { value: "circuit", label: "Laboratory" },
  { value: "leaves", label: "Forest" },
  { value: "waves", label: "Water" },
  { value: "confetti", label: "Confetti" },
];

/* -------------------------------------------------------------------- mark */

const MARK_SIZES = {
  sm: "h-6 w-6 rounded-[7px]",
  md: "h-9 w-9 rounded-[10px]",
  lg: "h-14 w-14 rounded-2xl",
  xl: "h-16 w-16 rounded-[20px] sm:h-20 sm:w-20 sm:rounded-3xl",
} as const;

/**
 * Solid, high-contrast glyph. Filled shapes rather than hairlines, so it still
 * reads at 24px in the nav menu.
 */
export function ClubMark({
  club,
  size = "md",
  tinted = true,
}: {
  club: Pick<Club, "pattern" | "themeColor">;
  size?: keyof typeof MARK_SIZES;
  tinted?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${MARK_SIZES[size]} inline-flex shrink-0 items-center justify-center overflow-hidden`}
      style={
        tinted
          ? { background: club.themeColor, color: "var(--color-paper)" }
          : { color: club.themeColor }
      }
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[62%] w-[62%]">
        <MarkShape pattern={club.pattern} />
      </svg>
    </span>
  );
}

function MarkShape({ pattern }: { pattern: ClubPattern }) {
  switch (pattern) {
    case "field":
      /* A football, drawn the way the ball is actually panelled: the centre
         pentagon, five seams running out from its corners, and the three
         part-pentagons the rim cuts off. The previous mark was a plain disc
         with a hole in it, which read as a camera aperture. */
      return (
        <g fillRule="evenodd">
          <path d="M12 0.6 A11.4 11.4 0 1 0 12 23.4 A11.4 11.4 0 1 0 12 0.6 Z M12 2.9 A9.1 9.1 0 1 1 12 21.1 A9.1 9.1 0 1 1 12 2.9 Z" />
          <path d="M12 6.55 L16.31 9.68 L14.66 14.75 L9.34 14.75 L7.69 9.68 Z" />
          <path d="M11.1 5.62 L11.1 1.6 L12.9 1.6 L12.9 5.62 Z" />
          <path d="M17.02 8.42 L20.84 7.18 L21.4 8.89 L17.58 10.13 Z" />
          <path d="M15.85 15.63 L18.21 18.88 L16.76 19.94 L14.39 16.69 Z" />
          <path d="M8.15 15.63 L9.61 16.69 L7.24 19.94 L5.79 18.88 Z" />
          <path d="M6.98 8.42 L6.42 10.13 L2.6 8.89 L3.16 7.18 Z" />
        </g>
      );

    case "podium":
      // Two solid slabs, offset: an exchange.
      return (
        <g>
          <rect x="1" y="3" width="14" height="9" rx="2" />
          <rect x="9" y="13" width="14" height="8" rx="2" />
        </g>
      );

    case "filmstrip":
      // Frame with sprockets punched out.
      return (
        <path
          d="M2 3 h20 v18 h-20 Z M4.5 5.5 v3 h3 v-3 Z M4.5 10.5 v3 h3 v-3 Z M4.5 15.5 v3 h3 v-3 Z M16.5 5.5 v3 h3 v-3 Z M16.5 10.5 v3 h3 v-3 Z M16.5 15.5 v3 h3 v-3 Z"
          fillRule="evenodd"
        />
      );

    case "grid":
      // A solid quadrant plus a counterweight: proportion, not a calculator.
      return (
        <g>
          <path d="M2 22 L2 8 A14 14 0 0 1 16 22 Z" />
          <rect x="18" y="2" width="4" height="4" />
          <rect x="18" y="18" width="4" height="4" />
        </g>
      );

    case "circuit":
      // Nucleus with two orbital caps.
      return (
        <g>
          <circle cx="12" cy="12" r="4.6" />
          <path d="M12 1.5 A10.5 10.5 0 0 1 22.5 12 h-3.4 A7.1 7.1 0 0 0 12 4.9 Z" />
          <path d="M12 22.5 A10.5 10.5 0 0 1 1.5 12 h3.4 A7.1 7.1 0 0 0 12 19.1 Z" />
        </g>
      );

    case "leaves":
      // One bold leaf, the vein cut through it.
      return (
        <path
          d="M21.5 2.5 C 21.5 13.5 14 21.5 2.5 21.5 C 2.5 10.5 10 2.5 21.5 2.5 Z M6.6 17.4 L17.6 6.4 L16.2 5 L5.2 16 Z"
          fillRule="evenodd"
        />
      );

    case "waves":
      return (
        <g>
          <path d="M0 6 q 4 -3.4 8 0 t 8 0 t 8 0 v3 q -4 3.4 -8 0 t -8 0 t -8 0 Z" />
          <path d="M0 14 q 4 -3.4 8 0 t 8 0 t 8 0 v3 q -4 3.4 -8 0 t -8 0 t -8 0 Z" />
        </g>
      );

    default:
      return (
        <path d="M12 0 C 14.4 9 15 9.6 24 12 C 15 14.4 14.4 15 12 24 C 9.6 15 9 14.4 0 12 C 9 9.6 9.6 9 12 0 Z" />
      );
  }
}
