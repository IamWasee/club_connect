"use client";

import { useEffect, useRef, useState } from "react";

import {
  HOUR_HEIGHT,
  eventEnd,
  eventStart,
  eventsOn,
  hourLabel,
  isToday,
  layoutDay,
  readableInk,
  shortTime,
} from "@/demo/calendar";
import type { Event } from "@/demo/types";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
/** Where the grid parks itself on open — school days don't start at midnight. */
const SCROLL_TO_HOUR = 7;

/** The week and day views: an all-day band above a 24-hour grid. */
export function TimeGrid({
  days,
  events,
  onOpenEvent,
  onCreateAt,
}: {
  days: Date[];
  events: Event[];
  onOpenEvent: (event: Event) => void;
  onCreateAt: ((at: Date) => void) | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const perDay = days.map((day) => eventsOn(events, day));
  const hasAllDay = perDay.some((list) => list.some((event) => event.allDay));

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = SCROLL_TO_HOUR * HOUR_HEIGHT;
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/70 backdrop-blur-[2px]">
      <div className="flex border-b border-line">
        <div className="w-14 shrink-0" />
        {days.map((day) => (
          <div key={day.toISOString()} className="flex-1 border-l border-line px-1 py-2 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </p>
            <p
              className={`mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-full text-lg tabular-nums ${
                isToday(day) ? "bg-ink font-semibold text-paper" : "text-ink"
              }`}
            >
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      {hasAllDay ? (
        <div className="flex border-b border-line">
          <div className="w-14 shrink-0 py-1 pr-2 text-right text-[10px] uppercase text-subtle">
            All day
          </div>
          {days.map((day, index) => (
            <div key={day.toISOString()} className="min-h-7 flex-1 space-y-0.5 border-l border-line p-1">
              {perDay[index]
                .filter((event) => event.allDay)
                .map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onOpenEvent(event)}
                    style={{ background: event.color, color: readableInk(event.color) }}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium"
                  >
                    {event.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : null}

      <div ref={scroller} className="max-h-[32rem] overflow-y-auto">
        <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT }}>
          <div className="w-14 shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative pr-2 text-right"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-1.5 right-2 text-[10px] tabular-nums text-subtle">
                  {hourLabel(hour)}
                </span>
              </div>
            ))}
          </div>

          {days.map((day, index) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={perDay[index]}
              onOpenEvent={onOpenEvent}
              onCreateAt={onCreateAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  events,
  onOpenEvent,
  onCreateAt,
}: {
  day: Date;
  events: Event[];
  onOpenEvent: (event: Event) => void;
  onCreateAt: ((at: Date) => void) | null;
}) {
  const blocks = layoutDay(events, day);

  return (
    <div className="relative flex-1 border-l border-line">
      {HOURS.map((hour) => (
        <button
          key={hour}
          type="button"
          disabled={!onCreateAt}
          onClick={() => {
            const at = new Date(day);
            at.setHours(hour, 0, 0, 0);
            onCreateAt?.(at);
          }}
          aria-label={`Add an event at ${hourLabel(hour) || "midnight"}`}
          className="block w-full border-b border-line/50 transition-colors enabled:hover:bg-brand-soft/60 disabled:cursor-default"
          style={{ height: HOUR_HEIGHT }}
        />
      ))}

      {blocks.map(({ event, top, height, left, width }) => (
        <button
          key={event.id}
          type="button"
          onClick={() => onOpenEvent(event)}
          style={{
            top: `${top}%`,
            height: `${height}%`,
            left: `${left}%`,
            width: `${width}%`,
            background: event.color,
            color: readableInk(event.color),
          }}
          className="absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight shadow-sm ring-1 ring-black/5"
        >
          <span className="block truncate font-semibold">{event.title}</span>
          <span className="block truncate opacity-90">
            {shortTime(eventStart(event))} - {shortTime(eventEnd(event))}
          </span>
        </button>
      ))}

      <NowLine day={day} />
    </div>
  );
}

/** The red line across today, the detail that makes it read as a calendar. */
function NowLine({ day }: { day: Date }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (!now || !isToday(day)) return null;

  const offset = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top: `${offset}%` }}
    >
      <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-[#ea4335]" />
      <span className="h-px flex-1 bg-[#ea4335]" />
    </div>
  );
}
