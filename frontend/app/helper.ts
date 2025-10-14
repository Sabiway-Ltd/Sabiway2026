// app/helper.ts

export const CLOUDINARY_CLOUD_NAME = "devqbjptr";
export const DEFAULT_PROFILE_PICTURE = "https://res.cloudinary.com/devqbjptr/image/upload/v1759934268/Avatar_2_rl1a6d.png";


export const getProfileSrc = (url?: string | null) => {
    if (!url) return DEFAULT_PROFILE_PICTURE;
    if (url.startsWith("http")) return url;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${url}`;
  };