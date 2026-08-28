import type { Club, DemoState } from "./types";

/**
 * The clubs the school already runs. They ship with the app so there is
 * something to browse on a first load; everything else — accounts, posts,
 * events, council — still starts empty, and each of these has vacant officer
 * seats until an admin fills them.
 */
export const STARTER_CLUBS: Club[] = [
  {
    id: "club-football",
    slug: "football",
    name: "Football Club",
    description:
      "Training twice a week, matches on Saturdays. Eleven-a-side on the school pitch, plus five-a-side in the sports hall over winter. Every position, every skill level. Turn up to a session and we will find you a spot.",
    themeColor: "#2f6b4f",
    pattern: "field",
    bannerUrl: null,
    presidentId: null,
    vpId: null,
  },
  {
    id: "club-debate",
    slug: "debate",
    name: "Debate Club",
    description:
      "Parliamentary and Lincoln-Douglas. We practise Tuesdays, argue about everything, and travel to four tournaments a year.",
    themeColor: "#4a5a7b",
    pattern: "podium",
    bannerUrl: null,
    presidentId: null,
    vpId: null,
  },
  {
    id: "club-film",
    slug: "film",
    name: "Film Club",
    description:
      "Weekly screenings, monthly shorts, and one very ambitious spring festival. Bring strong opinions about lighting.",
    themeColor: "#6b4a63",
    pattern: "filmstrip",
    bannerUrl: null,
    presidentId: null,
    vpId: null,
  },
  {
    id: "club-math",
    slug: "math",
    name: "Math Club",
    description:
      "Competition prep, proof nights, and problems that take a week to crack. No calculators, strong opinions about elegance.",
    themeColor: "#a35a3a",
    pattern: "grid",
    bannerUrl: null,
    presidentId: null,
    vpId: null,
  },
  {
    id: "club-stem",
    slug: "stem",
    name: "STEM Club",
    description:
      "Builds, breadboards, and the science fair. Robotics, electronics, and whatever anyone turns up wanting to make.",
    themeColor: "#2f6b6b",
    pattern: "circuit",
    bannerUrl: null,
    presidentId: null,
    vpId: null,
  },
  {
    id: "club-environmental",
    slug: "environmental",
    name: "Environmental Club",
    description:
      "Campus garden, the recycling audit, and the river clean-up. Small practical projects, done properly.",
    themeColor: "#6b7a3a",
    pattern: "leaves",
    bannerUrl: null,
    presidentId: null,
    vpId: null,
  },
];

/**
 * The app starts with no accounts, posts, events, or council — only the club
 * list above. Everything else is created through the UI, so the demo shows the
 * real first-run experience rather than a pre-populated school.
 */
export function createEmpty(): DemoState {
  return {
    users: [],
    clubs: STARTER_CLUBS.map((club) => ({ ...club })),
    clubMembers: [],
    posts: [],
    reactions: [],
    events: [],
    eventSignups: [],
    council: [],
    currentUserId: "",
  };
}

/** Hues offered wherever a picture gets picked. */
export const AVATAR_HUES = [265, 12, 152, 200, 320, 40, 95, 240, 350, 175, 60, 290];

/** Club theme colours offered when a club is created or edited. */
/** One muted family, so any club a student creates still fits the page. */
export const CLUB_COLORS = [
  "#2f6b4f",
  "#4a5a7b",
  "#6b4a63",
  "#a35a3a",
  "#2f6b6b",
  "#6b7a3a",
  "#7a4a4a",
];

/**
 * A picture built from initials and a hue, inlined as a data URI. Keeps the
 * demo free of uploads and of any network request for an image.
 */
export function avatarFor(name: string, hue: number): string {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 68% 62%)"/><stop offset="1" stop-color="hsl(${hue + 24} 62% 46%)"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/><text x="40" y="40" dy="0.35em" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#fff">${escapeXml(initials)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** `Ada Lovelace` -> `ada.lovelace@northside.edu`, as a starting suggestion. */
export function suggestEmail(name: string): string {
  const handle = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".");
  return handle ? `${handle}@northside.edu` : "";
}

export function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "club"
  );
}

export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (ch) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch] ?? ch,
  );
}
