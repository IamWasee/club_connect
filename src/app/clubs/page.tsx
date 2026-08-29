"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { ClubMark, PATTERN_CHOICES } from "@/components/ClubArt";
import { ClubArtSwatch } from "@/components/ClubBackdrop";
import { Badge, Button, Card, EmptyState, Field, PageHead, TextArea, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { membership, roster, rosterSize } from "@/demo/selectors";
import { CLUB_COLORS } from "@/demo/initial";
import type { ClubPattern } from "@/demo/types";

/** Admin and Council keep the club list; a club's own officers run it after that. */
function canCreateClubs(role: string): boolean {
  return role === "admin" || role === "council";
}

export default function ClubsPage() {
  const { state, me } = useDemo();
  const [creating, setCreating] = useState(false);
  const mayCreate = canCreateClubs(me.role);

  return (
    <>
      <PageHead
        label="Six of them"
        title="Clubs"
        lede="Each club runs its own feed. Officers invite new members by school email."
        action={
          mayCreate && !creating ? (
            <Button onClick={() => setCreating(true)}>New club</Button>
          ) : null
        }
      />

      {mayCreate && creating ? <ClubForm onDone={() => setCreating(false)} /> : null}

      {state.clubs.length === 0 ? (
        <EmptyState>
          No clubs yet.
          {mayCreate
            ? " Create the first one - you'll pick its president, and they take it from there."
            : " Admin and Student Council add clubs."}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {state.clubs.map((club) => {
            const people = roster(state, club);
            const size = rosterSize(people);
            const mine = membership(state, club.id, me.id);

            return (
              <Link key={club.id} href={`/clubs/${club.slug}`} className="group block focus:outline-none">
                <Card className="relative h-full overflow-hidden !p-0 transition group-hover:border-brand">
                  {/* A spine rather than a banner: the club's colour is on the
                      card without a picture strip across the top of it. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: club.themeColor }}
                  />
                  <div className="p-5 pl-6">
                    <div className="flex items-start gap-3">
                      <ClubMark club={club} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="min-w-0 truncate font-display text-xl">{club.name}</h2>
                          {mine?.status === "invited" ? (
                            <Badge>Invited</Badge>
                          ) : mine?.status === "accepted" ? (
                            <Badge tone="muted">Member</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
                          {people.president
                            ? `Led by ${people.president.displayName}`
                            : "Seat vacant"}
                        </p>
                      </div>
                    </div>

                    {club.description ? (
                      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-subtle">
                        {club.description}
                      </p>
                    ) : null}

                    <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                      <div className="flex -space-x-2">
                        {[people.president, people.vp, ...people.members]
                          .filter((person) => person !== null)
                          .slice(0, 4)
                          .map((person) => (
                            <Avatar key={person.id} identity={person} size="xs" />
                          ))}
                      </div>
                      <span className="text-xs text-subtle">
                        {size} {size === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function ClubForm({ onDone }: { onDone: () => void }) {
  const { state, me } = useDemo();
  const { createClub } = useActions();

  const [form, setForm] = useState({
    name: "",
    description: "",
    themeColor: CLUB_COLORS[0],
    pattern: "confetti" as ClubPattern,
    presidentId: me.id,
    vpId: "",
  });

  // A president can be left vacant and filled in later from the club's About
  // tab, so a club can be listed before anyone has agreed to run it.
  const ready = form.name.trim().length > 1;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    createClub({
      name: form.name.trim(),
      description: form.description.trim(),
      themeColor: form.themeColor,
      pattern: form.pattern,
      presidentId: form.presidentId || null,
      vpId: form.vpId || null,
    });
    onDone();
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="space-y-5">
        <Field label="Club name">
          <TextInput
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Robotics Team"
          />
        </Field>

        <Field label="Description" hint="Shown on the club card and its page.">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What the club does, when it meets, who it's for."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="President" hint="They can post to the club and invite members.">
            <select
              value={form.presidentId}
              onChange={(e) => setForm({ ...form, presidentId: e.target.value })}
              className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="">- vacant for now -</option>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Vice President" hint="Optional.">
            <select
              value={form.vpId}
              onChange={(e) => setForm({ ...form, vpId: e.target.value })}
              className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            >
              <option value="">- none -</option>
              {state.users
                .filter((user) => user.id !== form.presidentId)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Theme colour</span>
          <div className="flex flex-wrap gap-2">
            {CLUB_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color}`}
                onClick={() => setForm({ ...form, themeColor: color })}
                className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-[var(--color-surface)] transition ${
                  form.themeColor === color ? "ring-2 ring-ink" : "ring-1 ring-line"
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Artwork</span>
          <div className="flex flex-wrap gap-2">
            {PATTERN_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                title={choice.label}
                aria-label={choice.label}
                onClick={() => setForm({ ...form, pattern: choice.value })}
                className={`rounded-lg transition ${
                  form.pattern === choice.value
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-[var(--color-surface)]"
                    : "ring-1 ring-line"
                }`}
              >
                <ClubMark
                  club={{ pattern: choice.value, themeColor: form.themeColor }}
                  size="md"
                  tinted={false}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-subtle">
            The scene the club&apos;s page sits on.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <ClubArtSwatch
              club={{ pattern: form.pattern, themeColor: form.themeColor }}
              className="aspect-[16/9] w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready}>
            Create club
          </Button>
        </div>
      </form>
    </Card>
  );
}
