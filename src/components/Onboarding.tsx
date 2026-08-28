"use client";

import { useState } from "react";

import { AccountFields, EMPTY_ACCOUNT, isValidAccount } from "@/components/AccountFields";
import type { AccountDraft } from "@/components/AccountFields";
import { Button, Card } from "@/components/ui";
import { avatarFor } from "@/demo/initial";
import { addAccount } from "@/demo/store";
import type { DemoState } from "@/demo/types";

/**
 * Shown when there are no accounts at all — which is how the app starts. The
 * first account defaults to Admin because otherwise there would be nobody able
 * to create clubs, appoint council, or post anything.
 */
export function Onboarding({
  update,
  mode = "local",
  error,
}: {
  update: (fn: (draft: DemoState) => DemoState) => void;
  /** Tells the reader whether this account will be shared or stay on-device. */
  mode?: "backend" | "local";
  error?: string | null;
}) {
  const [draft, setDraft] = useState<AccountDraft>({ ...EMPTY_ACCOUNT, role: "admin" });

  const ready = isValidAccount(draft);

  function create(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    update((d) =>
      addAccount(
        d,
        {
          ...draft,
          displayName: draft.displayName.trim(),
          email: draft.email.trim().toLowerCase(),
          // Nobody picked a picture: fall back to initials on a colour.
          pfpUrl: draft.pfpUrl ?? avatarFor(draft.displayName.trim(), 265),
        },
        true,
      ),
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">ClubConnect</h1>
        <p className="mt-2 text-sm leading-relaxed text-subtle">
          Nothing here yet. Make the first account and build the school from
          scratch.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-[10px] border border-down/40 bg-down-soft px-4 py-3 text-sm text-ink"
        >
          {error}
        </p>
      ) : null}

      <p className="mb-4 rounded-[10px] border border-line bg-surface/60 px-4 py-3 text-xs leading-relaxed text-subtle">
        {mode === "backend"
          ? "Connected to the shared school database. Accounts, posts and events you make here show up for everyone."
          : "Running on this browser only. Add the Supabase keys to .env.local to share everything across devices."}
      </p>

      <Card>
        <form onSubmit={create} className="space-y-6">
          <AccountFields draft={draft} onChange={setDraft} />

          <div className="rounded-xl border border-line bg-canvas p-3 text-xs leading-relaxed text-subtle">
            Start as <strong className="text-ink">Admin</strong> unless you have
            a reason not to - admin is what can create clubs and appoint the
            student council. You can add student and council accounts afterwards
            and switch between them at any time.
          </div>

          <Button type="submit" disabled={!ready} className="w-full">
            Create account and start
          </Button>
        </form>
      </Card>
    </main>
  );
}
