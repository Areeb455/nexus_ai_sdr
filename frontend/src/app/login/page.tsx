"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck } from "lucide-react";
import { api, setStoredToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.auth.register({
          email,
          password,
          full_name: fullName,
        });
      } else {
        res = await api.auth.login({ email, password });
      }

      setStoredToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login({
        email: "demo@nexus.ai",
        password: "password123",
      });
      setStoredToken(res.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      // If demo user doesn't exist yet, we can register it on the fly
      try {
        const regRes = await api.auth.register({
          email: "demo@nexus.ai",
          password: "password123",
          full_name: "Alex Rivera (Demo SDR)",
        });
        setStoredToken(regRes.access_token);
        router.push("/dashboard");
      } catch (regErr: any) {
        setError("Could not auto-login to demo account. Please ensure backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/25 mb-4">
            <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
              <Bot className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            NEXUS AI SDR
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Autonomous Multi-Agent Sales Intelligence & Qualification Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-slate-900/80 p-1 mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                !isRegister
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                isRegister
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rep@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/60 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? "Register & Enter Dashboard" : "Sign In to Dashboard"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Divider */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/30 text-xs font-medium text-indigo-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              1-Click Demo Evaluation Sign In (demo@nexus.ai)
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Evaluator shortcut: instantly logs in with pre-seeded demo prospects.
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Protected with JWT Authentication & Argon2/Bcrypt Security</span>
        </div>
      </div>
    </div>
  );
}
