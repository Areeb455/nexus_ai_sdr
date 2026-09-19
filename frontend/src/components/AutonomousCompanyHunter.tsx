"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Globe, 
  ArrowRight, 
  Loader2, 
  Bot, 
  CheckCircle2, 
  Building2, 
  Target, 
  Mail,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  onSuccess?: () => void;
  inline?: boolean;
}

export default function AutonomousCompanyHunter({ onSuccess, inline = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [autoRun, setAutoRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: "Stripe", domain: "stripe.com", desc: "Fintech & Payments Infrastructure" },
    { label: "Linear", domain: "linear.app", desc: "Issue Tracking & Dev Tooling" },
    { label: "Figma", domain: "figma.com", desc: "Collaborative Design Platform" },
    { label: "Datadog", domain: "datadoghq.com", desc: "Cloud Monitoring & Security" },
  ];

  const stepsList = [
    { title: "Crawling Live Web Presence", desc: "Inspecting domain metadata, business model, and public signals" },
    { title: "Synthesizing ICP Target Persona", desc: "Identifying executive buyer (VP Sales / RevOps) & corporate contact" },
    { title: "Research Agent Deep-Dive", desc: "Extracting 3-4 sales pain points, tech stack, and growth signals" },
    { title: "Qualification Agent Fit Scoring", desc: "Evaluating ICP score (0-100), categorization, and reasoning" },
    { title: "Email Agent Outreach Crafting", desc: "Drafting personalized cold outreach, follow-up, and rationale" },
  ];

  const handleHunt = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setStep(0);

    // Simulate step progress while LLM is generating
    const timer1 = setTimeout(() => setStep(1), 1500);
    const timer2 = setTimeout(() => setStep(2), 3500);
    const timer3 = setTimeout(() => setStep(3), 6000);
    const timer4 = setTimeout(() => setStep(4), 9000);

    try {
      const createdLead = await api.leads.autonomousHunt(q, autoRun);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setStep(5);

      setTimeout(() => {
        if (onSuccess) onSuccess();
        router.push(`/leads/${createdLead.id}`);
      }, 800);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setError(err.message || "Autonomous prospecting encountered an error. Please verify the domain or try again.");
      setLoading(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-[#10172a]/95 via-[#0b1120]/95 to-[#131b2e]/95 p-6 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 ${inline ? "" : "mb-8"}`}>
      {/* Decorative ambient glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Autonomous AI SDR Company Prospector
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wide">
                  Live Agents
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Input any target company or website. Cooperating agents crawl public intelligence, synthesize buyer personas, qualify ICP fit, and craft personalized outreach.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleHunt();
              }}
              disabled={loading}
              placeholder="Enter company website or name (e.g. stripe.com, figma.com, linear.app, databricks.com)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          <button
            onClick={() => handleHunt()}
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Extracting & Prospecting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Autonomous SDR Hunt</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 1-Click Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 font-medium">Quick 1-Click Targets:</span>
          {presets.map((preset) => (
            <button
              key={preset.domain}
              onClick={() => {
                setQuery(preset.domain);
                handleHunt(preset.domain);
              }}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {preset.label}
              <span className="text-[10px] text-slate-500">({preset.domain})</span>
            </button>
          ))}
        </div>

        {/* Live Multi-Agent Execution Progress Overlay */}
        {loading && (
          <div className="mt-4 p-4 rounded-xl bg-black/60 border border-indigo-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-white/10 pb-2">
              <span className="flex items-center gap-2 text-indigo-400">
                <Bot className="w-4 h-4 animate-pulse" />
                Multi-Agent Cooperating Orchestrator in Action
              </span>
              <span className="font-mono text-cyan-400">Step {Math.min(step + 1, 5)} of 5</span>
            </div>

            <div className="space-y-2">
              {stepsList.map((st, i) => {
                const isCompleted = step > i;
                const isCurrent = step === i;
                return (
                  <div
                    key={st.title}
                    className={`flex items-start gap-2.5 text-xs transition-opacity ${
                      isCompleted
                        ? "text-slate-300"
                        : isCurrent
                        ? "text-white font-medium"
                        : "text-slate-500 opacity-60"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0 mt-0.5 flex items-center justify-center text-[9px] text-slate-500">
                        {i + 1}
                      </div>
                    )}
                    <div>
                      <span className={isCurrent ? "text-cyan-300" : ""}>{st.title}</span>
                      <p className="text-[11px] text-slate-400">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
