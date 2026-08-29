"use client";

import { useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Button, Card, TextArea, TextInput } from "@/components/ui";
import { useActions, useDemo } from "@/demo/store";
import { compressImage, rejectReason } from "@/lib/image";

const TITLE_MAX = 120;
const CONTENT_MAX = 5000;

/**
 * Shown only to people who may post here — the caller decides that, and the
 * page re-checks with the same permission helper the roster uses.
 *
 * `needsReview` only changes what the form says. Whether a post is published
 * or queued is decided in the store from the author's actual standing, so a
 * composer rendered with the wrong flag cannot publish anything it shouldn't.
 */
export function PostComposer({
  clubId,
  placeholder,
  needsReview = false,
}: {
  clubId: string | null;
  placeholder: string;
  needsReview?: boolean;
}) {
  const { me } = useDemo();
  const { createPost } = useActions();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const ready = title.trim().length > 0 && content.trim().length > 0;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;

    createPost({
      clubId,
      title: title.trim(),
      content: content.trim(),
      imageUrl: image,
    });

    setTitle("");
    setContent("");
    setImage(null);
    setImageError(null);
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
          placeholder="What do students need to know…"
        />

        {image ? (
          <div className="relative overflow-hidden rounded-xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="max-h-64 w-full object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute right-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-paper"
            >
              Remove
            </button>
          </div>
        ) : null}

        {imageError ? (
          <p role="alert" className="text-xs text-down">
            {imageError}
          </p>
        ) : null}

        {needsReview ? (
          <p className="rounded-xl border border-line bg-brand-soft/50 px-4 py-2.5 text-xs leading-relaxed text-subtle">
            This club&apos;s president and vice president read submissions before
            they reach the feed. You can follow yours on the Review tab.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;

              const reason = rejectReason(file);
              if (reason) return setImageError(reason);

              setImageError(null);
              setBusy(true);
              try {
                setImage(await compressImage(file, { maxEdge: 1280, quality: 0.78 }));
              } catch (cause) {
                setImageError(cause instanceof Error ? cause.message : "Could not use that image.");
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            {busy ? "Processing…" : image ? "Replace image" : "Add an image"}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready}>
              {needsReview ? "Submit for review" : "Post"}
            </Button>
          </div>
        </div>

      </form>
    </Card>
  );
}
