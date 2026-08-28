"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Button, Card, EmptyState, Field, PageHead, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { userById } from "@/demo/selectors";
import { PersonCard } from "@/components/PersonCard";
import { ConfirmDialog, ProfileDialog } from "@/components/Dialogs";
import type { CouncilSeat, User } from "@/demo/types";

const SEAT_LABELS: Record<CouncilSeat, string> = {
  president: "President",
  "vice-president": "Vice President",
  member: "Member",
};

const BIO_MAX = 100;

export default function CouncilPage() {
  const { state, me } = useDemo();
  const { removeCouncilMember } = useActions();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState<User | null>(null);

  const mayManage = me.role === "admin";
  // President, then VP, then everyone else in the order they were appointed.
  const rank: Record<CouncilSeat, number> = { president: 0, "vice-president": 1, member: 2 };
  const ordered = [...state.council].sort((a, b) => rank[a.role] - rank[b.role]);
  const onCouncil = state.council.some((c) => c.userId === me.id);

  return (
    <>
      <PageHead
        label="Elected"
        title="Student Council"
        lede="Council announcements go to the main feed."
        action={
          mayManage && !adding ? (
            <Button onClick={() => setAdding(true)}>Add member</Button>
          ) : null
        }
      />

      {mayManage && adding ? <AddCouncilForm onDone={() => setAdding(false)} /> : null}

      {onCouncil ? (
        <p className="mb-6 rounded-[10px] border border-line bg-surface/60 px-4 py-3 text-sm text-subtle">
          You are on the council. Use{" "}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-medium text-ink underline underline-offset-4"
          >
            Edit your card
          </button>{" "}
          to change your photo, description and links.
        </p>
      ) : null}

      {state.council.length === 0 ? (
        <EmptyState>
          No council yet.
          {mayManage
            ? " Add a president and members - they'll be the ones who can post announcements."
            : " An admin appoints the council."}
        </EmptyState>
      ) : null}

      {state.council.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((entry) => {
            const person = userById(state, entry.userId);
            if (!person) return null;
            return (
              <PersonCard
                key={entry.userId}
                person={person}
                seat={SEAT_LABELS[entry.role]}
                onEdit={person.id === me.id ? () => setEditing(true) : undefined}
                onRemove={mayManage ? () => setRemoving(person) : undefined}
              />
            );
          })}
        </div>
      ) : null}

      {state.council.length > 0 ? (
        <p className="mt-8 text-center text-sm text-subtle">
          Council announcements appear on the{" "}
          <Link href="/" className="text-brand underline underline-offset-4">
            main forum
          </Link>
          .
        </p>
      ) : null}

      <ProfileDialog open={editing} person={me} onClose={() => setEditing(false)} />

      {removing ? (
        <ConfirmDialog
          open
          title={`Remove ${removing.displayName} from the council?`}
          body="They keep their account. They lose the council role, so they stop being able to post announcements or create events."
          confirmLabel="Remove from council"
          onConfirm={() => removeCouncilMember(removing.id)}
          onClose={() => setRemoving(null)}
        />
      ) : null}
    </>
  );
}

/** Admin only — appointing someone is also what grants the council role. */
function AddCouncilForm({ onDone }: { onDone: () => void }) {
  const { state } = useDemo();
  const { addCouncilMember } = useActions();

  const available = state.users.filter((u) => !state.council.some((c) => c.userId === u.id));
  const [userId, setUserId] = useState(available[0]?.id ?? "");
  const [role, setRole] = useState<CouncilSeat>(
    state.council.some((c) => c.role === "president") ? "member" : "president",
  );
  const [bio, setBio] = useState("");

  if (available.length === 0) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-subtle">
          Everyone already has a council seat. Add another account first.
        </p>
        <Button variant="ghost" className="mt-3" onClick={onDone}>
          Close
        </Button>
      </Card>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    addCouncilMember(userId, role, bio.trim());
    onDone();
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Account">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {available.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Seat" hint="One president at a time; the previous one becomes a member.">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CouncilSeat)}
              className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="president">President</option>
              <option value="member">Member</option>
            </select>
          </Field>
        </div>

        <Field label="Bio" hint={`${bio.length}/${BIO_MAX} characters.`}>
          <TextInput
            value={bio}
            maxLength={BIO_MAX}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Senior. Runs the club fair and the clubs budget."
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit">Add to council</Button>
        </div>
      </form>
    </Card>
  );
}
