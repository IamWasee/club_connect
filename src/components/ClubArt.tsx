"use client";

import { useId } from "react";

import type { Club, ClubPattern } from "@/demo/types";

/**
 * Per-club artwork, drawn as screenprints rather than diagrams.
 *
 * The earlier pass drew literal line-art (a full pitch with hash marks, a
 * wired circuit board) which read as clip-art. Riso and screenprint posters
 * work the opposite way: a few big flat shapes, one ink over paper, hard
 * contrast, and a lot of empty space. That is what these do now.
 *
 * Each club gets three related pieces: `ClubMark` (solid glyph), `ClubBanner`
 * (the poster) and `ClubBackdrop` (the page it sits on, in ClubBackdrop.tsx).
 */

export const PATTERN_CHOICES: Array<{ value: ClubPattern; label: string }> = [
  { value: "field", label: "Pitch" },
  { value: "podium", label: "Debate" },
  { value: "filmstrip", label: "Film" },
  { value: "grid", label: "Graph" },
  { value: "circuit", label: "Science" },
  { value: "leaves", label: "Foliage" },
  { value: "waves", label: "Waves" },
  { value: "confetti", label: "Confetti" },
];

/* -------------------------------------------------------------------- mark */

const MARK_SIZES = {
  sm: "h-6 w-6 rounded-[7px]",
  md: "h-9 w-9 rounded-[10px]",
  lg: "h-14 w-14 rounded-2xl",
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

/* ------------------------------------------------------------------ banner */

/**
 * The club's poster. Flat ink on flat paper, one or two big forms, a lot of
 * space left empty so the club name can sit on top of it.
 */
export function ClubBanner({
  club,
  className = "",
}: {
  club: Pick<Club, "pattern" | "themeColor">;
  className?: string;
}) {
  const id = useId();

  return (
    <svg
      viewBox="0 0 800 260"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Screenprint misregistration: the ink layer is offset a hair and
            softened, which is what stops these reading as vector clip-art. */}
        <filter id={`grain-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="d" />
          <feComponentTransfer in="d" result="g">
            <feFuncA type="linear" slope="0.42" />
          </feComponentTransfer>
          <feComposite in="g" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Paper. Deliberately the club colour at low strength, not white. */}
      <rect width="800" height="260" fill={club.themeColor} opacity="0.14" />

      <g fill={club.themeColor}>
        <PosterShapes pattern={club.pattern} />
      </g>

      {/* Ink texture pass. */}
      <g filter={`url(#grain-${id})`} opacity="0.5">
        <rect width="800" height="260" fill={club.themeColor} />
      </g>
    </svg>
  );
}

/**
 * Compositions are weighted right so the club name, which sits bottom-left,
 * always lands on quiet paper.
 */
function PosterShapes({ pattern }: { pattern: ClubPattern }) {
  switch (pattern) {
    case "field":
      // The ball, oversized and cropped, with the centre circle behind it.
      return (
        <g>
          <circle cx="596" cy="120" r="132" opacity="0.9" />
          <circle cx="596" cy="120" r="132" fill="var(--color-paper)" opacity="0.16" />
          <path
            d="M596 40 L664 89 L638 169 L554 169 L528 89 Z"
            fill="var(--color-paper)"
            opacity="0.92"
          />
          <circle cx="596" cy="120" r="196" fill="none" stroke="currentColor" />
          <g opacity="0.32">
            <rect x="0" y="228" width="800" height="10" />
            <rect x="0" y="0" width="10" height="260" />
          </g>
        </g>
      );

    case "podium":
      // Two slabs mid-exchange, one overlapping the other.
      return (
        <g>
          <rect x="392" y="26" width="300" height="96" rx="10" opacity="0.92" />
          <rect x="480" y="140" width="300" height="88" rx="10" opacity="0.5" />
          <g fill="var(--color-paper)" opacity="0.85">
            <rect x="418" y="52" width="200" height="12" rx="6" />
            <rect x="418" y="80" width="140" height="12" rx="6" />
          </g>
          <g fill="var(--color-paper)" opacity="0.6">
            <rect x="506" y="166" width="180" height="12" rx="6" />
            <rect x="506" y="194" width="120" height="12" rx="6" />
          </g>
        </g>
      );

    case "filmstrip":
      // A single oversized frame, sprockets punched clean through.
      return (
        <g>
          <rect x="360" y="-30" width="470" height="320" opacity="0.9" />
          <g fill="var(--color-paper)">
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={`l${i}`} x="384" y={-14 + i * 44} width="30" height="24" rx="5" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={`r${i}`} x="776" y={-14 + i * 44} width="30" height="24" rx="5" />
            ))}
            <rect x="432" y="24" width="322" height="212" opacity="0.22" />
          </g>
        </g>
      );

    case "grid":
      // A quarter-circle sweep against two blocks: proportion made visible.
      return (
        <g>
          <path d="M800 260 L800 20 A240 240 0 0 0 560 260 Z" opacity="0.9" />
          <path
            d="M800 260 L800 116 A144 144 0 0 0 656 260 Z"
            fill="var(--color-paper)"
            opacity="0.4"
          />
          <rect x="392" y="30" width="76" height="76" opacity="0.55" />
          <rect x="392" y="152" width="76" height="76" opacity="0.28" />
        </g>
      );

    case "circuit":
      // Nucleus and one clean orbit, cropped by the frame.
      return (
        <g>
          <circle cx="612" cy="130" r="64" opacity="0.95" />
          <ellipse
            cx="612"
            cy="130"
            rx="196"
            ry="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="18"
            opacity="0.55"
            transform="rotate(-24 612 130)"
          />
          <circle cx="428" cy="196" r="18" opacity="0.8" />
          <circle cx="784" cy="58" r="12" opacity="0.6" />
        </g>
      );

    case "leaves":
      // One leaf, big enough to crop, with its vein knocked out.
      return (
        <g>
          <path
            d="M812 -18 C 812 148 700 262 520 262 C 520 96 632 -18 812 -18 Z"
            opacity="0.92"
          />
          <path
            d="M528 254 L804 -10"
            stroke="var(--color-paper)"
            strokeWidth="16"
            fill="none"
            opacity="0.85"
          />
          <circle cx="404" cy="66" r="26" opacity="0.42" />
        </g>
      );

    case "waves":
      return (
        <g>
          {[70, 132, 194].map((y, i) => (
            <path
              key={y}
              d={`M340 ${y} q 60 -46 120 0 t 120 0 t 120 0 t 120 0 v34 q -60 46 -120 0 t -120 0 t -120 0 t -120 0 Z`}
              opacity={0.9 - i * 0.26}
            />
          ))}
        </g>
      );

    default:
      return (
        <g>
          <path d="M600 24 C 618 96 630 108 702 126 C 630 144 618 156 600 228 C 582 156 570 144 498 126 C 570 108 582 96 600 24 Z" opacity="0.92" />
          <circle cx="760" cy="52" r="20" opacity="0.5" />
          <circle cx="440" cy="196" r="13" opacity="0.35" />
        </g>
      );
  }
}
