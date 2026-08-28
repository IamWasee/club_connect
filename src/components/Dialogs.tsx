"use client";

import { useEffect, useId, useState } from "react";

import { Overlay } from "@/components/Motion";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Button, Field, TextArea, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { councilSeat } from "@/demo/selectors";
import { BIO_MAX, CONTRIBUTION_MAX } from "@/demo/types";
import type { User } from "@/demo/types";

/**
 * In-app dialogs, replacing `window.confirm`.
 *
 * The native prompt cannot be styled, blocks the whole page, says "localhost
 * says", and gives no room to explain what is about to be lost. For a
 * destructive action all of that matters.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  /** When set, the confirm button stays disabled until this is typed exactly. */
  typeToConfirm,
  destructive = true,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  typeToConfirm?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const headingId = useId();
  const [typed, setTyped] = useState("");

  // Reset the gate each time it opens, so a previous attempt cannot carry over.
  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ready = !typeToConfirm || typed.trim() === typeToConfirm;

  return (
    <Overlay open={open} onClose={onClose} labelledBy={headingId}>
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <h2 id={headingId} className="text-balance font-display text-2xl">
          {title}
        </h2>

        <div className="mt-3 text-sm leading-relaxed text-subtle">{body}</div>

        {typeToConfirm ? (
          <div className="mt-5">
            <Field
              label={`Type ${typeToConfirm} to confirm`}
              hint="This cannot be undone."
            >
              <TextInput
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={typeToConfirm}
              />
            </Field>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            disabled={!ready}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

/**
 * Self-service portfolio editing. Reached from the council page by the person
 * whose card it is, and from their own profile page.
 */
export function ProfileDialog({
  open,
  person,
  onClose,
}: {
  open: boolean;
  person: User;
  onClose: () => void;
}) {
  const headingId = useId();
  const { updateProfile } = useActions();
  const { state } = useDemo();
  const [draft, setDraft] = useState(person);

  // "What I do" only applies to a plain council member; the two officers have
  // titles that already describe the job.
  const showContribution = councilSeat(state, person.id) === "member";

  useEffect(() => {
    if (open) setDraft(person);
  }, [open, person]);

  function save() {
    updateProfile({
      displayName: draft.displayName.trim() || person.displayName,
      pfpUrl: draft.pfpUrl,
      bio: draft.bio?.slice(0, BIO_MAX),
      instagram: draft.instagram?.trim().replace(/^@/, ""),
      facebook: draft.facebook?.trim().replace(/^@/, ""),
      publicEmail: draft.publicEmail?.trim(),
      contribution: draft.contribution?.slice(0, CONTRIBUTION_MAX),
    });
    onClose();
  }

  const bio = draft.bio ?? "";

  return (
    <Overlay open={open} onClose={onClose} labelledBy={headingId}>
      <div className="max-h-[80vh] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-6 shadow-xl">
        <h2 id={headingId} className="font-display text-2xl">
          Your card
        </h2>
        <p className="mt-1 text-sm text-subtle">
          This is what everyone sees on the council page and on club rosters.
        </p>

        <div className="mt-6 space-y-5">
          <PhotoUpload
            name={draft.displayName}
            value={draft.pfpUrl}
            onChange={(pfpUrl) => setDraft({ ...draft, pfpUrl })}
          />

          <Field label="Display name">
            <TextInput
              value={draft.displayName}
              maxLength={32}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
            />
          </Field>

          <Field label="Description" hint={`${bio.length}/${BIO_MAX} characters.`}>
            <TextArea
              rows={3}
              value={bio}
              maxLength={BIO_MAX}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              placeholder="Senior. Runs the club fair and the clubs budget."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instagram" hint="Handle only, no @.">
              <TextInput
                value={draft.instagram ?? ""}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
                placeholder="oras.oreos"
              />
            </Field>
            <Field label="Facebook" hint="Handle only.">
              <TextInput
                value={draft.facebook ?? ""}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setDraft({ ...draft, facebook: e.target.value })}
                placeholder="rashmin.school"
              />
            </Field>
          </div>

          <Field
            label="Contact email"
            hint="Shown on your card. Not the address you signed in with."
          >
            <TextInput
              type="email"
              value={draft.publicEmail ?? ""}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setDraft({ ...draft, publicEmail: e.target.value })}
              placeholder="council.events@northside.edu"
            />
          </Field>

          {showContribution ? (
            <Field
              label="What I do"
              hint={`${(draft.contribution ?? "").length}/${CONTRIBUTION_MAX} characters. Shown on your council card.`}
            >
              <TextInput
                value={draft.contribution ?? ""}
                maxLength={CONTRIBUTION_MAX}
                onChange={(e) => setDraft({ ...draft, contribution: e.target.value })}
                placeholder="Runs the suggestion box and spirit week"
              />
            </Field>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Save card
          </Button>
        </div>
      </div>
    </Overlay>
  );
}

/** Admin-facing account removal, with a typed confirmation. */
export function DeleteAccountDialog({
  open,
  person,
  onClose,
}: {
  open: boolean;
  person: User;
  onClose: () => void;
}) {
  const { state } = useDemo();
  const { deleteAccount } = useActions();

  const posts = state.posts.filter((p) => p.authorId === person.id).length;
  const events = state.events.filter((e) => e.createdBy === person.id).length;
  const clubs = state.clubs.filter(
    (c) => c.presidentId === person.id || c.vpId === person.id,
  ).length;
  const isLast = state.users.length <= 1;

  return (
    <ConfirmDialog
      open={open}
      title={`Delete ${person.displayName}?`}
      confirmLabel="Delete account"
      typeToConfirm={isLast ? undefined : person.displayName}
      onConfirm={() => deleteAccount(person.id)}
      onClose={onClose}
      body={
        isLast ? (
          <p>
            This is the only account left. Add another one first, otherwise
            there would be nobody to sign in as.
          </p>
        ) : (
          <>
            <p>This also removes everything attributed to them:</p>
            <ul className="mt-3 space-y-1">
              <li>
                <span className="tabular-nums text-ink">{posts}</span> post
                {posts === 1 ? "" : "s"}, and every reaction on them
              </li>
              <li>
                <span className="tabular-nums text-ink">{events}</span> event
                {events === 1 ? "" : "s"} they organized, and the signups
              </li>
              <li>Their place on every club roster and the council</li>
            </ul>
            {clubs > 0 ? (
              <p className="mt-3">
                <span className="tabular-nums text-ink">{clubs}</span> club
                {clubs === 1 ? "" : "s"} they run will stay, with the seat left
                vacant.
              </p>
            ) : null}
          </>
        )
      }
    />
  );
}
