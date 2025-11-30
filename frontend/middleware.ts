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
  "/privacy-policy"
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access")?.value;
  const path = req.nextUrl.pathname;

  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    path.startsWith("/callback") || // covers /callback and /callback/google
    path.startsWith("/change-password/");

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
    "/((?!api|_next/static|_next/image|favicon.ico|images|uploads|fonts|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|pdf)$).*)",
  ],
};
