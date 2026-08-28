"use client";


/**
 * The poster language: film grain, the four-point sparkle, and hairline rules.
 * These three carry the identity, so they live together and are used everywhere
 * rather than being redrawn per page.
 */

/**
 * Grain sits on a fixed, pointer-events-none layer. Never on a scrolling
 * container: a filter that repaints every frame wrecks mobile framerate.
 */
export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.16] mix-blend-multiply dark:opacity-[0.10] dark:mix-blend-screen"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/**
 * The four-point sparkle from the poster. Concave sides are what make it read
 * as a twinkle rather than a plus sign.
 */
export function Sparkle({
  className = "",
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill="currentColor"
    >
      <path d="M50 0 C 53 34 66 47 100 50 C 66 53 53 66 50 100 C 47 66 34 53 0 50 C 34 47 47 34 50 0 Z" />
    </svg>
  );
}

/** Hairline rule broken by a sparkle, exactly as the poster sets its dividers. */
export function SparkleRule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-line" />
      <Sparkle size={13} className="text-subtle/70" />
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** A trio of sparkles, the poster's top-right corner mark. */
export function SparkleTrio({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center gap-1.5 ${className}`}>
      <Sparkle size={11} />
      <Sparkle size={16} />
      <Sparkle size={11} />
    </span>
  );
}

/**
 * Page header. Poster proportions: a small tracked label, then the headline set
 * as large as the phrase allows, then a rule. Used on every page so the app
 * reads as one publication.
 */
export function PageHead({
  label,
  title,
  lede,
  action,
}: {
  label?: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          {label ? (
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-subtle">
              {label}
            </p>
          ) : null}

          {/* Deliberately not animated. An entrance on the page's primary
              heading stalls at partial opacity whenever the tab is throttled,
              which leaves the most important text on the page unreadable.
              Motion belongs on feedback and dialogs, not on legibility. */}
          <h1 className="text-balance font-display text-[2rem] leading-[0.95] sm:text-5xl">
            {title}
          </h1>

          {lede ? (
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-subtle">{lede}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
      </div>

      <SparkleRule className="mt-6" />
    </header>
  );
}
