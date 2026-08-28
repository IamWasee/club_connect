"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/Dialogs";
import { useActions, useDemo } from "@/demo/store";
import { canSeeSignups, isSignedUp, signupsFor, userById } from "@/demo/selectors";
import { eventEnd, eventStart, shortTime } from "@/demo/calendar";
import type { Event } from "@/demo/types";

/**
 * The card that opens when an event is clicked — Google's event popover:
 * colour swatch, title, when, where, then the actions.
 */
export function EventDialog({ event, onClose }: { event: Event; onClose: () => void }) {
  const { state, me } = useDemo();
  const { toggleSignup, deleteEvent } = useActions();
  const [confirming, setConfirming] = useState(false);

  const start = eventStart(event);
  const end = eventEnd(event);
  const organizer = userById(state, event.createdBy);
  const going = isSignedUp(state, event.id, me.id);
  const maySeeList = canSeeSignups(event, me);
  const attendees = signupsFor(state, event.id);
  const isPast = end.getTime() < Date.now();
  const mayDelete = event.createdBy === me.id || me.role === "admin";

  const when = event.allDay
    ? `${start.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} · All day`
    : `${start.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })} · ${shortTime(start)} - ${shortTime(end)}`;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/40 p-4 py-16">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 cursor-default" />

      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-subtle transition hover:bg-brand-soft hover:text-ink"
        >
          ✕
        </button>

        <div className="flex gap-3 pr-6">
          <span
            aria-hidden="true"
            className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded"
            style={{ background: event.color }}
          />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-snug tracking-tight">{event.title}</h2>
            <p className="mt-1 text-sm text-subtle">{when}</p>
            {event.location ? <p className="mt-0.5 text-sm text-subtle">{event.location}</p> : null}
          </div>
        </div>

        {event.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/90">
            {event.description}
          </p>
        ) : null}

        {organizer ? (
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
            <Avatar identity={organizer} size="xs" />
            <span className="text-xs text-subtle">Organized by {organizer.displayName}</span>
          </div>
        ) : null}

        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-xs font-semibold text-subtle">
            {maySeeList ? `Signed up (${attendees.length})` : "Signed up"}
          </p>
          {!maySeeList ? (
            <p className="text-xs text-subtle">
              Only {organizer?.displayName ?? "the organizer"} can see who signed up.
            </p>
          ) : attendees.length === 0 ? (
            <p className="text-xs text-subtle">Nobody yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {attendees.map((person) => (
                <li key={person.id} className="flex items-center gap-1.5">
                  <Avatar identity={person} size="xs" />
                  <span className="text-xs">{person.displayName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button
            variant={going ? "ghost" : "primary"}
            disabled={isPast}
            onClick={() => toggleSignup(event.id)}
          >
            {isPast ? "Ended" : going ? "Going ✓" : "Sign up"}
          </Button>

          <Link
            href={`/events/${event.id}`}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium transition hover:bg-brand-soft"
          >
            Full details
          </Link>

          {mayDelete ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="ml-auto rounded-lg px-2 py-1.5 text-xs text-subtle transition hover:bg-down-soft hover:text-down"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this event?"
        body={`“${event.title}” and everyone's signups will be removed.`}
        confirmLabel="Delete event"
        onConfirm={() => {
          deleteEvent(event.id);
          onClose();
        }}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
