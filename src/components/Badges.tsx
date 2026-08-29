"use client";

import { ClubMark } from "@/components/ClubArt";
import { useDemo } from "@/demo/store";
import { clubBadges, councilSeat } from "@/demo/selectors";
import type { CouncilSeat } from "@/demo/types";

/**
 * Who someone is, at a glance, in a list of names.
 *
 * Two separate things, deliberately drawn differently so they are never
 * confused: a medal for the seat they hold on the student council, and one
 * chip per club they are actually in. Both carry a `title`, and the medal
 * carries real text for a screen reader — colour alone must not be the only
 * thing that says president.
 */
const STAR_TIERS: Record<CouncilSeat, { label: string; ink: string; ring: string }> = {
  president: { label: "Council President", ink: "#c8992a", ring: "#8a6612" },
  "vice-president": { label: "Council Vice President", ink: "#9ba3ac", ring: "#6d747c" },
  member: { label: "Council Member", ink: "#a9713c", ring: "#7a4e26" },
};

const STAR =
  "M12 2.6 L14.7 8.9 L21.4 9.5 L16.3 14 L17.8 20.6 L12 17.1 L6.2 20.6 L7.7 14 L2.6 9.5 L9.3 8.9 Z";

export function CouncilStar({ seat, size = 18 }: { seat: CouncilSeat; size?: number }) {
  const tier = STAR_TIERS[seat];

  return (
    <span
      title={tier.label}
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: tier.ink,
        boxShadow: `inset 0 0 0 1px ${tier.ring}`,
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size * 0.64, height: size * 0.64 }}>
        <path d={STAR} fill="#fff" fillOpacity="0.92" />
      </svg>
      <span className="sr-only">{tier.label}</span>
    </span>
  );
}

/**
 * The clubs a person belongs to. Officers' chips are ringed, so a roster of
 * chips still says who runs what without a second row of text.
 */
export function ClubBadges({ userId, limit = 6 }: { userId: string; limit?: number }) {
  const { state } = useDemo();
  const badges = clubBadges(state, userId);

  if (badges.length === 0) return null;

  const shown = badges.slice(0, limit);
  const rest = badges.length - shown.length;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map(({ club, seat }) => (
        <span
          key={club.id}
          title={`${seat} — ${club.name}`}
          className={`inline-flex rounded-[7px] ${
            seat === "Member" ? "" : "ring-1 ring-ink/40 ring-offset-1 ring-offset-[var(--color-surface)]"
          }`}
        >
          <ClubMark club={club} size="sm" />
          <span className="sr-only">
            {seat} of {club.name}
          </span>
        </span>
      ))}
      {rest > 0 ? <span className="text-[10px] tabular-nums text-subtle">+{rest}</span> : null}
    </span>
  );
}

/** Medal + club chips on one line, which is how the directory shows a person. */
export function PersonBadges({ userId }: { userId: string }) {
  const { state } = useDemo();
  const seat = councilSeat(state, userId);
  const clubs = clubBadges(state, userId);

  if (!seat && clubs.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {seat ? <CouncilStar seat={seat} /> : null}
      <ClubBadges userId={userId} />
    </span>
  );
}
