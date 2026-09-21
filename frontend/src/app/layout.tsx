import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BackendWarmer from "@/components/BackendWarmer";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Nexus AI SDR — Autonomous Multi-Agent Sales Platform",
  description: "Autonomous Sales Development Representative powered by cooperating Research, Qualification, and Email agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const layout = (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen flex flex-col bg-black text-zinc-100 antialiased selection:bg-white selection:text-black">
        <BackendWarmer />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );

  if (clerkPubKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        {layout}
      </ClerkProvider>
    );
  }

  return layout;
}
