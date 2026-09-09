export const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Limite de 4 MB para caber bem no Neon/Vercel sem estourar body size. */
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export function assertPhotoFile(file: File) {
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Use JPEG, PNG ou WebP.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("A foto deve ter no máximo 4 MB.");
  }
}
