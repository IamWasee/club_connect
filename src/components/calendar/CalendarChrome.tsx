"use client";

import {
  WEEKDAY_LABELS,
  addMonths,
  isToday,
  monthMatrix,
  sameDay,
} from "@/demo/calendar";

export type CalendarView = "month" | "week" | "day" | "schedule";

export const VIEW_LABELS: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  schedule: "Schedule",
};

/**
 * The bar across the top of Google Calendar: Today, the arrows, the period
 * title, and the view switcher.
 */
export function CalendarToolbar({
  title,
  view,
  onView,
  onToday,
  onStep,
  onCreate,
}: {
  title: string;
  view: CalendarView;
  onView: (view: CalendarView) => void;
  onToday: () => void;
  onStep: (direction: -1 | 1) => void;
  onCreate?: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToday}
        className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-ink hover:bg-brand-soft"
      >
        Today
      </button>

      <div className="flex items-center">
        <StepButton label="Previous" onClick={() => onStep(-1)} glyph="‹" />
        <StepButton label="Next" onClick={() => onStep(1)} glyph="›" />
      </div>

      {/* Order matters on a phone: the period title gets its own full-width
          row rather than being truncated to "August…" beside the arrows. */}
      <h1 className="order-first w-full min-w-0 font-display text-xl sm:order-none sm:ml-1 sm:w-auto sm:flex-1 sm:truncate sm:text-2xl">
        {title}
      </h1>

      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-brand"
        >
          + Create
        </button>
      ) : null}

      <div className="flex w-full overflow-hidden rounded-full border border-line sm:w-auto">
        {(Object.keys(VIEW_LABELS) as CalendarView[]).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onView(name)}
            aria-pressed={view === name}
            className={`flex-1 px-3 py-1.5 text-sm font-medium transition sm:flex-none ${
              view === name ? "bg-ink text-paper" : "text-subtle hover:bg-brand-soft hover:text-ink"
            }`}
          >
            {VIEW_LABELS[name]}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepButton({
  label,
  glyph,
  onClick,
}: {
  label: string;
  glyph: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-subtle transition hover:bg-brand-soft hover:text-ink"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}

/**
 * The small month in Google's left rail. Clicking a day jumps the main view
 * there, which is the fastest way to navigate during a demo.
 */
export function MiniMonth({
  month,
  selected,
  onSelect,
  onStep,
  busyDays,
}: {
  month: Date;
  selected: Date;
  onSelect: (day: Date) => void;
  onStep: (direction: -1 | 1) => void;
  busyDays: Set<string>;
}) {
  const weeks = monthMatrix(month);

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex">
          <StepButton label="Previous month" glyph="‹" onClick={() => onStep(-1)} />
          <StepButton label="Next month" glyph="›" onClick={() => onStep(1)} />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-[10px] font-medium text-subtle">
            {label.charAt(0)}
          </span>
        ))}

        {weeks.flat().map((day) => {
          const outside = day.getMonth() !== month.getMonth();
          const today = isToday(day);
          const active = sameDay(day, selected);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors ${
                today
                  ? "bg-ink font-semibold text-paper"
                  : active
                    ? "bg-brand-soft font-semibold text-brand"
                    : outside
                      ? "text-subtle/50 hover:bg-brand-soft"
                      : "text-ink hover:bg-brand-soft"
              }`}
            >
              {day.getDate()}
              {busyDays.has(day.toDateString()) && !today ? (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-brand" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { addMonths };
