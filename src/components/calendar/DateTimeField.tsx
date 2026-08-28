"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarBlankIcon } from "@phosphor-icons/react";

import {
  WEEKDAY_LABELS,
  addMonths,
  isToday,
  monthMatrix,
  sameDay,
  shortTime,
  toLocalInput,
} from "@/demo/calendar";
import { useClickOutside } from "@/hooks/use-click-outside";

/**
 * Replacement for `<input type="datetime-local">`.
 *
 * The native control renders the browser's own picker, which ignores the app's
 * palette entirely, differs on every platform, and shows a 24-row minute column
 * for a school event that is never going to start at 3:47. This one is styled
 * with the rest of the app and offers quarter-hour steps.
 */
const MINUTES = [0, 15, 30, 45];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function DateTimeField({
  value,
  onChange,
  id,
}: {
  /** `YYYY-MM-DDTHH:mm`, the same local wall-clock string the native input uses. */
  value: string;
  onChange: (next: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const parsed = value ? new Date(value) : new Date();
  const selected = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const [month, setMonth] = useState(selected);

  useClickOutside(wrap, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function commit(next: Date) {
    onChange(toLocalInput(next));
  }

  function pickDay(day: Date) {
    const next = new Date(day);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    commit(next);
  }

  function pickTime(hour: number, minute: number) {
    const next = new Date(selected);
    next.setHours(hour, minute, 0, 0);
    commit(next);
  }

  const label = `${selected.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  })}, ${shortTime(selected)}`;

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => {
          setMonth(selected);
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-paper px-3 py-2.5 text-left text-sm transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="truncate tabular-nums">{label}</span>
        <CalendarBlankIcon size={16} className="shrink-0 text-subtle" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date and time"
          className="absolute left-0 z-40 mt-2 flex w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-xl"
        >
          <div className="min-w-0 flex-1 border-r border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="truncate text-sm font-medium">
                {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </p>
              <div className="flex shrink-0">
                <Step label="Previous month" glyph="‹" onClick={() => setMonth(addMonths(month, -1))} />
                <Step label="Next month" glyph="›" onClick={() => setMonth(addMonths(month, 1))} />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-1 text-center">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d} className="text-[10px] font-medium text-subtle">
                  {d.charAt(0)}
                </span>
              ))}

              {monthMatrix(month)
                .flat()
                .map((day) => {
                  const outside = day.getMonth() !== month.getMonth();
                  const active = sameDay(day, selected);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => pickDay(day)}
                      aria-current={active ? "date" : undefined}
                      className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs tabular-nums transition-colors ${
                        active
                          ? "bg-ink font-semibold text-paper"
                          : isToday(day)
                            ? "text-brand ring-1 ring-brand"
                            : outside
                              ? "text-subtle/50 hover:bg-brand-soft"
                              : "text-ink hover:bg-brand-soft"
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
            </div>

            <div className="mt-3 flex justify-between border-t border-line pt-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setMinutes(0, 0, 0);
                  setMonth(now);
                  commit(now);
                }}
                className="rounded-full px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-xs font-medium transition-colors hover:bg-brand-soft"
              >
                Done
              </button>
            </div>
          </div>

          <div className="flex w-28 shrink-0">
            <Column
              label="Hour"
              values={HOURS}
              active={selected.getHours()}
              format={(h) => String(h).padStart(2, "0")}
              onPick={(h) => pickTime(h, selected.getMinutes())}
            />
            <Column
              label="Min"
              values={MINUTES}
              active={
                // Snap an off-step minute to the nearest quarter for display.
                MINUTES.reduce((best, m) =>
                  Math.abs(m - selected.getMinutes()) < Math.abs(best - selected.getMinutes())
                    ? m
                    : best,
                )
              }
              format={(m) => String(m).padStart(2, "0")}
              onPick={(m) => pickTime(selected.getHours(), m)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Column({
  label,
  values,
  active,
  format,
  onPick,
}: {
  label: string;
  values: number[];
  active: number;
  format: (value: number) => string;
  onPick: (value: number) => void;
}) {
  const list = useRef<HTMLDivElement>(null);

  // Bring the current value into view when the picker opens.
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>("[data-active='true']");
    el?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col border-l border-line first:border-l-0">
      <p className="border-b border-line py-1.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
        {label}
      </p>
      <div ref={list} className="max-h-56 overflow-y-auto overscroll-contain py-1">
        {values.map((value) => {
          const isActive = value === active;
          return (
            <button
              key={value}
              type="button"
              data-active={isActive}
              onClick={() => onPick(value)}
              className={`block w-full px-2 py-1.5 text-center text-sm tabular-nums transition-colors ${
                isActive ? "bg-ink font-semibold text-paper" : "text-ink hover:bg-brand-soft"
              }`}
            >
              {format(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step({ label, glyph, onClick }: { label: string; glyph: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-full text-base text-subtle transition-colors hover:bg-brand-soft hover:text-ink"
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  );
}
