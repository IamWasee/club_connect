import type { Event } from "./types";

/**
 * Date maths and layout for the calendar views. Everything here is pure and
 * works on local time, because a school calendar is read in one timezone and
 * "Tuesday" has to mean the viewer's Tuesday.
 */

export const HOUR_HEIGHT = 48;
export const DAY_MS = 86_400_000;

/** Google Calendar's own palette, so the colour picker feels familiar. */
export const EVENT_COLORS: Array<{ name: string; hex: string }> = [
  { name: "Tomato", hex: "#d50000" },
  { name: "Flamingo", hex: "#e67c73" },
  { name: "Tangerine", hex: "#f4511e" },
  { name: "Banana", hex: "#f6bf26" },
  { name: "Sage", hex: "#33b679" },
  { name: "Basil", hex: "#0b8043" },
  { name: "Peacock", hex: "#039be5" },
  { name: "Blueberry", hex: "#3f51b5" },
  { name: "Lavender", hex: "#7986cb" },
  { name: "Grape", hex: "#8e24aa" },
  { name: "Graphite", hex: "#616161" },
];

export const DEFAULT_EVENT_COLOR = "#039be5";

/** Black or white, whichever stays readable on the given background. */
export function readableInk(hex: string): string {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.55 ? "#1f1f1f" : "#ffffff";
}

/* ------------------------------------------------------------------- dates */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, count: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

export function addMonths(date: Date, count: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth() + count, 1);
  // Clamp so 31 Jan + 1 month lands on 28/29 Feb rather than overflowing.
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
}

/** Weeks start on Sunday, matching Google Calendar's default. */
export function startOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -date.getDay());
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return sameDay(date, new Date());
}

/** Six rows of seven days covering the month, Sunday-first, as Google renders. */
export function monthMatrix(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/* ------------------------------------------------------------------ events */

export function eventStart(event: Event): Date {
  return new Date(event.date);
}

/** Falls back to a one-hour block for anything stored without an end. */
export function eventEnd(event: Event): Date {
  const end = event.endDate ? new Date(event.endDate) : null;
  const start = eventStart(event);
  if (!end || Number.isNaN(end.getTime()) || end <= start) {
    return new Date(start.getTime() + 3_600_000);
  }
  return end;
}

/** True when the event covers any part of the given day. */
export function occursOn(event: Event, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY_MS;
  return eventStart(event).getTime() < dayEnd && eventEnd(event).getTime() > dayStart;
}

export function eventsOn(events: Event[], day: Date): Event[] {
  return events.filter((event) => occursOn(event, day)).sort(compareEvents);
}

/** All-day first, then by start time, then by title — Google's ordering. */
export function compareEvents(a: Event, b: Event): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  const byStart = eventStart(a).getTime() - eventStart(b).getTime();
  return byStart !== 0 ? byStart : a.title.localeCompare(b.title);
}

/** Minutes from midnight, clamped to the day so multi-day blocks don't spill. */
export function minutesInto(day: Date, at: Date): number {
  const dayStart = startOfDay(day).getTime();
  return Math.min(Math.max((at.getTime() - dayStart) / 60_000, 0), 24 * 60);
}

export type PositionedEvent = {
  event: Event;
  /** Percentages, so the grid stays fluid at any column width. */
  top: number;
  height: number;
  left: number;
  width: number;
};

/**
 * Side-by-side layout for overlapping events. Events are grouped into clusters
 * that transitively overlap, and each cluster is split into as many columns as
 * it needs — the same thing Google does when two things clash.
 */
export function layoutDay(events: Event[], day: Date): PositionedEvent[] {
  const timed = events
    .filter((event) => !event.allDay)
    .sort((a, b) => eventStart(a).getTime() - eventStart(b).getTime());

  const spans = timed.map((event) => {
    const from = minutesInto(day, eventStart(event));
    // Keep a floor of 30 minutes so a very short event stays clickable.
    const to = Math.max(minutesInto(day, eventEnd(event)), from + 30);
    return { event, from, to };
  });

  const positioned: PositionedEvent[] = [];
  let cluster: typeof spans = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    // Greedy column packing: reuse the first column that has already ended.
    const columnEnds: number[] = [];
    const columnOf = new Map<string, number>();

    for (const span of cluster) {
      let column = columnEnds.findIndex((end) => end <= span.from);
      if (column === -1) {
        column = columnEnds.length;
        columnEnds.push(span.to);
      } else {
        columnEnds[column] = span.to;
      }
      columnOf.set(span.event.id, column);
    }

    const columns = columnEnds.length;
    for (const span of cluster) {
      const column = columnOf.get(span.event.id) ?? 0;
      positioned.push({
        event: span.event,
        top: (span.from / (24 * 60)) * 100,
        height: ((span.to - span.from) / (24 * 60)) * 100,
        left: (column / columns) * 100,
        // A sliver of overlap on the right mimics Google's stacked look.
        width: (1 / columns) * 100 - (columns > 1 ? 1 : 0),
      });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const span of spans) {
    if (cluster.length > 0 && span.from >= clusterEnd) flush();
    cluster.push(span);
    clusterEnd = Math.max(clusterEnd, span.to);
  }
  flush();

  return positioned;
}

/* ----------------------------------------------------------------- display */

export const WEEKDAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** `9am`, `2:30pm` — Google's compact chip format. */
export function shortTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours < 12 ? "am" : "pm";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0 ? `${hour}${suffix}` : `${hour}:${String(minutes).padStart(2, "0")}${suffix}`;
}

export function hourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "";
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

export function rangeLabel(event: Event): string {
  if (event.allDay) return "All day";
  return `${shortTime(eventStart(event))} - ${shortTime(eventEnd(event))}`;
}

/** The `YYYY-MM-DDTHH:mm` a `datetime-local` input expects, in local time. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
