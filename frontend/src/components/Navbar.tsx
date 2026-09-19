"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bot, 
  BarChart3, 
  UserPlus, 
  Settings, 
  LogOut, 
  Sparkles
} from "lucide-react";
import { api, setStoredToken } from "@/lib/api";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>("Multi-Agent Core");

  useEffect(() => {
    if (clerkUser?.primaryEmailAddress?.emailAddress) {
      setUserEmail(clerkUser.primaryEmailAddress.emailAddress);
    }
  }, [clerkUser]);

  useEffect(() => {
    if (pathname === "/login") return;

    api.auth.getMe()
      .then((user) => setUserEmail(user.email))
      .catch(() => {
        setUserEmail("demo@nexus.ai");
      });

    api.settings.getStatus()
      .then((s) => {
        if (s.active_ai_provider) {
          // Format neatly if it's long
          const p = s.active_ai_provider;
          if (p.includes("gemini-3.6-flash")) {
            setActiveProvider("Gemini 3.6 Flash (Studio)");
          } else if (p.includes("gemini")) {
            setActiveProvider("Gemini Flash");
          } else {
            setActiveProvider(p);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    setStoredToken(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.12] flex items-center justify-center text-white shadow-inner group-hover:border-white/30 transition-all duration-300">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-white">
                NEXUS <span className="text-zinc-500 font-light">SDR</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Autonomous</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                pathname === "/dashboard"
                  ? "bg-zinc-900 text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
              Dashboard
            </Link>

            <Link
              href="/leads/new"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                pathname === "/leads/new"
                  ? "bg-zinc-900 text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
              New Prospect
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                pathname === "/settings"
                  ? "bg-zinc-900 text-white border border-white/[0.1] shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Right Status & Account */}
        <div className="flex items-center gap-3">
          {/* AI Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/[0.08] text-[11px] font-mono text-zinc-300 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="truncate max-w-[200px]">{activeProvider}</span>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
            {isClerkSignedIn ? (
              <UserButton />
            ) : (
              <>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-zinc-200">{userEmail || "demo@nexus.ai"}</span>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end font-mono">
                    ONLINE
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
