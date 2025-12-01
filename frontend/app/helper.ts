// app/helper.ts

export const CLOUDINARY_CLOUD_NAME = "dk6ew5ikb";
export const DEFAULT_PROFILE_PICTURE = "https://res.cloudinary.com/dk6ew5ikb/image/upload/v1764563407/Avatar_2_rl1a6d_za18c9.png";
export const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`;


export const getProfileSrc = (url?: string | null) => {
    if (!url) return DEFAULT_PROFILE_PICTURE;
    if (url.startsWith("http")) return url;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${url}`;
  };


export function getProfileImage(src?: string | null): string {
  if (!src || src.trim() === "") return DEFAULT_PROFILE_PICTURE;
  if (src.startsWith("http")) return src;
  return `${CLOUDINARY_BASE}${src}`;
}

