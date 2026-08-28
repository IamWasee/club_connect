"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { ClubMark } from "@/components/ClubArt";
import { Sparkle } from "@/components/Poster";
import { AccountFields, EMPTY_ACCOUNT, isValidAccount } from "@/components/AccountFields";
import type { AccountDraft } from "@/components/AccountFields";
import { Button, Card } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { ROLE_LABELS, canSeeDirectory, pendingInvites } from "@/demo/selectors";
import { avatarFor } from "@/demo/initial";
import { ConfirmDialog, DeleteAccountDialog } from "@/components/Dialogs";
import type { User } from "@/demo/types";

const NAV = [
  { href: "/", label: "Forum" },
  { href: "/events", label: "Events" },
  { href: "/council", label: "Council" },
];

export function Header() {
  const { state, me, mode, error, dismissError } = useDemo();
  const pathname = usePathname();
  const invites = pendingInvites(state, me.id).length;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Sparkle size={15} className="text-brand" />
          <span className="font-display text-lg tracking-[-0.03em]">ClubConnect</span>
        </Link>

        {/* Below md this is replaced by BottomNav; a squeezed strip of five
            links in ~46px is unusable. */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.slice(0, 2).map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
          <ClubsMenu />
          {NAV.slice(2).map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} />
          ))}
          {/* Only shown to accounts that can actually invite someone. */}
          {canSeeDirectory(state, me) ? (
            <NavLink href="/directory" label="Students" pathname={pathname} />
          ) : null}
        </nav>

        <span className="flex-1 md:hidden" />

        <Link
          href="/profile"
          className="relative shrink-0 rounded-full p-1 transition hover:bg-brand-soft"
          title="Your profile"
        >
          <Avatar identity={me} size="sm" />
          {invites > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-on-brand">
              {invites}
            </span>
          ) : null}
        </Link>

        <AccountMenu />
      </div>

      {/* Local mode is easy to mistake for the real thing until two people
          compare screens, so it says so. */}
      {mode === "local" ? (
        <p className="border-t border-line bg-brand-soft/60 px-4 py-1.5 text-center text-[11px] text-subtle">
          On this browser only. Add your Supabase keys to share across devices.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-center justify-center gap-3 border-t border-down/30 bg-down-soft px-4 py-1.5 text-center text-[11px] text-ink"
        >
          <span>Backend problem: {error}</span>
          <button
            type="button"
            onClick={dismissError}
            className="rounded-full px-2 py-0.5 font-medium underline underline-offset-2"
          >
            Dismiss
          </button>
        </p>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-ink text-paper" : "text-subtle hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

/**
 * Clubs is a menu rather than a link: the club list is the useful part.
 *
 * The panel is positioned `fixed` rather than absolutely inside the nav. The
 * nav scrolls horizontally on narrow screens, and `overflow-x: auto` forces
 * `overflow-y` to `auto` as well — an absolutely positioned panel gets clipped
 * to the 32px-tall nav and becomes invisible and unclickable.
 */
function ClubsMenu() {
  const { state, me } = useDemo();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  const buttonRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = pathname.startsWith("/clubs");
  const mayCreate = me.role === "admin" || me.role === "council";

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 240;
    setAnchor({
      top: rect.bottom + 8,
      // Keep the panel on screen when the button sits near the right edge.
      left: Math.min(rect.left, Math.max(8, window.innerWidth - width - 8)),
    });
  }, []);

  // Hover opens it, but leaving needs a beat of grace so the pointer can travel
  // from the button down to the panel without it snapping shut.
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openNow = () => {
    cancelClose();
    place();
    setOpen(true);
  };
  const closeSoon = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  };

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;

    // A click anywhere else closes it. A backdrop element would do this too,
    // but it would sit between the pointer and the page and kill the hover.
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    // The header is sticky, so the button moves under the page scroll.
    window.addEventListener("scroll", place, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return (
    <div className="shrink-0" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      {/* The trigger is a link, not a toggle. Hover (or keyboard focus) opens
          the panel; clicking goes to the clubs index - so on a touch screen,
          where there is no hover, the tap still lands somewhere useful instead
          of doing nothing. */}
      <Link
        ref={buttonRef}
        href="/clubs"
        onClick={() => setOpen(false)}
        onFocus={openNow}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
          active ? "bg-ink text-paper" : "text-subtle hover:text-ink"
        }`}
      >
        Clubs
        <span aria-hidden="true" className="text-[10px]">
          ▾
        </span>
      </Link>

      {open && anchor ? (
        <div
          ref={panelRef}
          role="menu"
          onMouseEnter={cancelClose}
          onMouseLeave={closeSoon}
          style={{ top: anchor.top, left: anchor.left, width: 240 }}
          className="fixed z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        >
          <ul className="max-h-80 overflow-y-auto py-1">
            {state.clubs.length === 0 ? (
              <li className="px-3 py-3 text-sm text-subtle">No clubs yet.</li>
            ) : (
              state.clubs.map((club) => (
                <li key={club.id}>
                  <Link
                    href={`/clubs/${club.slug}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 transition hover:bg-brand-soft ${
                      pathname === `/clubs/${club.slug}` ? "bg-brand-soft" : ""
                    }`}
                  >
                    <ClubMark club={club} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm">{club.name}</span>
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: club.themeColor }}
                    />
                  </Link>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-line p-2">
            <Link
              href="/clubs"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-xs font-medium text-brand transition hover:bg-brand-soft"
            >
              Browse all clubs{mayCreate ? " · add one" : ""}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Stands in for logging in as different people. Auth comes later; for a demo,
 * being able to add accounts and jump between them is the whole point — it is
 * how the permission rules get shown at all.
 */
function AccountMenu() {
  const { state, me } = useDemo();
  const { switchUser, reset } = useActions();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-subtle transition-colors hover:border-ink hover:text-ink"
      >
        <span className="hidden sm:inline">Viewing as</span>
        <span className="max-w-24 truncate text-ink">{me.displayName.split(" ")[0]}</span>
        <span aria-hidden="true" className="text-[10px]">
          ▾
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            <p className="border-b border-line px-3 py-2 text-xs font-semibold text-subtle">
              Demo - switch account
            </p>
            <ul className="max-h-72 overflow-y-auto py-1">
              {state.users.map((user) => (
                <li key={user.id} className="group/row flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      switchUser(user.id);
                      setOpen(false);
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-brand-soft ${
                      user.id === me.id ? "bg-brand-soft" : ""
                    }`}
                  >
                    <Avatar identity={user} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{user.displayName}</span>
                      <span className="block truncate text-[11px] text-subtle">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </span>
                  </button>
                  {state.users.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Delete ${user.displayName}`}
                      onClick={() => {
                        setDeleting(user);
                        setOpen(false);
                      }}
                      className="mr-1 rounded-full px-2 py-1 text-[11px] text-subtle opacity-0 transition-opacity hover:bg-down-soft hover:text-down focus-visible:opacity-100 group-hover/row:opacity-100"
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="border-t border-line p-2">
              <button
                type="button"
                onClick={() => {
                  setAdding(true);
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-brand transition hover:bg-brand-soft"
              >
                + Add an account
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetting(true);
                  setOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-subtle transition hover:bg-down-soft hover:text-down"
              >
                Start over - erase everything
              </button>
            </div>
          </div>
        </>
      ) : null}

      {adding ? <AddAccountDialog onClose={() => setAdding(false)} /> : null}

      {deleting ? (
        <DeleteAccountDialog open person={deleting} onClose={() => setDeleting(null)} />
      ) : null}

      <ConfirmDialog
        open={resetting}
        title="Start over?"
        body="Every account, post, event, club roster and council seat goes. The six clubs come back empty, and you are returned to the first-run screen."
        confirmLabel="Erase everything"
        typeToConfirm="ERASE"
        onConfirm={reset}
        onClose={() => setResetting(false)}
      />
    </div>
  );
}

function AddAccountDialog({ onClose }: { onClose: () => void }) {
  const { createAccount } = useActions();
  const [draft, setDraft] = useState<AccountDraft>(EMPTY_ACCOUNT);
  const [signIn, setSignIn] = useState(true);

  const ready = isValidAccount(draft);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    createAccount(
      {
        ...draft,
        displayName: draft.displayName.trim(),
        email: draft.email.trim().toLowerCase(),
        pfpUrl: draft.pfpUrl ?? avatarFor(draft.displayName.trim(), 200),
      },
      signIn,
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/40 p-4 py-10">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default" />
      <Card className="relative w-full max-w-md">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Add an account</h2>
            <p className="mt-1 text-xs text-subtle">
              Stands in for a student signing in with their school Google account.
            </p>
          </div>

          <AccountFields draft={draft} onChange={setDraft} />

          <label className="flex items-center gap-2 text-sm text-subtle">
            <input
              type="checkbox"
              checked={signIn}
              onChange={(e) => setSignIn(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-brand)]"
            />
            Switch to this account now
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready}>
              Add account
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
