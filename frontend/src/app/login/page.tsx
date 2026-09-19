"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
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

  // Initialize Google Identity Services
  useEffect(() => {
    // Check if OAuth id_token is in URL hash (from OAuth redirect)
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const idToken = params.get("id_token");
      if (idToken) {
        setLoading(true);
        api.auth.googleLogin(idToken)
          .then((res) => {
            setStoredToken(res.access_token);
            router.push("/dashboard");
          })
          .catch((err) => setError(err.message || "Google authentication failed."))
          .finally(() => setLoading(false));
      }
    }
  }, [router]);

  const initGoogleGIS = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1036495570857-google-client-id-sample.apps.googleusercontent.com";
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setLoading(true);
            setError(null);
            try {
              const res = await api.auth.googleLogin(response.credential);
              setStoredToken(res.access_token);
              router.push("/dashboard");
            } catch (err: any) {
              setError(err.message || "Google authentication failed.");
            } finally {
              setLoading(false);
            }
          }
        },
      });
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1036495570857-google-client-id-sample.apps.googleusercontent.com";
    
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to Google OAuth 2.0 authorization code / token flow
          const redirectUri = window.location.origin + "/login";
          const scope = "email profile openid";
          const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${encodeURIComponent(scope)}&nonce=${Math.random().toString(36).substring(2)}`;
          window.location.href = oauthUrl;
        }
      });
    } else {
      // Direct OAuth redirect
      const redirectUri = window.location.origin + "/login";
      const scope = "email profile openid";
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${encodeURIComponent(scope)}&nonce=${Math.random().toString(36).substring(2)}`;
      window.location.href = oauthUrl;
    }
  };

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
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleGIS}
      />

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
            {/* Real Google Sign-In Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 border border-slate-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative my-6 flex items-center justify-center">
                <div className="border-t border-white/10 w-full"></div>
                <span className="bg-[#0b0f19] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                  Or continue with email
                </span>
              </div>
            </div>

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
            </div>
          </div>

          {/* Security badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Protected with Google OAuth 2.0 & JWT Security</span>
          </div>
        </div>
      </div>
    </>
  );
}
