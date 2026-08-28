const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl",
} as const;

type Identity = { displayName: string; pfpUrl: string | null };

/**
 * The only way a person is ever rendered in ClubConnect: picture + display
 * name. Falls back to an initial so a missing image never leaks anything else.
 */
export function Avatar({
  identity,
  size = "md",
}: {
  identity: Identity;
  size?: keyof typeof SIZES;
}) {
  const initial = identity.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={`${SIZES[size]} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-brand ring-1 ring-line`}
    >
      {identity.pfpUrl ? (
        // Plain <img>: avatars are inline data URIs in the demo, and a broken
        // one should degrade rather than throw in the image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={identity.pfpUrl}
          alt=""
          width={80}
          height={80}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

/** Avatar + name, the standard person row used on rosters and lists. */
export function PersonRow({
  identity,
  note,
  size = "md",
}: {
  identity: Identity;
  note?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar identity={identity} size={size} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{identity.displayName}</p>
        {note ? <p className="truncate text-xs text-subtle">{note}</p> : null}
      </div>
    </div>
  );
}
