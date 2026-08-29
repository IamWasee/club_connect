"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BuildingsIcon,
  CalendarBlankIcon,
  CaretUpDownIcon,
  ChatCircleTextIcon,
  IdentificationBadgeIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import { Avatar } from "@/components/Avatar";
import { AccountFields, EMPTY_ACCOUNT, isValidAccount } from "@/components/AccountFields";
import type { AccountDraft } from "@/components/AccountFields";
import { ClubMark } from "@/components/ClubArt";
import { ConfirmDialog, DeleteAccountDialog } from "@/components/Dialogs";
import { Overlay } from "@/components/Motion";
import { Button, Card } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { ROLE_LABELS, canSeeDirectory, pendingInvites } from "@/demo/selectors";
import { avatarFor } from "@/demo/initial";
import type { User } from "@/demo/types";

/**
 * The right rail.
 *
 * Navigation lives in the margin rather than across the top: a top bar spends
 * the most valuable strip of the page on five links and an avatar, and it made
 * the app read like a school portal. It floats as a rounded card rather than a
 * full-height panel, so the page reads as one surface with the nav resting on
 * it instead of two columns bolted together.
 *
 * Vertically centred on the viewport, so it sits at thumb/eye level rather
 * than anchored to a corner.
 *
 * Desktop only. Below `md` the bottom tab bar takes over.
 */
const NAV = [
  { href: "/", label: "Forum", Icon: ChatCircleTextIcon },
  { href: "/events", label: "Events", Icon: CalendarBlankIcon },
  { href: "/clubs", label: "Clubs", Icon: BuildingsIcon },
  { href: "/council", label: "Council", Icon: UsersThreeIcon },
] as const;

export function Sidebar() {
  const { state, me } = useDemo();
  const pathname = usePathname();
  const invites = pendingInvites(state, me.id).length;

  const items = canSeeDirectory(state, me)
    ? [...NAV, { href: "/directory", label: "Students", Icon: IdentificationBadgeIcon }]
    : NAV;

  return (
    <aside className="fixed right-4 top-1/2 z-30 hidden max-h-[calc(100dvh-2rem)] w-60 -translate-y-1/2 flex-col overflow-y-auto overscroll-contain rounded-3xl border border-line bg-surface/80 p-3 shadow-[0_1px_2px_rgba(20,40,30,0.04),0_18px_44px_-24px_rgba(20,40,30,0.30)] backdrop-blur-md md:flex lg:w-64">
      <Link
        href="/profile"
        className={`mb-4 flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-brand-soft ${
          pathname === "/profile" ? "bg-brand-soft" : ""
        }`}
      >
        <span className="relative">
          <Avatar identity={me} size="md" />
          {invites > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-on-brand">
              {invites}
            </span>
          ) : null}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{me.displayName}</span>
          <span className="block truncate text-[11px] text-subtle">{ROLE_LABELS[me.role]}</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex-1">
        <ul className="space-y-0.5">
          {items.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-ink text-paper" : "text-subtle hover:bg-brand-soft hover:text-ink"
                  }`}
                >
                  <Icon size={20} weight={active ? "fill" : "regular"} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {state.clubs.length > 0 ? (
          <>
            <p className="mb-2 mt-6 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-subtle">
              Your school
            </p>
            <ul className="space-y-0.5">
              {state.clubs.map((club) => (
                <li key={club.id}>
                  <Link
                    href={`/clubs/${club.slug}`}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                      pathname === `/clubs/${club.slug}`
                        ? "bg-brand-soft text-ink"
                        : "text-subtle hover:bg-brand-soft hover:text-ink"
                    }`}
                  >
                    <ClubMark club={club} size="sm" />
                    <span className="min-w-0 flex-1 truncate">{club.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </nav>

      <AccountSwitcher />
    </aside>
  );
}

/**
 * Stands in for logging in as different people. Auth comes later; for a demo,
 * being able to add accounts and jump between them is the whole point, since it
 * is how the permission rules get shown at all.
 */
export function AccountSwitcher({ compact = false }: { compact?: boolean }) {
  const { state, me } = useDemo();
  const { switchUser, reset } = useActions();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  return (
    <div className={compact ? "" : "mt-4 border-t border-line pt-3"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-subtle transition-colors hover:bg-brand-soft hover:text-ink"
      >
        <CaretUpDownIcon size={14} aria-hidden="true" />
        Viewing as <span className="truncate text-ink">{me.displayName.split(" ")[0]}</span>
      </button>

      {open ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-line bg-surface">
          <ul className="max-h-56 overflow-y-auto py-1">
            {state.users.map((user) => (
              <li key={user.id} className="flex items-center">
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
                    className="mr-2 shrink-0 rounded-full px-2 py-1 text-[11px] text-subtle transition-colors hover:bg-down-soft hover:text-down"
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
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
            >
              + Add an account
            </button>
            <button
              type="button"
              onClick={() => {
                setResetting(true);
                setOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-xs text-subtle transition-colors hover:bg-down-soft hover:text-down"
            >
              Start over - erase everything
            </button>
          </div>
        </div>
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
    <Overlay open onClose={onClose} labelledBy="add-account-heading">
      <Card className="relative max-h-[82vh] w-full overflow-y-auto overscroll-contain">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <h2 id="add-account-heading" className="font-display text-2xl">
              Add an account
            </h2>
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
    </Overlay>
  );
}

/** Connection state, shown inline at the top of the content column. */
export function StatusBanners() {
  const { mode, error, dismissError } = useDemo();

  if (mode === "backend" && !error) return null;

  return (
    <div className="mb-6 space-y-2">
      {mode === "local" ? (
        <p className="rounded-[10px] border border-line bg-brand-soft/60 px-4 py-2 text-center text-[11px] text-subtle">
          On this browser only. Add your Supabase keys to share across devices.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="flex items-center justify-center gap-3 rounded-[10px] border border-down/30 bg-down-soft px-4 py-2 text-center text-[11px] text-ink"
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
    </div>
  );
}
