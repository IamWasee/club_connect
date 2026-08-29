"use client";

/**
 * Downscale and re-encode an image in the browser before it is stored.
 *
 * Images end up as data URLs in a Postgres text column, so a raw phone photo
 * (several megabytes) is not an option. This caps the long edge and re-encodes
 * as JPEG, which brings a typical upload down to ~100-200KB.
 */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export function compressImage(
  file: File,
  { maxEdge = 1280, quality = 0.78, square = false } = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That file is not an image we can read."));
      image.onload = () => {
        let sx = 0;
        let sy = 0;
        let sw = image.width;
        let sh = image.height;

        if (square) {
          // Centre crop to a square before scaling.
          const edge = Math.min(sw, sh);
          sx = (sw - edge) / 2;
          sy = (sh - edge) / 2;
          sw = edge;
          sh = edge;
        }

        const scale = Math.min(1, maxEdge / Math.max(sw, sh));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not process that image."));

        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Shared validation so every picker rejects the same things the same way. */
export function rejectReason(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Pick an image file.";
  if (file.size > MAX_UPLOAD_BYTES) return "That image is over 12MB. Pick a smaller one.";
  return null;
}
