/*
--- 4. UPDATED FILE: app/[[...sign-in]]/page.tsx ---
This file is updated to redirect logged-in users to the dashboard.
*/
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="mb-8">
            <img src="/mlmlogo.png" alt="Logo" className="h-24" />
        </div>
        <SignIn />
    </div>
  );
}
