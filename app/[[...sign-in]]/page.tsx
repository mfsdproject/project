
/*
--- 4. UPDATED FILE: app/[[...sign-in]]/page.tsx ---
This file replaces the old app/page.tsx. The new filename creates a catch-all route
to correctly handle the sign-in flow at the root of the application.
*/
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="mb-8">
            <img src="/mlmlogo.png" alt="Logo" className="h-24" />
        </div>
        <SignIn />
    </div>
  );
}