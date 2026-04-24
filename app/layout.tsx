import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubSite – Practice Subscription App",
  description: "A practice subscription website built with Next.js, Supabase, and Stripe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
