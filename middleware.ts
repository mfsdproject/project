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
