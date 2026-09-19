"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Settings as SettingsIcon, 
  Cpu, 
  Database, 
  Sliders, 
  Server,
  ArrowLeft,
  CheckCircle2,
  Sparkles
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
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>BACK TO DASHBOARD</span>
        </Link>
        <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM TELEMETRY & ICP RULES
        </span>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 sm:p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-8">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-white" />
            Platform Architecture & Rules
          </h1>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Real-time backend service telemetry, persistence layer, and qualification rubric.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* System Health Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span>CORE SERVICE</span>
            </div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI Engine Online
            </div>
            <p className="text-[11px] text-zinc-600 font-mono">Port 8000 · JWT Guard Active</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span>STORAGE PERSISTENCE</span>
            </div>
            <div className="text-sm font-semibold text-white">
              {status?.database_dialect ? status.database_dialect.toUpperCase() : "POSTGRESQL"}
            </div>
            <p className="text-[11px] text-zinc-600 font-mono">SQLAlchemy Relational Schema</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-1.5 shadow-inner">
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>ACTIVE AI REASONING</span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {status?.active_ai_provider ? (
                status.active_ai_provider.includes("gemini-3.6-flash")
                  ? "Gemini 3.6 Flash"
                  : status.active_ai_provider
              ) : "Gemini 3.6 Flash (Studio)"}
            </div>
            <p className="text-[11px] text-zinc-600 font-mono">High-Reasoning Telemetry</p>
          </div>
        </div>

        {/* ICP Qualification Rubric Rules */}
        <div className="space-y-4 pt-4 border-t border-white/[0.06]">
          <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            CONFIGURED IDEAL CUSTOMER PROFILE (ICP) RUBRIC
          </h2>

          <div className="p-5 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-4 text-xs shadow-inner">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">TARGET VERTICALS & INDUSTRIES</span>
              <div className="flex flex-wrap gap-1.5">
                {["B2B SaaS", "Enterprise Software", "Fintech / Payments", "Cloud & Data Infrastructure", "AI & Developer Tools"].map((ind, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.08] text-zinc-300 font-mono text-[11px]">
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">TARGET DECISION MAKER ROLES</span>
              <div className="flex flex-wrap gap-1.5">
                {["VP of Sales", "Head of RevOps", "Chief Revenue Officer (CRO)", "Chief Commercial Officer (CCO)", "Director of SDRs", "Growth Founders"].map((role, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.08] text-zinc-300 font-mono text-[11px]">
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-emerald-500/20 text-center space-y-1">
                <span className="font-mono font-bold text-emerald-400 text-xs block">HIGH FIT</span>
                <span className="text-[11px] font-mono text-zinc-300">Score 75 – 100</span>
                <span className="text-[10px] font-mono text-zinc-500 block">Direct High-Touch Outreach</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-amber-500/20 text-center space-y-1">
                <span className="font-mono font-bold text-amber-400 text-xs block">MEDIUM FIT</span>
                <span className="text-[11px] font-mono text-zinc-300">Score 50 – 74</span>
                <span className="text-[10px] font-mono text-zinc-500 block">Targeted Nurture Cadence</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-center space-y-1">
                <span className="font-mono font-bold text-zinc-400 text-xs block">LOW FIT</span>
                <span className="text-[11px] font-mono text-zinc-300">Score 0 – 49</span>
                <span className="text-[10px] font-mono text-zinc-500 block">Disqualify / Do Not Send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
