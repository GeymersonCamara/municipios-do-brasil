import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function photoAbsolutePath(relativePath: string) {
  return path.join(UPLOAD_ROOT, relativePath);
}

export async function saveVisitedPhoto(options: {
  userId: string;
  ibgeCode: string;
  bytes: Buffer;
  mimeType: string;
  previousPath?: string | null;
}) {
  const ext = EXT_BY_MIME[options.mimeType];
  if (!ext) {
    throw new Error("Tipo de imagem não suportado");
  }

  const dir = path.join(UPLOAD_ROOT, options.userId);
  await mkdir(dir, { recursive: true });

  const filename = `${options.ibgeCode}-${randomBytes(4).toString("hex")}.${ext}`;
  const relativePath = path.join(options.userId, filename);
  const absolutePath = photoAbsolutePath(relativePath);

  await writeFile(absolutePath, options.bytes);

  if (options.previousPath) {
    await deletePhotoFile(options.previousPath);
  }

  return relativePath.replaceAll("\\", "/");
}

export async function deletePhotoFile(relativePath: string | null | undefined) {
  if (!relativePath) return;
  try {
    await unlink(photoAbsolutePath(relativePath));
  } catch {
    // arquivo já ausente
  }
}
