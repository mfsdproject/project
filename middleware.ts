/*
--- 2. File: middleware.ts ---
Place this at the root of your project. This protects all routes
except for the home page, which is our sign-in page.
*/

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // ✅ Public routes (e.g., home page)
    '/',
    
    // ✅ API routes should still be protected
    '/(api|trpc)(.*)',

    // ✅ Protect all other routes except static files & internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
