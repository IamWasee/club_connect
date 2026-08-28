"use client";

import { useMemo, useState } from "react";

import { CalendarToolbar, MiniMonth } from "@/components/calendar/CalendarChrome";
import type { CalendarView } from "@/components/calendar/CalendarChrome";
import { EventDialog } from "@/components/calendar/EventDialog";
import { EventForm } from "@/components/calendar/EventForm";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { TimeGrid } from "@/components/calendar/TimeGrid";
import { EmptyState } from "@/components/ui";
import { Swap } from "@/components/Motion";
import { useDemo } from "@/demo/store";
import { canManageEvents } from "@/demo/selectors";
import {
  addDays,
  addMonths,
  compareEvents,
  eventEnd,
  eventStart,
  isToday,
  rangeLabel,
  startOfDay,
  startOfWeek,
  weekDays,
} from "@/demo/calendar";
import type { Event } from "@/demo/types";

export default function EventsPage() {
  const { state, me } = useDemo();
  const mayManage = canManageEvents(state, me);

  const [view, setView] = useState<CalendarView>("month");
  // `anchor` is the day the current view is built around.
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [openEvent, setOpenEvent] = useState<Event | null>(null);
  const [createAt, setCreateAt] = useState<Date | null>(null);

  const busyDays = useMemo(() => {
    const days = new Set<string>();
    for (const event of state.events) {
      // Mark every day a multi-day event touches, so the mini month is honest.
      const last = startOfDay(eventEnd(event));
      for (let day = startOfDay(eventStart(event)); day <= last; day = addDays(day, 1)) {
        days.add(day.toDateString());
      }
    }
    return days;
  }, [state.events]);

  function step(direction: -1 | 1) {
    if (view === "month") setAnchor(addMonths(anchor, direction));
    else if (view === "week") setAnchor(addDays(anchor, 7 * direction));
    else if (view === "day") setAnchor(addDays(anchor, direction));
    else setAnchor(addMonths(anchor, direction));
  }

  const openDay = (day: Date) => {
    setAnchor(day);
    setView("day");
  };

  const startCreate = mayManage
    ? (at: Date) => {
        // A click on a bare day means "sometime that day"; default to lunchtime
        // rather than midnight.
        const when = new Date(at);
        if (when.getHours() === 0 && when.getMinutes() === 0) when.setHours(12, 0, 0, 0);
        setCreateAt(when);
      }
    : null;

  return (
    <>
      <CalendarToolbar
        title={periodTitle(view, anchor)}
        view={view}
        onView={setView}
        onToday={() => setAnchor(startOfDay(new Date()))}
        onStep={step}
        onCreate={mayManage ? () => startCreate?.(new Date()) : undefined}
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="hidden w-56 shrink-0 lg:block">
          <MiniMonth
            month={anchor}
            selected={anchor}
            busyDays={busyDays}
            onSelect={(day) => setAnchor(day)}
            onStep={(direction) => setAnchor(addMonths(anchor, direction))}
          />
          <p className="mt-3 px-1 text-xs leading-relaxed text-subtle">
            {mayManage
              ? "Click any day or hour to add an event there."
              : "Open an event to sign up. The council president, vice president and admin create events."}
          </p>
        </aside>

        <div className="min-w-0 flex-1">
          <Swap swapKey={view}>
          {view === "month" ? (
            <MonthGrid
              month={anchor}
              events={state.events}
              onOpenEvent={setOpenEvent}
              onOpenDay={openDay}
              onCreateAt={startCreate}
            />
          ) : null}

          {view === "week" ? (
            <TimeGrid
              days={weekDays(anchor)}
              events={state.events}
              onOpenEvent={setOpenEvent}
              onCreateAt={startCreate}
            />
          ) : null}

          {view === "day" ? (
            <TimeGrid
              days={[anchor]}
              events={state.events}
              onOpenEvent={setOpenEvent}
              onCreateAt={startCreate}
            />
          ) : null}

          {view === "schedule" ? (
            <ScheduleView events={state.events} onOpenEvent={setOpenEvent} />
          ) : null}
          </Swap>
        </div>
      </div>

      {openEvent ? (
        // Re-read from state so the card reflects edits made while it is open.
        <EventDialog
          event={state.events.find((e) => e.id === openEvent.id) ?? openEvent}
          onClose={() => setOpenEvent(null)}
        />
      ) : null}

      {createAt ? <EventForm startAt={createAt} onDone={() => setCreateAt(null)} /> : null}
    </>
  );
}

function periodTitle(view: CalendarView, anchor: Date): string {
  if (view === "day") {
    return anchor.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const left = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const right = end.toLocaleDateString(
      undefined,
      sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" },
    );
    return `${left} - ${right}, ${end.getFullYear()}`;
  }

  return anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Google's Schedule view: upcoming events as a flat, grouped list. */
function ScheduleView({
  events,
  onOpenEvent,
}: {
  events: Event[];
  onOpenEvent: (event: Event) => void;
}) {
  const upcoming = events
    .filter((event) => eventEnd(event).getTime() >= Date.now())
    .sort(compareEvents);

  if (upcoming.length === 0) {
    return <EmptyState>Nothing coming up.</EmptyState>;
  }

  const groups = new Map<string, Event[]>();
  for (const event of upcoming) {
    const key = startOfDay(eventStart(event)).toDateString();
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {[...groups.entries()].map(([key, dayEvents]) => {
        const day = new Date(key);
        return (
          <div key={key} className="flex gap-4 border-b border-line p-4 last:border-b-0">
            <div className="w-16 shrink-0 text-center">
              <p className="text-[11px] uppercase text-subtle">
                {day.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p
                className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-lg ${
                  isToday(day) ? "bg-ink font-semibold text-paper" : ""
                }`}
              >
                {day.getDate()}
              </p>
              <p className="text-[11px] uppercase text-subtle">
                {day.toLocaleDateString(undefined, { month: "short" })}
              </p>
            </div>

            <ul className="min-w-0 flex-1 space-y-1">
              {dayEvents.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(event)}
                    className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-brand-soft"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: event.color }}
                    />
                    <span className="w-28 shrink-0 text-xs tabular-nums text-subtle">{rangeLabel(event)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{event.title}</span>
                    {event.location ? (
                      <span className="hidden truncate text-xs text-subtle sm:block">
                        {event.location}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
