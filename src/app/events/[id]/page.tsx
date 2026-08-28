"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, PersonRow } from "@/components/Avatar";
import { Badge, Button, Card, EmptyState, relativeDay } from "@/components/ui";
import { eventEnd, rangeLabel } from "@/demo/calendar";
import { ConfirmDialog } from "@/components/Dialogs";
import { useActions, useDemo } from "@/demo/store";
import { canSeeSignups, isSignedUp, signupsFor, userById } from "@/demo/selectors";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, me } = useDemo();
  const { toggleSignup, deleteEvent } = useActions();
  const [confirming, setConfirming] = useState(false);

  const event = state.events.find((e) => e.id === id);

  if (!event) {
    return (
      <EmptyState>
        That event doesn&apos;t exist.{" "}
        <Link href="/events" className="text-brand underline underline-offset-4">
          Back to events
        </Link>
      </EmptyState>
    );
  }

  const organizer = userById(state, event.createdBy);
  const going = isSignedUp(state, event.id, me.id);
  const maySeeList = canSeeSignups(event, me);
  const attendees = signupsFor(state, event.id);
  const isPast = eventEnd(event).getTime() < Date.now();

  return (
    <>
      <Link href="/events" className="mb-4 inline-block text-sm text-subtle hover:text-ink">
        ← Events
      </Link>

      {event.imageUrl ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.imageUrl} alt="" className="h-48 w-full object-cover sm:h-60" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 rounded"
              style={{ background: event.color }}
            />
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-subtle">
            {new Date(event.date).toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {" · "}
            {rangeLabel(event)}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <Badge tone="muted">{relativeDay(event.date)}</Badge>
      </div>

      {event.description ? (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
          {event.description}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant={going ? "ghost" : "primary"}
          disabled={isPast}
          onClick={() => toggleSignup(event.id)}
        >
          {isPast ? "This event has ended" : going ? "You're going ✓ - cancel" : "Sign up"}
        </Button>

        {event.createdBy === me.id || me.role === "admin" ? (
          <Button
            variant="danger"
            onClick={() => setConfirming(true)}
          >
            Delete event
          </Button>
        ) : null}
      </div>

      {organizer ? (
        <Card className="mt-6">
          <p className="mb-3 text-xs font-semibold text-subtle">Organizer</p>
          <PersonRow identity={organizer} />
        </Card>
      ) : null}

      <Card className="mt-4">
        {/* The count is part of the list, so it is the organizer's too - the
            events index hides it from everyone else for the same reason. */}
        <p className="mb-3 text-xs font-semibold text-subtle">
          {maySeeList ? `Signed up (${attendees.length})` : "Signed up"}
        </p>

        {!maySeeList ? (
          <p className="text-sm text-subtle">
            Only {organizer?.displayName ?? "the organizer"} can see who signed up.
          </p>
        ) : attendees.length === 0 ? (
          <p className="text-sm text-subtle">Nobody has signed up yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {attendees.map((person) => (
              <li key={person.id} className="flex items-center gap-2.5">
                <Avatar identity={person} size="sm" />
                <span className="truncate text-sm">{person.displayName}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={confirming}
        title="Delete this event?"
        body={`“${event.title}” and everyone's signups will be removed.`}
        confirmLabel="Delete event"
        onConfirm={() => {
          deleteEvent(event.id);
          router.push("/events");
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
