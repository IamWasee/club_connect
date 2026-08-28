"use client";

import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Button, Card, TextArea, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { escapeXml } from "@/demo/initial";

const TITLE_MAX = 120;
const CONTENT_MAX = 5000;

/**
 * Shown only to people who may post here — the caller decides that, and the
 * page re-checks with the same permission helper the roster uses.
 */
export function PostComposer({ clubId, placeholder }: { clubId: string | null; placeholder: string }) {
  const { me } = useDemo();
  const { createPost } = useActions();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [withImage, setWithImage] = useState(false);

  const ready = title.trim().length > 0 && content.trim().length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    createPost({
      clubId,
      title: title.trim(),
      content: content.trim(),
      imageUrl: withImage ? cover(title.trim()) : null,
    });

    setTitle("");
    setContent("");
    setWithImage(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <Card className="mb-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 text-left"
        >
          <Avatar identity={me} size="sm" />
          <span className="flex-1 rounded-full border border-line bg-canvas px-4 py-2 text-sm text-subtle">
            {placeholder}
          </span>
        </button>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <form onSubmit={submit} className="space-y-3">
        <TextInput
          autoFocus
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Spirit Week schedule is final"
        />
        <TextArea
          rows={5}
          value={content}
          maxLength={CONTENT_MAX}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do students need to know\u2026"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-subtle">
            <input
              type="checkbox"
              checked={withImage}
              onChange={(e) => setWithImage(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-brand)]"
            />
            Add a cover image
          </label>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready}>
              Post
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}

/**
 * Uploads are a Phase-later concern; the demo generates a cover from the title
 * so a post with an image is still demonstrable without a storage bucket.
 */
function cover(title: string): string {
  const hue = [...title].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  const text = title.length > 28 ? `${title.slice(0, 27)}…` : title;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 58%)"/><stop offset="1" stop-color="hsl(${hue + 45} 65% 42%)"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/><text x="400" y="200" dy="0.35em" text-anchor="middle" font-family="system-ui, sans-serif" font-size="42" font-weight="700" fill="rgba(255,255,255,0.92)">${escapeXml(text)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
