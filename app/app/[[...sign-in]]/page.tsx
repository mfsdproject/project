
/*
--- 4. File: app/page.tsx ---
This is the HOME PAGE and the SIGN-IN PAGE.
It is public and accessible to everyone.
*/
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="mb-8">
            <img src="/mlmlogo.png" alt="Logo" className="h-24" />
        </div>
        <SignIn path="/" routing="path" />
    </div>
  );
}
