// app/utils/getProfileImage.ts

export const CLOUDINARY_BASE = "https://res.cloudinary.com/devqbjptr/image/upload/";
export const DEFAULT_AVATAR = `${CLOUDINARY_BASE}v1759934268/Avatar_2_rl1a6d.png`;

/**
 * Safely generates a full image URL.
 * - If src starts with "http", returns it directly.
 * - If src is a Cloudinary path, prepends Cloudinary base URL.
 * - If src is null/empty, returns a default avatar.
 */
export function getProfileImage(src?: string | null): string {
  if (!src || src.trim() === "") return DEFAULT_AVATAR;
  if (src.startsWith("http")) return src;
  return `${CLOUDINARY_BASE}${src}`;
}
