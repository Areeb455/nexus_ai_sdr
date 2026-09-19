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
    { label: "Stripe", domain: "stripe.com" },
    { label: "Linear", domain: "linear.app" },
    { label: "Figma", domain: "figma.com" },
    { label: "Datadog", domain: "datadoghq.com" },
  ];

  const stepsList = [
    { title: "Crawling Live Web Presence", desc: "Extracting telemetry, verified public signals & business model" },
    { title: "Synthesizing Buyer Persona", desc: "Identifying executive buyer & contact role" },
    { title: "Research Agent Intelligence", desc: "Extracting verified operational bottlenecks & tech stack" },
    { title: "Qualification Fit Assessment", desc: "Evaluating ICP rubric score (0-100) & recommendation" },
    { title: "Email Studio Generation", desc: "Drafting personalized cold outreach & follow-up sequence" },
  ];

  const handleHunt = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setStep(0);

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
        if (createdLead?.id) {
          router.push(`/leads/${createdLead.id}`);
        }
      }, 700);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      setError(err.message || "Prospecting failed. Please verify domain or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl ${inline ? "" : "mb-8"}`}>
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.12] flex items-center justify-center text-white shadow-inner shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                Autonomous AI Prospector
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08]">
                  LIVE AGENTS
                </span>
              </h2>
              <p className="text-xs text-zinc-500 font-sans">
                Input any target company. Agents crawl live intelligence, synthesize buyer personas, qualify ICP fit, and craft personalized emails.
              </p>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Globe className="w-4 h-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) handleHunt();
              }}
              disabled={loading}
              placeholder="Enter domain or company (e.g. stripe.com, figma.com, linear.app, thinklude.com)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#060608] border border-white/[0.08] text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <button
            onClick={() => handleHunt()}
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Prospecting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Autonomous Hunt</span>
                <ArrowRight className="w-3.5 h-3.5 text-black" />
              </>
            )}
          </button>
        </div>

        {/* 1-Click Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="text-[11px] font-mono text-zinc-500">PRESETS:</span>
          {presets.map((preset) => (
            <button
              key={preset.domain}
              onClick={() => {
                setQuery(preset.domain);
                handleHunt(preset.domain);
              }}
              disabled={loading}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/[0.18] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="text-zinc-300 font-medium">{preset.label}</span>
              <span className="text-zinc-600">({preset.domain})</span>
            </button>
          ))}
        </div>

        {/* Live Multi-Agent Execution Progress */}
        {loading && (
          <div className="mt-3 p-4 rounded-xl bg-black border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300 border-b border-white/[0.06] pb-2">
              <span className="flex items-center gap-2 text-white">
                <Bot className="w-3.5 h-3.5 animate-pulse text-zinc-400" />
                Multi-Agent Autonomous Orchestrator
              </span>
              <span className="text-zinc-500">Step {Math.min(step + 1, 5)} / 5</span>
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
                        ? "text-zinc-300"
                        : isCurrent
                        ? "text-white font-medium"
                        : "text-zinc-600 opacity-50"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-mono text-zinc-600">
                        {i + 1}
                      </div>
                    )}
                    <div>
                      <span className={isCurrent ? "text-white font-mono" : "font-mono"}>{st.title}</span>
                      <p className="text-[11px] text-zinc-500 font-sans">{st.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
