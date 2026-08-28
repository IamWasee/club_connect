"use client";

import { useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui";

/** Stored as a data URL, so it has to stay small enough for localStorage. */
const MAX_EDGE = 320;
const QUALITY = 0.82;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/**
 * Downscale and re-encode in the browser before storing.
 *
 * A phone photo is several megabytes; a data URL of that size blows the
 * localStorage quota and takes the whole demo down with it. Cropping to a
 * square here also means every avatar is square by the time it is rendered.
 */
function toSquareDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That file is not an image we can read."));
      image.onload = () => {
        const edge = Math.min(image.width, image.height);
        const size = Math.min(edge, MAX_EDGE);

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image."));

        // Centre crop to a square, then scale down.
        ctx.drawImage(
          image,
          (image.width - edge) / 2,
          (image.height - edge) / 2,
          edge,
          edge,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string | null;
  onChange: (dataUrl: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      return setError("Pick an image file.");
    }
    if (file.size > MAX_INPUT_BYTES) {
      return setError("That image is over 8MB. Pick a smaller one.");
    }

    setBusy(true);
    try {
      onChange(await toSquareDataUrl(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not use that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar identity={{ displayName: name || "?", pfpUrl: value }} size="xl" />

        <div className="min-w-0">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void handle(e.target.files?.[0]);
              // Clear it so picking the same file twice still fires.
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {busy ? "Processing…" : value ? "Change photo" : "Upload a photo"}
          </Button>
          <p className="mt-2 max-w-[34ch] text-xs leading-relaxed text-subtle">
            Cropped square and scaled to {MAX_EDGE}px before it is saved.
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-xs text-down">
          {error}
        </p>
      ) : null}
    </div>
  );
}
