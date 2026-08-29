"use client";

import { ClubMark } from "@/components/ClubArt";
import type { Club, User } from "@/demo/types";

/**
 * A club's header.
 *
 * The old one was a colour banner with the name knocked out over the bottom of
 * it, which is the Google Classroom card and nothing else — the picture did no
 * work, and the same layout served every club. This is a masthead instead: a
 * rule, a kicker, the name set as large as it will go, and the club's numbers
 * on a hairline rail underneath. The picture now lives behind the whole page
 * (see `ClubBackdrop`), which is where a club's artwork can actually be big.
 */
export function ClubMasthead({
  club,
  president,
  memberCount,
  officerCount,
  postCount,
  action,
}: {
  club: Club;
  president: User | null;
  memberCount: number;
  officerCount: number;
  postCount: number;
  action?: React.ReactNode;
}) {
  const stats: Array<[label: string, value: string]> = [
    ["Members", String(memberCount)],
    ["Officers", String(officerCount)],
    ["Posts", String(postCount)],
  ];

  return (
    <header>
      <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
        <span aria-hidden="true" className="h-px w-8" style={{ background: club.themeColor }} />
        Club
        <span aria-hidden="true" className="text-subtle/50">
          /
        </span>
        <span className="truncate" style={{ color: club.themeColor }}>
          {president ? `Led by ${president.displayName}` : "Seat vacant"}
        </span>
      </p>

      <div className="mt-5 flex items-start gap-4 sm:gap-5">
        <ClubMark club={club} size="xl" />
        {/* Not animated, for the same reason the other page headings are not:
            an entrance that stalls leaves the page's own name unreadable. */}
        <h1 className="text-balance font-display text-[2.5rem] leading-[0.9] sm:text-6xl">
          {club.name}
        </h1>
      </div>

      {club.description ? (
        <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-subtle">
          {club.description}
        </p>
      ) : null}

      <div className="mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-y border-line py-4">
        <dl className="flex flex-wrap items-baseline gap-x-9 gap-y-3">
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-subtle">
                {label}
              </dt>
              <dd className="mt-1.5 font-display text-2xl leading-none">{value}</dd>
            </div>
          ))}
        </dl>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}

/**
 * Section switcher. A segmented control rather than the underlined tab strip
 * every school portal ships with; the active segment carries the club colour,
 * which is the one place the colour is allowed to be solid.
 */
export function ClubTabs<T extends string>({
  tabs,
  active,
  accent,
  onSelect,
}: {
  tabs: ReadonlyArray<{ id: T; label: string; count?: number }>;
  active: T;
  accent: string;
  onSelect: (id: T) => void;
}) {
  return (
    <nav
      aria-label="Sections"
      className="mt-7 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface/70 p-1 backdrop-blur-[2px]"
    >
      {tabs.map(({ id, label, count }) => {
        const selected = id === active;
        return (
          <button
            key={id}
            type="button"
            aria-current={selected ? "page" : undefined}
            onClick={() => onSelect(id)}
            style={selected ? { background: accent, color: "#fff" } : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected ? "" : "text-subtle hover:bg-brand-soft hover:text-ink"
            }`}
          >
            {label}
            {count !== undefined ? (
              <span className={`text-xs tabular-nums ${selected ? "opacity-70" : "opacity-60"}`}>
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
