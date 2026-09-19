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
  Sparkles,
  Layers,
  Zap
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
    // Only load if not on login page
    if (pathname === "/login") return;

    api.auth.getMe()
      .then((user) => setUserEmail(user.email))
      .catch(() => {
        // Fallback for visual display
        setUserEmail("demo@nexus.ai");
      });

    api.settings.getStatus()
      .then((s) => {
        if (s.active_ai_provider) {
          setActiveProvider(s.active_ai_provider);
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090d16]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                NEXUS <span className="text-indigo-400 font-medium text-sm">AI SDR</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono -mt-1 tracking-wider uppercase">Autonomous Sales Agent</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-4">
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Dashboard
            </Link>

            <Link
              href="/leads/new"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/leads/new"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <UserPlus className="w-4 h-4 text-cyan-400" />
              New Prospect
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings className="w-4 h-4 text-purple-400" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Right Status & Account */}
        <div className="flex items-center gap-3">
          {/* AI Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/25 text-xs text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="truncate max-w-[200px]">{activeProvider}</span>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {isClerkSignedIn ? (
              <UserButton />
            ) : (
              <>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200">{userEmail || "demo@nexus.ai"}</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
