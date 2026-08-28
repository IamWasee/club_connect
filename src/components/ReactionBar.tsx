"use client";

import { useActions } from "@/demo/store";
import type { ReactionType } from "@/demo/types";

/**
 * Two reactions, one per person. The emoji live here and nowhere else, so
 * reskinning them later is a one-file change.
 */
const FACES: Record<ReactionType, { emoji: string; label: string; active: string }> = {
  // `active` classes are written out in full: Tailwind scans source text, so a
  // template-built class name like `bg-${tone}-soft` would never be generated.
  positive: { emoji: "\u{1F44D}", label: "Agree", active: "border-transparent bg-up-soft text-up" },
  negative: { emoji: "\u{1F44E}", label: "Disagree", active: "border-transparent bg-down-soft text-down" },
};

export function ReactionBar({
  postId,
  positive,
  negative,
  myReaction,
}: {
  postId: string;
  positive: number;
  negative: number;
  myReaction: ReactionType | null;
}) {
  const { react } = useActions();
  const counts = { positive, negative };

  return (
    <div className="flex items-center gap-2">
      {(["positive", "negative"] as const).map((type) => {
        const active = myReaction === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => react(postId, type)}
            aria-pressed={active}
            aria-label={`${FACES[type].label} - ${counts[type]} ${
              counts[type] === 1 ? "reaction" : "reactions"
            }`}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition",
              active
                ? FACES[type].active
                : "border-line text-subtle hover:border-brand hover:text-ink",
            ].join(" ")}
          >
            <span aria-hidden="true">{FACES[type].emoji}</span>
            <span className="tabular-nums">{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
