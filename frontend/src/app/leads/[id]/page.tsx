"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Globe, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  Send, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu
} from "lucide-react";
import { 
  api, 
  Lead, 
  ResearchData, 
  QualificationData, 
  EmailData, 
  ActivityLogItem 
} from "@/lib/api";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentActionLoading, setAgentActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeEmailTab, setActiveEmailTab] = useState<"initial" | "followup">("initial");

  const fetchLeadData = async () => {
    try {
      const [l, act] = await Promise.all([
        api.leads.get(leadId),
        api.activity.getLeadActivity(leadId),
      ]);
      setLead(l);
      setActivities(act);
    } catch (err: any) {
      setError(err.message || "Failed to load lead profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("nexus_auth_token")) {
      router.push("/login");
      return;
    }
    fetchLeadData();
  }, [leadId, router]);

  // Agent execution handlers
  const handleRunResearch = async () => {
    setAgentActionLoading("RESEARCH");
    setError(null);
    try {
      await api.agents.runResearch(leadId);
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Research Agent encountered an issue.");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRunQualify = async () => {
    setAgentActionLoading("QUALIFY");
    setError(null);
    try {
      await api.agents.runQualify(leadId);
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Qualification Agent encountered an issue.");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRunEmail = async () => {
    setAgentActionLoading("EMAIL");
    setError(null);
    try {
      await api.agents.runEmail(leadId);
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Email Agent encountered an issue.");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRunFullPipeline = async () => {
    setAgentActionLoading("PIPELINE");
    setError(null);
    try {
      await api.agents.runPipeline(leadId);
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Multi-Agent Pipeline execution failed.");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.leads.update(leadId, { status: newStatus });
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading prospect workspace...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-12 text-center glass-panel">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Prospect not found</h2>
        <p className="text-xs text-slate-400 mt-1">Lead ID {leadId} does not exist.</p>
        <Link href="/dashboard" className="inline-block mt-4 text-xs font-semibold text-indigo-400">
          ← Return to Dashboard
        </Link>
      </div>
    );
  }

  const research = lead.latest_research;
  const qual = lead.latest_qualification;
  const emailOut = lead.latest_email;

  // Compute active step in stepper
  let currentStep = 1;
  if (emailOut) currentStep = 4;
  else if (qual) currentStep = 3;
  else if (research) currentStep = 2;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline Dashboard
        </Link>

        {/* Lead Status Changer */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Pipeline Stage:</span>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-xs font-semibold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="NEW">NEW LEAD</option>
            <option value="RESEARCHED">RESEARCHED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="FOLLOW_UP">FOLLOW UP</option>
            <option value="MEETING_BOOKED">MEETING BOOKED</option>
            <option value="CONVERTED">CONVERTED</option>
            <option value="NOT_INTERESTED">NOT INTERESTED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Prospect Header Card */}
      <div className="glass-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center text-lg font-bold text-indigo-300">
                {lead.contact_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {lead.contact_name}
                </h1>
                {qual && (
                  <span className={`badge ${
                    qual.fit_category === "HIGH_FIT" ? "badge-high" :
                    qual.fit_category === "MEDIUM_FIT" ? "badge-med" : "badge-low"
                  }`}>
                    {qual.fit_category.replace("_", " ")} ({qual.score}/100)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1 text-xs text-slate-300">
                <span className="font-medium text-indigo-300">{lead.role || "Executive"}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {lead.company_name}
                </span>
                {lead.website && (
                  <>
                    <span className="text-slate-600">•</span>
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-cyan-400 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {lead.website.replace("https://", "").replace("http://", "")}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </>
                )}
                {lead.contact_email && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      {lead.contact_email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
            <button
              onClick={handleRunFullPipeline}
              disabled={Boolean(agentActionLoading)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50 group"
            >
              {agentActionLoading === "PIPELINE" ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
              )}
              Run Full Agent Pipeline
            </button>

            <button
              onClick={handleRunResearch}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentActionLoading === "RESEARCH" ? (
                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
              Research
            </button>

            <button
              onClick={handleRunQualify}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentActionLoading === "QUALIFY" ? (
                <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Qualify
            </button>

            <button
              onClick={handleRunEmail}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentActionLoading === "EMAIL" ? (
                <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Generate Email
            </button>
          </div>
        </div>

        {/* Workflow Progress Stepper */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {/* Step 1: Created */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500 text-indigo-300 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="font-semibold text-slate-200">1. Lead Created</span>
            </div>

            {/* Step 2: Researched */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                research
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300"
                  : "bg-slate-800 border border-slate-700 text-slate-500"
              }`}>
                {research ? "✓" : "2"}
              </div>
              <span className={`font-semibold ${research ? "text-cyan-300" : "text-slate-500"}`}>
                2. Research Agent
              </span>
            </div>

            {/* Step 3: Qualified */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                qual
                  ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300"
                  : "bg-slate-800 border border-slate-700 text-slate-500"
              }`}>
                {qual ? "✓" : "3"}
              </div>
              <span className={`font-semibold ${qual ? "text-emerald-300" : "text-slate-500"}`}>
                3. Qualification
              </span>
            </div>

            {/* Step 4: Email Ready */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                emailOut
                  ? "bg-purple-500/20 border border-purple-400 text-purple-300"
                  : "bg-slate-800 border border-slate-700 text-slate-500"
              }`}>
                {emailOut ? "✓" : "4"}
              </div>
              <span className={`font-semibold ${emailOut ? "text-purple-300" : "text-slate-500"}`}>
                4. Email Campaign
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Agent Workspace: 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Research & Qualification (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Panel 1: Research Agent Output */}
          <div className="glass-panel p-6 agent-research-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Research Agent Intelligence</h2>
                  <p className="text-[11px] text-slate-400">Public metadata, web signals, and sales context</p>
                </div>
              </div>

              {research ? (
                <span className="badge badge-status-researched">
                  Confidence: {Math.round(research.confidence_score * 100)}%
                </span>
              ) : (
                <button
                  onClick={handleRunResearch}
                  disabled={Boolean(agentActionLoading)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold"
                >
                  Run Research →
                </button>
              )}
            </div>

            {research ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Executive Summary</span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-white/5">
                    {research.summary}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-300 block mb-1">Company Overview</span>
                  <p className="text-slate-400 leading-relaxed">
                    {research.company_overview}
                  </p>
                </div>

                {/* Pain Points */}
                <div>
                  <span className="font-semibold text-slate-300 block mb-1.5">Detected Sales & Operational Bottlenecks</span>
                  <div className="space-y-1.5">
                    {research.target_pain_points.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300 bg-slate-900/40 p-2 rounded border border-white/5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack Detected */}
                {research.technology_stack && research.technology_stack.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-300 block mb-1.5">Detected Technology Stack</span>
                    <div className="flex flex-wrap gap-1.5">
                      {research.technology_stack.map((tech, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Growth Signals & Verified Market Metrics */}
                {research.growth_signals && research.growth_signals.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-300 block mb-1.5">Verified Market Signals & Quantitative Metrics</span>
                    <div className="space-y-1.5">
                      {research.growth_signals.map((sig, idx) => {
                        const isMetric = sig.includes("$") || sig.includes("ARR") || sig.includes("Valuation") || sig.includes("employees") || sig.includes("funding") || sig.includes("Registry");
                        return (
                          <div key={idx} className={`p-2.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                            isMetric 
                              ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-200" 
                              : "bg-slate-900/40 border-white/5 text-slate-400"
                          }`}>
                            <TrendingUp className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isMetric ? "text-cyan-400" : "text-slate-500"}`} />
                            <span className="leading-relaxed">{sig}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {research.sources && research.sources.length > 0 && (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Sources: {research.sources.join(" · ")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No research intelligence generated yet.</p>
                <button
                  onClick={handleRunResearch}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium"
                >
                  Run Research Agent
                </button>
              </div>
            )}
          </div>

          {/* Panel 2: Qualification Agent Scorecard */}
          <div className="glass-panel p-6 agent-qual-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Qualification Agent Scorecard</h2>
                  <p className="text-[11px] text-slate-400">Ideal Customer Profile (ICP) Fit Analysis</p>
                </div>
              </div>

              {qual ? (
                <span className={`badge ${
                  qual.fit_category === "HIGH_FIT" ? "badge-high" :
                  qual.fit_category === "MEDIUM_FIT" ? "badge-med" : "badge-low"
                }`}>
                  {qual.fit_category.replace("_", " ")}
                </span>
              ) : (
                <button
                  onClick={handleRunQualify}
                  disabled={Boolean(agentActionLoading)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold"
                >
                  Qualify Lead →
                </button>
              )}
            </div>

            {qual ? (
              <div className="space-y-4">
                {/* Score Gauge & Recommendation */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/80 border border-white/5">
                  <div className="flex flex-col items-center justify-center w-20 h-20 rounded-xl bg-slate-950 border border-white/10 text-center">
                    <span className={`text-3xl font-black ${
                      qual.score >= 75 ? "text-emerald-400" :
                      qual.score >= 50 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {qual.score}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">/ 100</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">Action Recommendation:</span>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        {qual.recommendation || (qual.score >= 75 ? "PRIORITY_OUTREACH" : "TARGETED_NURTURE")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {qual.reasoning}
                    </p>
                  </div>
                </div>

                {/* Breakdown dimensions */}
                {qual.icp_fit_breakdown && (
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-2">ICP Rubric Breakdown</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-slate-400 block">Role Fit</span>
                        <span className="text-sm font-bold text-slate-200">
                          {qual.icp_fit_breakdown.role_authority || 25}/30
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-slate-400 block">Industry Fit</span>
                        <span className="text-sm font-bold text-slate-200">
                          {qual.icp_fit_breakdown.industry_fit || 25}/30
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-slate-400 block">Company Scale</span>
                        <span className="text-sm font-bold text-slate-200">
                          {qual.icp_fit_breakdown.company_size_fit || 20}/25
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5 text-center">
                        <span className="text-[10px] text-slate-400 block">Signals/Intent</span>
                        <span className="text-sm font-bold text-slate-200">
                          {qual.icp_fit_breakdown.urgency_and_signals || 15}/15
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Positive & Negative Signals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Positive */}
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Key Positive Signals
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {qual.positive_signals.map((pos, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{pos}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Negative */}
                  <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                    <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Risks & Negative Signals
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {qual.negative_signals.map((neg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-400">✕</span>
                          <span>{neg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>Lead has not been qualified yet.</p>
                <button
                  onClick={handleRunQualify}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  Run Qualification Agent
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Email Studio & Activity Trail (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Panel 3: Email Agent Outreach Studio */}
          <div className="glass-panel p-6 agent-email-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Outreach Email Studio</h2>
                  <p className="text-[11px] text-slate-400">Hyper-personalized cold outreach & follow-up</p>
                </div>
              </div>

              {emailOut && (
                <div className="flex rounded bg-slate-900 p-0.5 border border-white/5 text-[11px]">
                  <button
                    onClick={() => setActiveEmailTab("initial")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeEmailTab === "initial"
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Touch 1
                  </button>
                  <button
                    onClick={() => setActiveEmailTab("followup")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeEmailTab === "followup"
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Touch 2 (+3d)
                  </button>
                </div>
              )}
            </div>

            {emailOut ? (
              <div className="space-y-4 text-xs">
                {activeEmailTab === "initial" ? (
                  <>
                    {/* Subject */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-400">Subject:</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.subject, "subject")}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {copiedField === "subject" ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-slate-200 text-xs">
                        {emailOut.subject}
                      </div>
                    </div>

                    {/* Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-400">Personalized Body:</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.body, "body")}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {copiedField === "body" ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Email
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-white/10 text-slate-200 whitespace-pre-line leading-relaxed font-sans text-xs">
                        {emailOut.body}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Follow up */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-400">Follow-Up Subject (+3 Days):</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.follow_up_subject || "", "follow_subj")}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {copiedField === "follow_subj" ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-slate-200 text-xs">
                        {emailOut.follow_up_subject || `Follow-up re: ${lead.company_name}`}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-400">Follow-Up Bump Copy:</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.follow_up_body || "", "follow_body")}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {copiedField === "follow_body" ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Follow-Up
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-900/90 border border-white/10 text-slate-200 whitespace-pre-line leading-relaxed font-sans text-xs">
                        {emailOut.follow_up_body || "No follow-up body generated."}
                      </div>
                    </div>
                  </>
                )}

                {/* Personalization Rationale */}
                {emailOut.personalization_rationale && (
                  <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/20">
                    <span className="font-semibold text-purple-300 block mb-1 text-[11px]">
                      Agent Personalization Rationale:
                    </span>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      {emailOut.personalization_rationale}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Send className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No personalized email generated yet.</p>
                <button
                  onClick={handleRunEmail}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                >
                  Generate Personalized Email
                </button>
              </div>
            )}
          </div>

          {/* Panel 4: Activity & Audit Trail */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Activity & Audit Trail</h2>
                <p className="text-[11px] text-slate-400">Chronological history of agent runs and status changes</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No activity logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 font-mono text-[11px]">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                        {act.agent_name || "SYSTEM"}
                      </span>
                      {act.details?.score !== undefined && (
                        <span>Score: <b>{act.details.score}</b></span>
                      )}
                      {act.details?.subject && (
                        <span className="truncate max-w-[180px]">Subj: {act.details.subject}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
