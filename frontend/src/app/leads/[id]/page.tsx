"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Zap,
  Target,
  FileText,
  Flame,
  CheckCheck
} from "lucide-react";
import { 
  api, 
  Lead, 
  ResearchData, 
  QualificationData, 
  EmailData, 
  ActivityLogItem 
} from "@/lib/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35 }
  }
};

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 animate-spin flex items-center justify-center p-0.5">
            <div className="w-full h-full bg-[#0b101d] rounded-[14px]"></div>
          </div>
          <Bot className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">Synthesizing Agent Workspace</p>
          <p className="text-xs text-slate-400 mt-0.5">Connecting live intelligence channels...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-12 text-center rounded-2xl border border-white/10 bg-[#0d1424]/80 backdrop-blur-xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Prospect Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">Lead ID #{leadId} does not exist in your pipeline.</p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const research = lead.latest_research;
  const qual = lead.latest_qualification;
  const emailOut = lead.latest_email;

  // Clean names to prevent AI slop placeholder
  const displayContactName = (lead.contact_name && !lead.contact_name.includes("[") && !lead.contact_name.toLowerCase().startsWith("head of operations"))
    ? lead.contact_name
    : (lead.company_name ? `${lead.company_name} Executive Team` : "Lead Decision Maker");

  return (
    <motion.div 
      className="space-y-6 pb-12 max-w-[1600px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 1. Header Toolbar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors group"
        >
          <span className="p-1 rounded-lg bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </span>
          Back to Pipeline
        </Link>

        {/* Lead Stage Pill Switcher */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 p-1.5 rounded-xl border border-white/10 shadow-inner">
          <span className="text-[11px] font-medium text-slate-400 pl-2">Stage:</span>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-[#0f172a] border border-white/10 text-xs font-semibold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
          >
            <option value="NEW">NEW LEAD</option>
            <option value="RESEARCHED">RESEARCHED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="FOLLOW_UP">FOLLOW UP</option>
            <option value="MEETING_BOOKED">MEETING BOOKED</option>
            <option value="CONVERTED">CONVERTED</option>
          </select>
        </div>
      </motion.div>

      {/* Error alert if any */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Hero Prospect Command Card */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111827]/90 via-[#0e1626]/90 to-[#131b2e]/90 p-6 backdrop-blur-2xl shadow-2xl shadow-black/40"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Company & Contact Profile */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center text-lg font-black text-white">
                {lead.company_name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {lead.company_name}
                </h1>
                {qual && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    qual.fit_category === "HIGH_FIT" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                    qual.fit_category === "MEDIUM_FIT" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                    "bg-rose-500/15 text-rose-300 border-rose-500/30"
                  }`}>
                    <Target className="w-3 h-3" />
                    {qual.fit_category.replace("_", " ")} ({qual.score}/100)
                  </span>
                )}
                {lead.industry && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                    {lead.industry}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400">
                <span className="font-semibold text-indigo-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-400" />
                  {displayContactName} ({lead.role || "Executive Target"})
                </span>
                {lead.website && (
                  <>
                    <span className="text-slate-600">•</span>
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      <Globe className="w-3 h-3" />
                      {lead.website.replace("https://", "").replace("http://", "")}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </>
                )}
                {lead.contact_email && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-300 font-mono text-[11px]">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {lead.contact_email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunFullPipeline}
              disabled={Boolean(agentActionLoading)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:from-indigo-600 hover:to-cyan-500 text-white text-xs font-bold shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {agentActionLoading === "PIPELINE" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              )}
              Run Full Agent Pipeline
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunResearch}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentActionLoading === "RESEARCH" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Bot className="w-3 h-3" />
              )}
              Research
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunQualify}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentActionLoading === "QUALIFY" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              Qualify
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunEmail}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {agentActionLoading === "EMAIL" ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Email
            </motion.button>
          </div>
        </div>

        {/* Dynamic Stepper Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: 1, title: "Lead Ingested", active: true, color: "indigo" },
            { step: 2, title: "Research Agent", active: Boolean(research), color: "cyan" },
            { step: 3, title: "ICP Qualification", active: Boolean(qual), color: "emerald" },
            { step: 4, title: "Email Campaign", active: Boolean(emailOut), color: "purple" },
          ].map((s) => (
            <div 
              key={s.step} 
              className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                s.active 
                  ? "bg-white/[0.04] border-white/15" 
                  : "bg-transparent border-white/5 opacity-50"
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                s.active 
                  ? "bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-md shadow-indigo-500/20" 
                  : "bg-slate-800 text-slate-500"
              }`}>
                {s.active ? "✓" : s.step}
              </div>
              <span className={`text-xs font-semibold ${s.active ? "text-white" : "text-slate-500"}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3. Main Workspace Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Research & Qualification (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Research Agent Intelligence */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-[#0d1424]/85 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Research Agent Intelligence
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Grounded public signals, products, and commercial footprint</p>
                </div>
              </div>

              {research ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  CONFIDENCE: {Math.round(research.confidence_score * 100)}%
                </span>
              ) : (
                <button
                  onClick={handleRunResearch}
                  disabled={Boolean(agentActionLoading)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
                >
                  Run Research →
                </button>
              )}
            </div>

            {research ? (
              <div className="space-y-4 text-xs">
                {/* Executive Summary */}
                <div>
                  <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1.5">Executive Summary</span>
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 leading-relaxed">
                    {research.summary}
                  </div>
                </div>

                {/* Company Overview */}
                <div>
                  <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1.5">Company Overview</span>
                  <p className="text-slate-300 leading-relaxed px-1">
                    {research.company_overview}
                  </p>
                </div>

                {/* Bottlenecks */}
                <div>
                  <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1.5">Detected Sales & GTM Bottlenecks</span>
                  <div className="space-y-2">
                    {research.target_pain_points.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/50 border border-white/5 text-slate-300">
                        <span className="text-rose-400 font-black mt-0.5">•</span>
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technology Stack */}
                {research.technology_stack && research.technology_stack.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1.5">Detected Technology Stack</span>
                    <div className="flex flex-wrap gap-1.5">
                      {research.technology_stack.map((tech, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-[11px] text-cyan-200 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Growth Signals */}
                {research.growth_signals && research.growth_signals.length > 0 && (
                  <div>
                    <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 block mb-1.5">Verified Market Signals</span>
                    <div className="space-y-1.5">
                      {research.growth_signals.map((sig, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-2 text-cyan-200 text-xs">
                          <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No research generated yet.</p>
              </div>
            )}
          </motion.div>

          {/* Card 2: Qualification Agent Scorecard */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-[#0d1424]/85 backdrop-blur-xl p-6 shadow-xl relative"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Qualification Agent Scorecard
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Objective Ideal Customer Profile (ICP) Rubric Evaluation</p>
                </div>
              </div>

              {qual && (
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  qual.fit_category === "HIGH_FIT" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                  qual.fit_category === "MEDIUM_FIT" ? "bg-amber-500/10 text-amber-300 border-amber-500/30" :
                  "bg-rose-500/10 text-rose-300 border-rose-500/30"
                }`}>
                  {qual.fit_category.replace("_", " ")}
                </span>
              )}
            </div>

            {qual ? (
              <div className="space-y-4">
                {/* Score & Rationale Bento Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 flex flex-col items-center justify-center shrink-0 shadow-lg">
                    <span className={`text-3xl font-black ${
                      qual.score >= 75 ? "text-emerald-400" :
                      qual.score >= 50 ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {qual.score}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">/ 100</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Recommendation:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                        {qual.recommendation || "PRIORITY_OUTREACH"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {qual.reasoning}
                    </p>
                  </div>
                </div>

                {/* Rubric Breakdown Progress Bars */}
                {qual.icp_fit_breakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: "Role Authority", val: qual.icp_fit_breakdown.role_authority || 25, max: 30 },
                      { label: "Industry Fit", val: qual.icp_fit_breakdown.industry_fit || 25, max: 30 },
                      { label: "Company Scale", val: qual.icp_fit_breakdown.company_size_fit || 20, max: 25 },
                      { label: "Urgency / Intent", val: qual.icp_fit_breakdown.urgency_and_signals || 15, max: 15 },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{item.label}</span>
                          <span className="font-mono text-slate-300 font-bold">{item.val}/{item.max}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, (item.val / item.max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Positive & Negative Signals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-emerald-950/15 border border-emerald-500/20 space-y-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5" /> Positive ICP Drivers
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {qual.positive_signals.map((pos, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{pos}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-950/15 border border-rose-500/20 space-y-2">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Risks & Disqualifiers
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
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
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Outreach Email Studio & Activity Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 3: Outreach Email Studio */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-[#0d1424]/85 backdrop-blur-xl p-6 shadow-xl relative"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Outreach Email Studio
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">Autonomous personalized cold outreach cadence</p>
                </div>
              </div>

              {emailOut && (
                <div className="flex rounded-xl bg-slate-900 p-1 border border-white/10 text-[11px]">
                  <button
                    onClick={() => setActiveEmailTab("initial")}
                    className={`relative px-3 py-1 rounded-lg transition-all ${
                      activeEmailTab === "initial"
                        ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Touch 1
                  </button>
                  <button
                    onClick={() => setActiveEmailTab("followup")}
                    className={`relative px-3 py-1 rounded-lg transition-all ${
                      activeEmailTab === "followup"
                        ? "bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30"
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
                    {/* Subject Line */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase text-slate-400">Subject</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.subject, "subject")}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          {copiedField === "subject" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-slate-200 text-xs shadow-inner">
                        {emailOut.subject}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase text-slate-400">Personalized Body</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.body, "body")}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          {copiedField === "body" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Copied Email</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Email</span>
                          )}
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200 whitespace-pre-line leading-relaxed text-xs shadow-inner">
                        {emailOut.body}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Follow Up Touch */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase text-slate-400">Follow-Up Subject (+3 Days)</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.follow_up_subject || "", "follow_subj")}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          {copiedField === "follow_subj" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-slate-200 text-xs shadow-inner">
                        {emailOut.follow_up_subject || `Follow-up re: ${lead.company_name}`}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase text-slate-400">Follow-Up Bump Body</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.follow_up_body || "", "follow_body")}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          {copiedField === "follow_body" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Follow-Up</span>
                          )}
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200 whitespace-pre-line leading-relaxed text-xs shadow-inner">
                        {emailOut.follow_up_body || "No follow-up body generated."}
                      </div>
                    </div>
                  </>
                )}

                {/* Personalization Rationale */}
                {emailOut.personalization_rationale && (
                  <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                    <span className="text-[11px] font-mono font-bold text-purple-300 block uppercase">
                      Agent Personalization Rationale
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {emailOut.personalization_rationale}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <Send className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No email draft generated yet.</p>
              </div>
            )}
          </motion.div>

          {/* Card 4: Activity & Audit Trail */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-[#0d1424]/85 backdrop-blur-xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/10">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Execution Audit Trail</h2>
                <p className="text-[11px] text-slate-400">Autonomous logs and agent state transitions</p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No activity logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs space-y-1">
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
                        <span className="truncate max-w-[200px]">Subj: {act.details.subject}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
