import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/", 
  "/login", 
  "/signup", 
  "/check-email", 
  "/confirm-signup", 
  "/forgot-password",
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access")?.value;
  const path = req.nextUrl.pathname;

  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    path.startsWith("/callback") || // ✅ covers /callback and /callback/google
    path.startsWith("/change-password/");

  // ⛔ Not logged in & not visiting a public route
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // ✅ Logged in & visiting public route
  if (token && ["/login", "/signup"].includes(path)) {
    return NextResponse.redirect(new URL("/community", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
