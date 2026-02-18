import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk"
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authResult = await auth();

  if (!authResult.userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (authResult.userId && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
