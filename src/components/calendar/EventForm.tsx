"use client";

import { useState } from "react";

import { Button, Field, TextArea, TextInput } from "@/components/ui";
import { DateTimeField } from "@/components/calendar/DateTimeField";
import { useActions } from "@/demo/store";
import {
  DEFAULT_EVENT_COLOR,
  EVENT_COLORS,
  toDateInput,
  toLocalInput,
} from "@/demo/calendar";

/**
 * Create-event panel. Opens prefilled from wherever it was launched — clicking
 * an hour in the week grid starts the event at that hour, the way Google does.
 */
export function EventForm({ startAt, onDone }: { startAt: Date; onDone: () => void }) {
  const { createEvent } = useActions();

  const [allDay, setAllDay] = useState(false);
  const [form, setForm] = useState(() => ({
    title: "",
    description: "",
    location: "",
    color: DEFAULT_EVENT_COLOR,
    start: toLocalInput(startAt),
    end: toLocalInput(new Date(startAt.getTime() + 3_600_000)),
    day: toDateInput(startAt),
  }));

  const ready = form.title.trim().length > 0 && (allDay ? form.day : form.start && form.end);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    // `datetime-local` and `date` give local wall-clock strings; `new Date`
    // reads them in local time, which is what the grid renders in.
    const start = allDay ? new Date(`${form.day}T00:00`) : new Date(form.start);
    const end = allDay ? new Date(`${form.day}T23:59`) : new Date(form.end);

    createEvent({
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      color: form.color,
      allDay,
      date: start.toISOString(),
      // Guard against an end before the start rather than rendering a negative
      // block: fall back to an hour.
      endDate: (end > start ? end : new Date(start.getTime() + 3_600_000)).toISOString(),
      imageUrl: null,
    });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/40 p-4 py-10">
      <button type="button" aria-label="Close" onClick={onDone} className="fixed inset-0 cursor-default" />

      <form
        onSubmit={submit}
        className="relative w-full max-w-md space-y-5 rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <h2 className="font-display text-2xl">New event</h2>

        <Field label="Title">
          <TextInput
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Winter Formal"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          All day
        </label>

        {allDay ? (
          <Field label="Date">
            <TextInput
              type="date"
              value={form.day}
              onChange={(e) => setForm({ ...form, day: e.target.value })}
            />
          </Field>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              <DateTimeField
                value={form.start}
                onChange={(start) => {
                  // Drag the end along with the start, keeping the duration.
                  const shifted =
                    form.end && new Date(form.end) > new Date(form.start)
                      ? new Date(
                          new Date(start).getTime() +
                            (new Date(form.end).getTime() - new Date(form.start).getTime()),
                        )
                      : new Date(new Date(start).getTime() + 3_600_000);
                  setForm({ ...form, start, end: toLocalInput(shifted) });
                }}
              />
            </Field>
            <Field label="Ends">
              <DateTimeField
                value={form.end}
                onChange={(end) => setForm({ ...form, end })}
              />
            </Field>
          </div>
        )}

        <Field label="Location">
          <TextInput
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Main gym"
          />
        </Field>

        <Field label="Description">
          <TextArea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is it, who's it for, what should people bring?"
          />
        </Field>

        <div>
          <span className="mb-2 block text-sm font-medium">Colour</span>
          <div className="flex flex-wrap gap-2">
            {EVENT_COLORS.map((color) => (
              <button
                key={color.hex}
                type="button"
                title={color.name}
                aria-label={color.name}
                onClick={() => setForm({ ...form, color: color.hex })}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-[var(--color-surface)] transition ${
                  form.color === color.hex ? "ring-2 ring-ink" : "ring-1 ring-line"
                }`}
                style={{ background: color.hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
