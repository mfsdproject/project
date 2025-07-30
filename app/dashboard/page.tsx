
/*
--- 5. File: app/dashboard/page.tsx ---
This is the main dashboard page, which is protected.
It includes the header with the UserButton and renders your dashboard component.
*/
import Dashboard from "@/components/Dashboard";
import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <div>
      <header className="p-4 bg-white shadow-md flex justify-between items-center sticky top-0 z-50">
         <img src="/mlmlogo.png" alt="Logo" className="h-12 sm:h-16" />
         <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
         </div>
      </header>
      <Dashboard />
    </div>
  );
}

