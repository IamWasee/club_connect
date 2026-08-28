"use client";

import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Button, Card, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { findByEmail, membership } from "@/demo/selectors";
import type { Club } from "@/demo/types";

type Result =
  | { kind: "idle" }
  | { kind: "none" }
  | { kind: "found"; userId: string }
  | { kind: "already"; userId: string; status: "invited" | "accepted" };

/**
 * The only place a real email is ever used. Search is exact-match and returns
 * display identity only — no partial matching, no list, no echoing the email
 * back. That is what stops it becoming a browsable student directory.
 */
export function InviteTool({ club }: { club: Club }) {
  const { state } = useDemo();
  const { inviteToClub } = useActions();

  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });

  function search(e: React.FormEvent) {
    e.preventDefault();
    const found = findByEmail(state, email);
    if (!found) return setResult({ kind: "none" });

    const existing = membership(state, club.id, found.id);
    setResult(
      existing
        ? { kind: "already", userId: found.id, status: existing.status }
        : { kind: "found", userId: found.id },
    );
  }

  const person =
    result.kind === "found" || result.kind === "already"
      ? state.users.find((u) => u.id === result.userId)
      : null;

  return (
    <Card>
      <p className="text-sm font-semibold">Invite a member</p>
      <p className="mt-1 text-xs leading-relaxed text-subtle">
        Type a student&apos;s full school email. You&apos;ll only ever see their
        display name and picture back - never their real name, and there is no
        list to browse.
      </p>

      <form onSubmit={search} className="mt-4 flex gap-2">
        <TextInput
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setResult({ kind: "idle" });
          }}
          placeholder="firstname.lastname@northside.edu"
        />
        <Button type="submit" disabled={!email.trim()}>
          Search
        </Button>
      </form>

      {result.kind === "none" ? (
        <p className="mt-3 text-sm text-subtle">
          No account with that exact email. Check the spelling - partial matches
          don&apos;t work on purpose.
        </p>
      ) : null}

      {person ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
          <Avatar identity={person} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {person.displayName}
          </span>

          {result.kind === "already" ? (
            <span className="text-xs text-subtle">
              {result.status === "accepted" ? "Already a member" : "Invite pending"}
            </span>
          ) : (
            <Button
              onClick={() => {
                inviteToClub(club.id, person.id);
                setResult({ kind: "already", userId: person.id, status: "invited" });
                setEmail("");
              }}
            >
              Send invite
            </Button>
          )}
        </div>
      ) : null}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-subtle">
          Demo emails you can try
        </summary>
        <ul className="mt-2 space-y-1 text-xs text-subtle">
          {state.users.slice(0, 6).map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => {
                  setEmail(user.email);
                  setResult({ kind: "idle" });
                }}
                className="font-mono hover:text-ink hover:underline"
              >
                {user.email}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
