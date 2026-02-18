# Magpie Landing Page

Production landing page for Magpie, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and Clerk.

## Getting Started

1. Install dependencies (including Clerk):
   ```bash
   npm install
   npm install @clerk/nextjs@latest
   ```

2. Configure environment variables in `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   CLERK_SECRET_KEY=YOUR_SECRET_KEY
   ```

3. Ensure the Clerk middleware is present (root-level `proxy.ts`):
   ```typescript
   import { clerkMiddleware } from "@clerk/nextjs/server";

   export default clerkMiddleware();

   export const config = {
     matcher: [
       "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
       "/(api|trpc)(.*)",
     ],
   };
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Notes

- All call-to-action buttons use Clerk's `SignUpButton` with modal mode.
- The design follows the Magpie PRD design system and accessibility requirements.
