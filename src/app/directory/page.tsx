"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Avatar } from "@/components/Avatar";
import { PersonBadges } from "@/components/Badges";
import { ClubMark } from "@/components/ClubArt";
import { Card, EmptyState, PageHead, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import {
  ROLE_LABELS,
  canSeeDirectory,
  clubsICanInviteTo,
  directoryByLetter,
  membership,
} from "@/demo/selectors";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { Club, User } from "@/demo/types";

/**
 * The student directory.
 *
 * This is the one screen in the app that lists people. It is restricted to the
 * accounts that actually need to invite someone: admin, the council president
 * and vice-president, and each club's own president and VP. A student opening
 * this URL directly is told no rather than shown a list.
 */
export default function DirectoryPage() {
  const { state, me } = useDemo();
  const [query, setQuery] = useState("");

  const invitable = clubsICanInviteTo(state, me);

  const groups = useMemo(() => {
    const all = directoryByLetter(state);
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all
      .map((group) => ({
        ...group,
        people: group.people.filter((p) => p.displayName.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.people.length > 0);
  }, [state, query]);

  if (!canSeeDirectory(state, me)) {
    return (
      <>
        <PageHead label="Restricted" title="Student directory" />
        <EmptyState>
          This list is only open to admin, the council president and vice
          president, and club presidents and VPs.{" "}
          <Link href="/" className="text-brand underline underline-offset-4">
            Back to the forum
          </Link>
        </EmptyState>
      </>
    );
  }

  const total = groups.reduce((sum, group) => sum + group.people.length, 0);

  return (
    <>
      <PageHead
        label={
          invitable.length === 0
            ? "Read only"
            : invitable.length === state.clubs.length
              ? "Every club"
              : "Your clubs"
        }
        title="Student directory"
        lede={
          invitable.length === 0
            ? "Everyone at the school, A to Z, with the clubs they are in and the council seat they hold. Inviting is for club officers and the council's president and vice president."
            : invitable.length === 1
              ? `Everyone at the school, A to Z. Invite any of them to ${invitable[0].name}.`
              : "Everyone at the school, A to Z. Pick a name to invite them to a club."
        }
      />

      <div className="mb-6 max-w-sm">
        <TextInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by display name…"
          aria-label="Filter the directory by display name"
        />
      </div>

      {total === 0 ? (
        <EmptyState>
          {query
            ? `Nobody matches “${query.trim()}”.`
            : "No accounts yet. Add some from the Viewing as menu."}
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.letter}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-display text-2xl text-subtle">{group.letter}</h2>
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs tabular-nums text-subtle">{group.people.length}</span>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2">
                {group.people.map((person) => (
                  <li key={person.id}>
                    <PersonRow person={person} clubs={invitable} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * A row that reveals its invite options on hover, and opens them on click so
 * the same actions are reachable from a keyboard and a touch screen.
 */
function PersonRow({ person, clubs }: { person: User; clubs: Club[] }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useClickOutside(panel, () => setOpen(false));

  const body = (
    <>
      <Avatar identity={person} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{person.displayName}</span>
        <span className="block truncate text-[11px] text-subtle">
          {ROLE_LABELS[person.role]}
        </span>
      </span>
      {/* Council medal and club chips. Kept out of the truncating column so a
          long name shortens rather than pushing the badges off the row. */}
      <PersonBadges userId={person.id} />
    </>
  );

  // Nothing to invite into means nothing to click. Rendering a dead button
  // that opens an empty menu would be worse than rendering plain text.
  if (clubs.length === 0) {
    return (
      <div className="flex w-full items-center gap-3 rounded-[10px] border border-line bg-surface/60 px-3 py-2.5">
        {body}
      </div>
    );
  }

  return (
    <div ref={panel} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        aria-label={`Invite ${person.displayName} to a club`}
        className={`flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors ${
          open ? "border-ink bg-surface" : "border-line bg-surface/60 hover:border-ink"
        }`}
      >
        {body}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[10px] border border-ink bg-surface shadow-lg"
          >
            <ul className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {clubs.map((club) => (
                <li key={club.id}>
                  <InviteRow club={club} person={person} />
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function InviteRow({ club, person }: { club: Club; person: User }) {
  const { state } = useDemo();
  const { inviteToClub } = useActions();
  const existing = membership(state, club.id, person.id);

  if (existing) {
    return (
      <span className="flex items-center gap-2.5 px-3 py-2 text-xs text-subtle">
        <ClubMark club={club} size="sm" />
        <span className="min-w-0 flex-1 truncate">{club.name}</span>
        <span>{existing.status === "accepted" ? "Member" : "Invited"}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inviteToClub(club.id, person.id)}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-brand-soft"
    >
      <ClubMark club={club} size="sm" />
      <span className="min-w-0 flex-1 truncate font-medium">Invite to {club.name}</span>
    </button>
  );
}
