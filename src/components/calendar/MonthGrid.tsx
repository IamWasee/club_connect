"use client";

import {
  WEEKDAY_LABELS,
  eventStart,
  eventsOn,
  isToday,
  monthMatrix,
  readableInk,
  shortTime,
} from "@/demo/calendar";
import type { Event } from "@/demo/types";

/** How many chips fit in a cell before it collapses into "+N more". */
const MAX_CHIPS = 3;

export function MonthGrid({
  month,
  events,
  onOpenEvent,
  onOpenDay,
  onCreateAt,
}: {
  month: Date;
  events: Event[];
  onOpenEvent: (event: Event) => void;
  onOpenDay: (day: Date) => void;
  onCreateAt: ((day: Date) => void) | null;
}) {
  const weeks = monthMatrix(month);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/70 backdrop-blur-[2px]">
      <div className="grid grid-cols-7 border-b border-line">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-1 py-2 text-center text-[9px] font-medium uppercase tracking-[0.1em] text-subtle sm:px-2 sm:py-2.5 sm:text-[10px] sm:tracking-[0.14em]">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((day, index) => {
          const dayEvents = eventsOn(events, day);
          const outside = day.getMonth() !== month.getMonth();
          const today = isToday(day);
          const shown = dayEvents.slice(0, MAX_CHIPS);
          const hidden = dayEvents.length - shown.length;

          return (
            <div
              key={day.toISOString()}
              className={`min-h-16 border-line p-1 sm:min-h-32 sm:p-1.5 ${
                index % 7 !== 6 ? "border-r" : ""
              } ${index < 35 ? "border-b" : ""} ${outside ? "bg-canvas/40" : ""}`}
            >
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  title="Open this day"
                  className={`mb-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] tabular-nums transition-colors sm:mb-1.5 sm:h-7 sm:min-w-7 sm:px-1.5 sm:text-xs ${
                    today
                      ? "bg-ink font-semibold text-paper"
                      : outside
                        ? "text-subtle/60 hover:bg-brand-soft"
                        : "text-ink hover:bg-brand-soft"
                  }`}
                >
                  {day.getDate()}
                </button>
              </div>

              {/* Phones get dots: a 50px column cannot hold "9am Club fair".
                  Tapping the date opens that day. */}
              <button
                type="button"
                onClick={() => onOpenDay(day)}
                aria-label={`${dayEvents.length} event(s) on ${day.toDateString()}`}
                className="flex w-full flex-wrap justify-center gap-0.5 sm:hidden"
              >
                {dayEvents.slice(0, 4).map((event) => (
                  <span
                    key={event.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: event.color }}
                  />
                ))}
              </button>

              <div className="hidden space-y-0.5 sm:block">
                {shown.map((event) => (
                  <MonthChip key={event.id} event={event} onOpen={() => onOpenEvent(event)} />
                ))}

                {hidden > 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenDay(day)}
                    className="w-full rounded px-1 py-0.5 text-left text-[11px] font-medium text-subtle transition hover:bg-brand-soft hover:text-ink"
                  >
                    +{hidden} more
                  </button>
                ) : null}

                {/* The rest of the cell creates an event on that day, the way
                    clicking empty space in Google Calendar does. */}
                {onCreateAt && dayEvents.length < MAX_CHIPS ? (
                  <button
                    type="button"
                    onClick={() => onCreateAt(day)}
                    aria-label={`Add an event on ${day.toDateString()}`}
                    className="h-4 w-full rounded transition hover:bg-brand-soft"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * All-day events read as a solid bar; timed events as a dot, the start time,
 * then the title — matching how Google distinguishes them at a glance.
 */
function MonthChip({ event, onOpen }: { event: Event; onOpen: () => void }) {
  if (event.allDay) {
    return (
      <button
        type="button"
        onClick={onOpen}
        style={{ background: event.color, color: readableInk(event.color) }}
        className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium"
      >
        {event.title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] transition hover:bg-brand-soft"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: event.color }}
      />
      <span className="shrink-0 text-subtle">{shortTime(eventStart(event))}</span>
      <span className="truncate font-medium">{event.title}</span>
    </button>
  );
}
