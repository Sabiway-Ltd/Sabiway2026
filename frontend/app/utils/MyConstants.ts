// frontend/app/utils/MyConstants.ts

// FOR TESTING
// export const EXPRESS_URL = "https://sabiway2025-49a4.vercel.app"

// export const DJANGO_URL = "https://sabiway-9wq4.onrender.com"


export const EXPRESS_URL = "https://express.sabiway.com"

export const DJANGO_URL = "https://django.sabiway.com"

// FOR DOCKER AND LOCAL TESTING

// const isBrowser = typeof window !== "undefined";

/**
 * EXPRESS_URL
 * - Uses NEXT_PUBLIC_EXPRESS_API_URL from environment (set in Docker or .env)
 * - Fallbacks for local dev or server-side rendering
 */
// export const EXPRESS_URL = isBrowser
//   ? process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://localhost:5000" // Browser fallback
//   : process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://express:5000";  // SSR / Docker internal

// /**
//  * DJANGO_URL
//  * - Uses NEXT_PUBLIC_DJANGO_API_URL from environment
//  * - Fallbacks for local dev or server-side rendering
//  */
// export const DJANGO_URL = isBrowser
//   ? process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000"
//   : process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://web:8000";

// /**
//  * FRONTEND_URL
//  * - The URL of your frontend, used for redirects / OAuth callbacks
//  */
// export const FRONTEND_URL =
//   process.env.NEXT_PUBLIC_FRONTEND_URL || (isBrowser ? window.location.origin : "http://localhost:3000");







  // FOR VPS
//   const isBrowser = typeof window !== "undefined";

// /**
//  * EXPRESS_URL
//  * - Uses NEXT_PUBLIC_EXPRESS_API_URL from environment (set in Docker or .env)
//  * - Fallbacks for local dev or server-side rendering
//  */
// export const EXPRESS_URL = isBrowser
//   ? process.env.NEXT_PUBLIC_EXPRESS_API_URL || "https://express.sabiway.com" // Browser fallback
//   : process.env.NEXT_PUBLIC_EXPRESS_API_URL || "http://express:5000";  // SSR / Docker internal

// /**
//  * DJANGO_URL
//  * - Uses NEXT_PUBLIC_DJANGO_API_URL from environment
//  * - Fallbacks for local dev or server-side rendering
//  */
// export const DJANGO_URL = isBrowser
//   ? process.env.NEXT_PUBLIC_DJANGO_API_URL || "https://django.sabiway.com"
//   : process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://web:8000";

// /**
//  * FRONTEND_URL
//  * - The URL of your frontend, used for redirects / OAuth callbacks
//  */
// export const FRONTEND_URL =
//   process.env.NEXT_PUBLIC_FRONTEND_URL || (isBrowser ? window.location.origin : "https://www.sabiway.com");
