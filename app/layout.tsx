
/*
--- 3. File: app/layout.tsx ---
This is the root layout. It has been updated to hide social login buttons.
*/

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css"; // Make sure you have a globals.css file

export const metadata: Metadata = {
  title: "Licor Cloud Weather Dashboard",
  description: "Login to view the dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{
        elements: {
            formButtonPrimary: 'bg-red-600 hover:bg-red-700',
            footerActionLink: 'text-red-600 hover:text-red-700',
            socialButtonsBlockButton: { display: 'none' } // This hides the social login buttons
        }
    }}>
      <html lang="en">
        <body>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

