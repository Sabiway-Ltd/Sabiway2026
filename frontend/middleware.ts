import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/", 
  "/login", 
  "/signup", 
  "/check-email", 
  "/confirm-signup", 
  "/forgot-password",
  "/terms-of-use",
  "/helpcenter",
  "/privacy-policy",
  "/about-us"
];

const PUBLIC_ASSETS = [
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/site.webmanifest",
];

export function middleware(req: NextRequest) {
  
  const path = req.nextUrl.pathname;


  if (PUBLIC_ASSETS.includes(path)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("access")?.value;

  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    path.startsWith("/callback") || // covers /callback and /callback/google
    path.startsWith("/change-password/") ||
    path.startsWith("/confirm-signup");

  // ⛔ Not logged in & not visiting a public route
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ Logged in & visiting login/signup pages
  if (token && ["/login", "/signup"].includes(path)) {
    return NextResponse.redirect(new URL("/community", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|favicon-16x16.png|favicon-32x32.png|images|uploads|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|pdf)$).*)",
  ],
};

