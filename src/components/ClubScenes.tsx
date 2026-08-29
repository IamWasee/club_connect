"use client";

import type { ClubPattern } from "@/demo/types";

/**
 * The scene behind a club's page.
 *
 * Each club used to be introduced by a banner across the top, which is the
 * exact shape Google Classroom uses: every club came out as the same template
 * with the hue swapped. The banner is gone. The artwork is now a scene of the
 * thing the club actually does, drawn once at 1440x900 and cropped by the
 * viewport behind the whole page.
 *
 * Everything is stroked or filled in `currentColor`, so the caller sets the
 * club's colour once. Nothing is knocked out to the page background: a hole
 * punched in `--color-canvas` would be wrong in the other theme, so depth
 * comes from opacity alone.
 */
export function ClubScene({ pattern }: { pattern: ClubPattern }) {
  switch (pattern) {
    case "field":
      return <Pitch />;
    case "podium":
      return <DebateHall />;
    case "filmstrip":
      return <FilmSet />;
    case "circuit":
      return <Laboratories />;
    case "grid":
      return <Chalkboard />;
    case "leaves":
      return <Forest />;
    case "waves":
      return <Waves />;
    default:
      return <Confetti />;
  }
}

/* ------------------------------------------------------- football: a pitch */

/** Seen from behind the far goal, floodlit, with the stand banked above it. */
function Pitch() {
  // One-point perspective. v = 0 at the far touchline, 1 at the near edge.
  const y = (v: number) => 300 + 600 * v;
  const x = (u: number, v: number) => {
    const left = 430 - 670 * v;
    return left + u * (1010 + 670 * v - left);
  };
  const stripe = (a: number, b: number) =>
    `M${x(a, 1)} 900 L${x(b, 1)} 900 L${x(b, 0)} 300 L${x(a, 0)} 300 Z`;

  return (
    <g>
      <path d="M0 300 L1440 300 L1440 214 Q720 148 0 214 Z" opacity="0.16" />
      {[0, 1, 2].map((row) => (
        <path
          key={row}
          d={`M60 ${272 - row * 28} Q720 ${212 - row * 28} 1380 ${272 - row * 28}`}
          fill="none"
          strokeWidth="10"
          strokeDasharray="3 15"
          opacity={0.38 - row * 0.09}
        />
      ))}
      {[168, 1272].map((px) => (
        <g key={px} opacity="0.32">
          <rect x={px - 4} y="96" width="8" height="128" />
          <path d={`M${px - 52} 40 h104 v46 h-104 Z`} />
        </g>
      ))}

      {/* Mown stripes, converging on the goal. */}
      {[0, 2, 4, 6].map((i) => (
        <path key={i} d={stripe(i / 8, (i + 1) / 8)} opacity="0.11" />
      ))}

      <g fill="none" strokeWidth="5" opacity="0.45">
        <path d={stripe(0, 1)} />
        <path d={`M${x(0, 0.3)} ${y(0.3)} H${x(1, 0.3)}`} />
        <ellipse cx="720" cy={y(0.3)} rx="196" ry="46" />
        <path
          d={`M${x(0.28, 0)} ${y(0)} L${x(0.28, 0.14)} ${y(0.14)} L${x(0.72, 0.14)} ${y(0.14)} L${x(0.72, 0)} ${y(0)}`}
        />
        <path d={`M${x(0.2, 0.58)} ${y(0.58)} L${x(0.2, 1)} 900`} />
        <path d={`M${x(0.2, 0.58)} ${y(0.58)} H${x(0.8, 0.58)}`} />
        <path d={`M${x(0.8, 0.58)} ${y(0.58)} L${x(0.8, 1)} 900`} />
      </g>
      <ellipse cx="720" cy={y(0.3)} rx="9" ry="4" opacity="0.45" />

      <g fill="none" strokeWidth="7" opacity="0.55">
        <path d="M638 300 V252 H802 V300" />
        <path d="M638 252 L664 226 H776 L802 252" />
      </g>
    </g>
  );
}

/* ---------------------------------------------------- debate: stands, mics */

/** A hall: banked stands, a pedestal between them, mics on the floor. */
function DebateHall() {
  const heads = (start: number, top: number, count: number) =>
    Array.from({ length: count }, (_, i) => (
      <circle key={i} cx={start + i * 58} cy={top - 21} r="15" />
    ));

  return (
    <g>
      <rect x="386" y="118" width="668" height="470" rx="16" opacity="0.09" />
      <rect x="386" y="118" width="668" height="470" rx="16" fill="none" strokeWidth="5" opacity="0.26" />

      {[false, true].map((flipped) => (
        <g
          key={String(flipped)}
          opacity="0.22"
          transform={flipped ? "translate(1440,0) scale(-1,1)" : undefined}
        >
          <path d="M0 900 L0 372 L124 372 L124 436 L248 436 L248 500 L372 500 L372 564 L476 564 L476 900 Z" />
          <g opacity="0.6">
            {heads(38, 372, 2)}
            {heads(154, 436, 2)}
            {heads(278, 500, 2)}
            {heads(396, 564, 1)}
          </g>
        </g>
      ))}

      <path d="M292 754 L1148 754 L1208 828 L232 828 Z" opacity="0.16" />
      <path d="M232 828 H1208 V900 H232 Z" opacity="0.24" />

      {/* The pedestal, with two goosenecks over the reading surface. */}
      <path d="M598 496 L842 496 L860 528 L580 528 Z" opacity="0.5" />
      <path d="M604 528 L836 528 L812 754 L628 754 Z" opacity="0.36" />
      <rect x="666" y="588" width="108" height="104" rx="10" opacity="0.26" />
      <g fill="none" strokeWidth="9" opacity="0.55">
        <path d="M678 496 C 678 448 640 442 624 408" />
        <path d="M762 496 C 762 448 800 442 816 408" />
      </g>
      <g opacity="0.55">
        <ellipse cx="618" cy="392" rx="15" ry="24" transform="rotate(-24 618 392)" />
        <ellipse cx="822" cy="392" rx="15" ry="24" transform="rotate(24 822 392)" />
      </g>

      {[1, -1].map((dir) => {
        const px = dir === 1 ? 336 : 1104;
        return (
          <g key={px} opacity="0.45">
            <g fill="none" strokeWidth="9">
              <path d={`M${px} 792 V 572`} />
              <path d={`M${px} 792 l ${-52} 44 M${px} 792 l 52 44 M${px} 792 v 46`} />
              <path d={`M${px} 588 q ${44 * dir} -34 ${92 * dir} -16`} />
            </g>
            <ellipse
              cx={px + 100 * dir}
              cy="570"
              rx="22"
              ry="13"
              transform={`rotate(${-14 * dir} ${px + 100 * dir} 570)`}
            />
          </g>
        );
      })}
    </g>
  );
}

/* -------------------------------------------------------- film: behind the camera */

/** The set as the crew sees it: camera, key light, boom, slate on the floor. */
function FilmSet() {
  const legs = (px: number, top: number) =>
    `M${px} ${top} l -68 168 M${px} ${top} l 68 168 M${px} ${top} l 6 150`;

  return (
    <g>
      <rect x="318" y="176" width="820" height="550" opacity="0.07" />
      <rect x="318" y="176" width="820" height="550" fill="none" strokeWidth="5" opacity="0.24" />
      <rect x="470" y="330" width="180" height="396" fill="none" strokeWidth="5" opacity="0.24" />
      <path d="M0 726 H1440" fill="none" strokeWidth="5" opacity="0.3" />

      {/* Key light, throwing across the set toward the camera. */}
      <path d="M1050 372 L470 262 L470 692 L1050 470 Z" opacity="0.07" />
      <g opacity="0.5">
        <path d={legs(1122, 726)} fill="none" strokeWidth="9" />
        <path d="M1122 726 V 470" fill="none" strokeWidth="10" />
        <rect x="1062" y="368" width="118" height="106" rx="12" />
        <g opacity="0.7">
          <path d="M1036 336 L1196 336 L1174 368 L1058 368 Z" />
          <path d="M1036 506 L1196 506 L1174 474 L1058 474 Z" />
          <path d="M1030 342 L1030 500 L1058 474 L1058 368 Z" />
        </g>
      </g>

      <g opacity="0.7">
        <path d={legs(438, 726)} fill="none" strokeWidth="10" />
        <rect x="408" y="690" width="60" height="42" rx="8" />
        <rect x="352" y="556" width="176" height="136" rx="14" />
        <rect x="322" y="576" width="34" height="38" rx="6" opacity="0.7" />
        <rect x="528" y="592" width="62" height="64" rx="6" opacity="0.85" />
        <rect x="590" y="574" width="76" height="100" rx="8" opacity="0.55" />
        <path d="M584 562 h96 v-14 h-96 Z" opacity="0.6" />
        <circle cx="546" cy="690" r="19" opacity="0.5" />
      </g>

      <g opacity="0.55">
        <path d="M1440 116 L862 322" fill="none" strokeWidth="12" />
        <ellipse cx="822" cy="338" rx="64" ry="27" transform="rotate(-20 822 338)" />
      </g>

      <g opacity="0.4">
        <path d={legs(152, 726)} fill="none" strokeWidth="9" />
        <path d="M152 726 V 384 M152 396 H 66" fill="none" strokeWidth="9" />
        <rect x="30" y="286" width="150" height="102" rx="8" transform="rotate(-7 105 337)" />
      </g>

      <g opacity="0.45">
        <path d="M604 806 L816 758 L838 852 L626 900 Z" />
        <path d="M598 788 L812 740 L820 776 L606 824 Z" opacity="0.55" />
      </g>
      <g fill="none" strokeWidth="9" opacity="0.35">
        <ellipse cx="266" cy="858" rx="86" ry="34" />
        <ellipse cx="266" cy="858" rx="50" ry="20" />
      </g>
    </g>
  );
}

/* --------------------------------------------- stem: three benches, one room */

/** Chemistry on the left, the ring in the middle, life on the right. */
function Laboratories() {
  return (
    <g>
      <g fill="none" strokeWidth="4" opacity="0.22">
        <path d="M480 150 V 830 M960 150 V 830" />
      </g>

      <g opacity="0.6">
        <path d="M60 706 H 456" fill="none" strokeWidth="5" opacity="0.6" />
        <path
          d="M232 512 H 268 V 572 L 320 668 A16 16 0 0 1 306 692 L 194 692 A16 16 0 0 1 180 668 L 232 572 Z"
          fill="none"
          strokeWidth="9"
        />
        <path d="M210 634 L290 634 L320 668 A16 16 0 0 1 306 692 L194 692 A16 16 0 0 1 180 668 Z" opacity="0.4" />
        <g fill="none" strokeWidth="8">
          <path d="M436 706 V 470 M436 600 H 386" />
          <circle cx="382" cy="640" r="48" />
          <path d="M368 596 V 532 H 396 V 596" />
          <path d="M392 706 H 476" />
        </g>
        <g opacity="0.45">
          <circle cx="382" cy="498" r="9" />
          <circle cx="360" cy="464" r="6" />
          <circle cx="396" cy="436" r="7" />
        </g>
        <g opacity="0.5">
          {[72, 110, 148].map((tx) => (
            <rect key={tx} x={tx} y="546" width="26" height="86" rx="13" />
          ))}
          <path d="M60 588 H 188 V 604 H 60 Z" opacity="0.7" />
        </g>
      </g>

      <g opacity="0.6">
        <path d="M528 654 H 912" fill="none" strokeWidth="5" opacity="0.6" />
        <path d="M604 548 V 654 M836 548 V 654" fill="none" strokeWidth="7" opacity="0.45" />
        <ellipse cx="720" cy="466" rx="196" ry="82" fill="none" strokeWidth="12" opacity="0.5" />
        <ellipse cx="720" cy="466" rx="152" ry="64" fill="none" strokeWidth="4" opacity="0.28" />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <rect
              key={i}
              x={720 + 196 * Math.cos(a) - 11}
              y={466 + 82 * Math.sin(a) - 11}
              width="22"
              height="22"
              rx="5"
              opacity="0.55"
            />
          );
        })}
        <circle cx="720" cy="466" r="34" opacity="0.45" />
        <circle cx="720" cy="466" r="15" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <path
              key={i}
              d={`M${720 + 44 * Math.cos(a)} ${466 + 44 * Math.sin(a)} L${720 + 84 * Math.cos(a)} ${466 + 84 * Math.sin(a)}`}
              fill="none"
              strokeWidth="6"
              opacity="0.4"
            />
          );
        })}
        <path d="M534 700 L662 522" fill="none" strokeWidth="9" opacity="0.45" />
        <path d="M566 656 L600 608 M614 588 L648 540" fill="none" strokeWidth="22" strokeLinecap="butt" opacity="0.3" />
      </g>

      <g opacity="0.6">
        <circle cx="1214" cy="376" r="92" fill="none" strokeWidth="10" opacity="0.5" />
        <circle cx="1234" cy="356" r="34" opacity="0.45" />
        <ellipse cx="1170" cy="420" rx="26" ry="13" transform="rotate(-28 1170 420)" opacity="0.35" />
        <ellipse cx="1250" cy="428" rx="20" ry="10" transform="rotate(22 1250 428)" opacity="0.35" />

        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * Math.PI * 2;
          return (
            <path
              key={i}
              d={`M${1272 + 112 * Math.cos(a)} ${698 + 80 * Math.sin(a)} l ${17 * Math.cos(a)} ${17 * Math.sin(a)}`}
              fill="none"
              strokeWidth="6"
              opacity="0.3"
            />
          );
        })}
        <path
          d="M1180 652 C 1258 596 1362 618 1382 686 C 1398 746 1320 790 1246 768 C 1180 748 1136 692 1180 652 Z"
          fill="none"
          strokeWidth="9"
          opacity="0.45"
        />
        <circle cx="1278" cy="696" r="22" opacity="0.3" />

        <g fill="none" strokeWidth="9" opacity="0.45">
          <path d="M1032 452 q 46 46 0 92 q -46 46 0 92 q 46 46 0 92 q -46 46 0 92" />
          <path d="M1032 452 q -46 46 0 92 q 46 46 0 92 q -46 46 0 92 q 46 46 0 92" />
        </g>
        <g fill="none" strokeWidth="6" opacity="0.3">
          {[498, 590, 682, 774].map((cy) => (
            <path key={cy} d={`M1000 ${cy} H 1064`} />
          ))}
        </g>
      </g>
    </g>
  );
}

/* ------------------------------------------------- math: a teacher and a board */

/** Someone working through it on the board, mid-explanation. */
function Chalkboard() {
  return (
    <g>
      <path d="M0 812 H1440" fill="none" strokeWidth="5" opacity="0.26" />

      <rect x="256" y="128" width="1056" height="520" rx="10" opacity="0.08" />
      <rect x="256" y="128" width="1056" height="520" rx="10" fill="none" strokeWidth="10" opacity="0.35" />
      <path d="M244 652 H 1324 V 674 H 244 Z" opacity="0.26" />
      <rect x="1176" y="656" width="64" height="14" rx="7" opacity="0.4" />

      <g opacity="0.5">
        {/* Working, written out: read as lines of it rather than real text. */}
        <g fill="none" strokeWidth="10" strokeDasharray="52 22 28 30">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M318 ${196 + i * 52} H ${592 - (i % 3) * 74}`} />
          ))}
        </g>
        <rect x="318" y="470" width="196" height="80" rx="8" fill="none" strokeWidth="8" />
        <path d="M348 510 H 484" fill="none" strokeWidth="10" strokeDasharray="46 20 34" />

        <g fill="none" strokeWidth="7">
          <path d="M660 546 H 950" />
          <path d="M726 202 V 600" />
          <path d="M672 254 Q 800 656 934 254" />
          <circle cx="1122" cy="284" r="86" />
          <path d="M1122 284 L1183 223" />
          <path d="M1032 596 L1232 596 L1232 448 Z" />
          <path d="M1202 596 V 566 H 1232" />
        </g>
        <circle cx="1122" cy="284" r="8" />
      </g>

      <g opacity="0.65">
        <circle cx="172" cy="296" r="42" />
        <path d="M132 348 q 40 -16 80 0 l 28 194 q -68 22 -136 0 Z" />
        <path d="M146 542 l -16 270 h 42 l 16 -180 l 18 180 h 42 l -20 -270 Z" />
        <path d="M212 372 L 336 254" fill="none" strokeWidth="24" />
        <circle cx="344" cy="248" r="15" />
        <path d="M352 240 L 446 190" fill="none" strokeWidth="7" opacity="0.7" />
      </g>
    </g>
  );
}

/* ------------------------------------------ environmental: a forest, looking down */

/**
 * Canopies from above, at an angle. Trunks lean out from under each crown and
 * shadows fall the same way, which is what stops it reading as a flat pattern
 * of circles.
 */
const CANOPIES: Array<[x: number, y: number, r: number]> = [
  [96, 186, 46], [232, 148, 42], [372, 206, 50], [524, 152, 44], [676, 196, 48],
  [1010, 160, 46], [1156, 214, 52], [1316, 158, 44], [150, 388, 68], [330, 430, 74],
  [546, 372, 62], [1046, 400, 70], [1252, 452, 78], [1408, 356, 60], [118, 690, 108],
  [356, 764, 120], [900, 700, 104], [1148, 812, 128], [1392, 682, 96],
];

function Forest() {
  return (
    <g>
      {/* The trail cutting up through the stand. */}
      <path
        d="M404 900 C 486 686 626 632 712 512 C 772 428 796 344 862 250 L 952 282 C 884 376 862 452 796 552 C 700 700 646 730 620 900 Z"
        opacity="0.16"
      />
      {CANOPIES.map(([x, y, r], i) => (
        <Canopy key={`${x}-${y}`} x={x} y={y} r={r} seed={i} />
      ))}
    </g>
  );
}

/**
 * One tree from above and slightly to the side: the crown, the trunk leaning
 * out from under it, and the shadow falling the same way. Every crown is turned
 * by a different amount, or nineteen identical clusters read as a pattern of
 * circles rather than a wood.
 */
function Canopy({ x, y, r, seed }: { x: number; y: number; r: number; seed: number }) {
  const turn = ((seed * 47) % 360) - 180;
  const lobes: Array<[dx: number, dy: number, scale: number]> = [
    [0, 0, 0.6], [-0.56, 0.24, 0.44], [0.54, 0.16, 0.5],
    [-0.2, -0.48, 0.4], [0.24, 0.52, 0.38], [0.36, -0.36, 0.3],
  ];

  return (
    <g opacity={0.24 + (y / 900) * 0.46}>
      <ellipse cx={x + r * 0.82} cy={y + r * 1.26} rx={r * 0.86} ry={r * 0.3} opacity="0.28" />
      <path
        d={`M${x + r * 0.26} ${y + r * 0.24} L${x + r * 0.38} ${y + r * 0.22} L${x + r * 0.6} ${y + r * 1.3} L${x + r * 0.44} ${y + r * 1.32} Z`}
        opacity="0.4"
      />
      <g transform={`rotate(${turn} ${x} ${y})`}>
        {lobes.map(([dx, dy, scale], i) => (
          <circle
            key={i}
            cx={x + r * dx}
            cy={y + r * dy}
            r={r * scale * (0.9 + ((seed * (i + 3)) % 5) * 0.05)}
          />
        ))}
      </g>
    </g>
  );
}

/* -------------------------------------------------------------- fallbacks */

/** For a club that picked "Waves": open water under a low sun. */
function Waves() {
  return (
    <g>
      <circle cx="1076" cy="262" r="118" opacity="0.2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M-40 ${470 + i * 96} q 120 -70 240 0 t 240 0 t 240 0 t 240 0 t 240 0 t 240 0 V 900 H -40 Z`}
          opacity={0.09 + i * 0.045}
        />
      ))}
    </g>
  );
}

/** For a new club that has not picked a motif yet. Deterministic, not random. */
function Confetti() {
  return (
    <g>
      {Array.from({ length: 46 }, (_, i) => {
        const cx = ((i * 197) % 1400) + 20;
        const cy = ((i * 331) % 820) + 60;
        const r = 8 + ((i * 53) % 22);
        const opacity = 0.18 + (cy / 900) * 0.38;

        if (i % 3 === 0) return <circle key={i} cx={cx} cy={cy} r={r} opacity={opacity} />;
        if (i % 3 === 1)
          return (
            <rect
              key={i} x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.3}
              opacity={opacity} transform={`rotate(${(i * 37) % 90} ${cx} ${cy})`}
            />
          );
        return (
          <path
            key={i} d={`M${cx - r * 1.6} ${cy} h ${r * 3.2}`}
            fill="none" strokeWidth={r * 0.7} opacity={opacity}
          />
        );
      })}
    </g>
  );
}
