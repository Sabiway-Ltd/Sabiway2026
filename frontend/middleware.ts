import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { accessClassForPath, isAuthEntryPath, requiresAuthentication } from "./app/config/accessPolicy";

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

  if (PUBLIC_ASSETS.includes(path)) return NextResponse.next();

  const token = req.cookies.get("access")?.value;
  const accessClass = accessClassForPath(path);

  if (!token && requiresAuthentication(accessClass)) {
    const loginUrl = new URL("/login", req.url);
    const requested = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("next", requested);
    return NextResponse.redirect(loginUrl);
  }

  // Route role/object authorization remains a backend/API responsibility.
  // Middleware only establishes guest vs authenticated route boundaries.
  if (token && isAuthEntryPath(path)) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|favicon-16x16.png|favicon-32x32.png|images|uploads|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|pdf)$).*)",
  ],
};
