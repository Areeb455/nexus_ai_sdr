"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  Key, 
  Sliders, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Server,
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.settings.getStatus()
      .then((data) => setStatus(data))
      .catch((err) => setError(err.message || "Failed to reach backend API"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline Dashboard
        </Link>
        <span className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          System Health & Intelligence Config
        </span>
      </div>

      <div className="glass-panel p-8 space-y-8">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            Platform Architecture & Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System status, AI provider integrations, database persistence, and ICP criteria.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* System Health Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Core Service</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Core API Online
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Port 8000 · JWT Guard Active</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Storage Persistence</span>
            </div>
            <div className="text-sm font-bold text-white">
              {status?.database_dialect ? status.database_dialect.toUpperCase() : "SQLAlchemy ORM"}
            </div>
            <p className="text-[11px] text-slate-500">PostgreSQL Schema / Zero-Config Engine</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Active AI Engine</span>
            </div>
            <div className="text-sm font-bold text-indigo-300 truncate">
              {status?.active_ai_provider || "Nexus Multi-Agent Core"}
            </div>
            <p className="text-[11px] text-slate-500">Google Gemini & OpenAI Compatible</p>
          </div>
        </div>

        {/* AI Provider Configuration Section */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            AI Provider Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Google Gemini 1.5 API</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  status?.gemini_configured
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {status?.gemini_configured ? "CONFIGURED" : "FALLBACK AVAILABLE"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                To connect live Gemini Flash/Pro, set <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code> in <code className="text-slate-300">backend/.env</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">OpenAI GPT-4o-mini API</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  status?.openai_configured
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {status?.openai_configured ? "CONFIGURED" : "FALLBACK AVAILABLE"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                To connect OpenAI GPT-4o, set <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded text-[11px]">OPENAI_API_KEY</code> in <code className="text-slate-300">backend/.env</code>.
              </p>
            </div>
          </div>
        </div>

        {/* ICP Qualification Rubric Rules */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Configured Ideal Customer Profile (ICP) Rules
          </h2>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-300 block mb-1">Target Verticals & Industries</span>
              <div className="flex flex-wrap gap-1.5">
                {["B2B SaaS", "Enterprise Software", "Fintech / Payments", "Cloud & Data Infrastructure", "AI & Developer Tools"].map((ind, i) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-300 block mb-1">Target Decision Maker Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {["VP of Sales", "Head of RevOps", "Chief Revenue Officer (CRO)", "Chief Commercial Officer (CCO)", "Director of SDRs", "Growth Founders"].map((role, i) => (
                  <span key={i} className="px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px]">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/20 text-center">
                <span className="font-bold text-emerald-400 text-xs block">HIGH FIT</span>
                <span className="text-[11px] text-slate-300">Score 75 - 100</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Direct High-Touch Outreach</span>
              </div>
              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-500/20 text-center">
                <span className="font-bold text-amber-400 text-xs block">MEDIUM FIT</span>
                <span className="text-[11px] text-slate-300">Score 50 - 74</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Targeted Nurture Cadence</span>
              </div>
              <div className="p-2.5 rounded bg-rose-950/20 border border-rose-500/20 text-center">
                <span className="font-bold text-rose-400 text-xs block">LOW FIT</span>
                <span className="text-[11px] text-slate-300">Score 0 - 49</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Disqualify / Do Not Send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
