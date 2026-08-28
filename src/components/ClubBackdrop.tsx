"use client";

import { useId } from "react";

import type { Club, ClubPattern } from "@/demo/types";

/**
 * The artwork the whole club page sits on.
 *
 * Related to the club's banner but never the same drawing: the banner shows the
 * pitch, the backdrop shows the ball's panels; the banner is a filmstrip, the
 * backdrop is reels. Everything tiles, is drawn in the club's own colour at low
 * opacity, and sits behind the content — so it reads in both themes and never
 * fights the text.
 */
export function ClubBackdrop({ club }: { club: Pick<Club, "pattern" | "themeColor"> }) {
  const patternId = useId();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* A wash of the club colour, strongest at the top where the banner is. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 70% at 50% -10%, ${club.themeColor}24, transparent 68%)`,
        }}
      />

      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id={patternId}
            width={TILE[club.pattern].size}
            height={TILE[club.pattern].size}
            patternUnits="userSpaceOnUse"
          >
            <g
              fill={club.themeColor}
              stroke="none"
              opacity="0.10"
            >
              <Tile pattern={club.pattern} color={club.themeColor} />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

/** Tile size per motif, chosen so the repeat isn't obvious at page width. */
const TILE: Record<ClubPattern, { size: number }> = {
  field: { size: 172 },
  podium: { size: 188 },
  filmstrip: { size: 168 },
  grid: { size: 180 },
  circuit: { size: 176 },
  leaves: { size: 196 },
  waves: { size: 168 },
  confetti: { size: 180 },
};

/**
 * Flat repeats, not diagrams. Each is the banner's subject seen closer or from
 * a different angle, cut down to one or two solid forms so it stays quiet under
 * a page of text.
 */
function Tile({ pattern, color }: { pattern: ClubPattern; color: string }) {
  switch (pattern) {
    case "field":
      // The ball's panels, solid.
      return (
        <g>
          <path d="M42 12 L74 12 L84 42 L58 62 L32 42 Z" />
          <path d="M128 84 L160 84 L170 114 L144 134 L118 114 Z" />
          <circle cx="18" cy="120" r="13" opacity="0.6" />
        </g>
      );

    case "podium":
      // Solid quote blocks.
      return (
        <g>
          <rect x="18" y="24" width="54" height="18" rx="9" />
          <rect x="18" y="52" width="34" height="18" rx="9" />
          <rect x="104" y="118" width="54" height="18" rx="9" opacity="0.7" />
          <rect x="124" y="146" width="34" height="18" rx="9" opacity="0.7" />
        </g>
      );

    case "filmstrip":
      // Sprocket punches, flat.
      return (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="20" y={16 + i * 40} width="26" height="20" rx="5" />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <rect key={`b${i}`} x="118" y={36 + i * 40} width="26" height="20" rx="5" opacity="0.6" />
          ))}
        </g>
      );

    case "grid":
      // Quarter-circle and square: proportion.
      return (
        <g>
          <path d="M20 92 L20 20 A72 72 0 0 1 92 92 Z" />
          <rect x="118" y="118" width="42" height="42" opacity="0.6" />
        </g>
      );

    case "circuit":
      // Nucleus plus satellites.
      return (
        <g>
          <circle cx="52" cy="52" r="20" />
          <circle cx="132" cy="120" r="11" opacity="0.7" />
          <circle cx="140" cy="34" r="6" opacity="0.5" />
          <circle cx="26" cy="140" r="7" opacity="0.5" />
        </g>
      );

    case "leaves":
      // Solid leaves, alternating direction.
      return (
        <g>
          <path d="M96 16 C 96 62 66 92 20 92 C 20 46 50 16 96 16 Z" />
          <path d="M100 180 C 100 134 130 104 176 104 C 176 150 146 180 100 180 Z" opacity="0.65" />
        </g>
      );

    case "waves":
      return (
        <g>
          <path d="M-8 46 q 44 -30 88 0 t 88 0 v18 q -44 30 -88 0 t -88 0 Z" />
          <path d="M-8 118 q 44 -30 88 0 t 88 0 v18 q -44 30 -88 0 t -88 0 Z" opacity="0.6" />
        </g>
      );

    default:
      return (
        <g>
          <path d="M52 16 C 60 44 66 50 94 58 C 66 66 60 72 52 100 C 44 72 38 66 10 58 C 38 50 44 44 52 16 Z" />
          <circle cx="140" cy="128" r="10" opacity="0.6" />
        </g>
      );
  }
}
