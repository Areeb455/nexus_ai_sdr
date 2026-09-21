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
  Activity, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Target,
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
import CompanyLogo from "@/components/CompanyLogo";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = Number(params?.id);

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentActionLoading, setAgentActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeEmailTab, setActiveEmailTab] = useState<"initial" | "followup">("initial");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);

  const fetchLeadData = async () => {
    if (isNaN(leadId)) return;
    try {
      const data = await api.leads.get(leadId);
      setLead(data);
      const acts = await api.activity.getLeadActivity(leadId);
      setActivities(acts);
    } catch (err: any) {
      setError(err.message || "Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  const handleRunResearch = async () => {
    setAgentActionLoading("RESEARCH");
    setError(null);
    try {
      await api.agents.runResearch(leadId);
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Research Agent failed to execute");
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
      setError(err.message || "Qualification Agent failed to execute");
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
      setError(err.message || "Email Generation Agent failed to execute");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleRunFullPipeline = async () => {
    setAgentActionLoading("PIPELINE");
    setError(null);
    try {
      await api.agents.streamPipeline(leadId, {
        onResearch: (resData) => {
          setLead(prev => prev ? {
            ...prev,
            latest_research: resData,
            status: prev.status === "NEW" ? "RESEARCHED" : prev.status
          } : null);
        },
        onQual: (qualData) => {
          setLead(prev => prev ? {
            ...prev,
            latest_qualification: qualData,
            status: qualData.score >= 50 ? "QUALIFIED" : "DISQUALIFIED"
          } : null);
        },
        onEmail: (emailData) => {
          setLead(prev => prev ? {
            ...prev,
            latest_email: emailData
          } : null);
        },
        onComplete: async () => {
          await fetchLeadData();
        },
        onError: (errMsg) => {
          setError(errMsg);
        }
      });
      await fetchLeadData();
    } catch (err: any) {
      setError(err.message || "Autonomous Agent Pipeline failed to execute");
    } finally {
      setAgentActionLoading(null);
    }
  };

  const handleSendEmailNow = async (mode: "gmail" | "mailto" = "gmail") => {
    if (!lead?.latest_email) return;
    setSendingEmail(true);
    setError(null);

    const emailOut = lead.latest_email;
    const recipient = lead.contact_email || "";
    
    // Choose active draft (Touch 1 or Touch 2)
    const currentSubject = activeEmailTab === "initial"
      ? (emailOut.subject || `Inquiry for ${lead.company_name}`)
      : (emailOut.follow_up_subject || `Quick follow-up re: ${lead.company_name}`);

    const currentBody = activeEmailTab === "initial"
      ? (emailOut.body || "")
      : (emailOut.follow_up_body || emailOut.body || "");

    // 1. Redirect to email client with drafted text pre-filled
    if (mode === "gmail") {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`;
      window.open(gmailUrl, "_blank", "noopener,noreferrer");
    } else {
      const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentBody)}`;
      window.location.href = mailtoUrl;
    }

    // 2. Mark lead status as CONTACTED in pipeline and refresh
    try {
      await api.agents.sendEmail(leadId);
      setEmailSentSuccess(true);
      await fetchLeadData();
      setTimeout(() => setEmailSentSuccess(false), 4000);
    } catch (err: any) {
      console.warn("Could not auto-advance status:", err);
    } finally {
      setSendingEmail(false);
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
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.15] flex items-center justify-center animate-pulse">
          <Bot className="w-4 h-4 text-zinc-300" />
        </div>
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Loading Pipeline State</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-12 text-center rounded-2xl border border-white/[0.08] bg-zinc-950/80 backdrop-blur-xl">
        <AlertTriangle className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-base font-medium text-white">Prospect Not Found</h2>
        <p className="text-xs text-zinc-500 mt-1 font-mono">Lead ID #{leadId} does not exist in pipeline.</p>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const research = lead.latest_research;
  const qual = lead.latest_qualification;
  const emailOut = lead.latest_email;

  const displayContactName = (lead.contact_name && !lead.contact_name.includes("[") && !lead.contact_name.toLowerCase().startsWith("head of operations"))
    ? lead.contact_name
    : (lead.company_name ? `${lead.company_name} Executive Team` : "Lead Decision Maker");

  return (
    <motion.div 
      className="space-y-6 pb-12 max-w-[1500px] mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 1. Header Navigation Toolbar */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>PIPELINE / #{lead.id}</span>
        </Link>

        {/* Lead Stage Pill Switcher */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-zinc-500 pl-2">STAGE:</span>
          <select
            value={lead.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-zinc-900 border border-white/[0.08] text-xs font-mono text-zinc-200 rounded-md px-2.5 py-1 focus:outline-none focus:border-white/30 cursor-pointer"
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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-xl bg-zinc-950 border border-red-500/30 text-red-300 text-xs flex items-center justify-between font-mono"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Hero Prospect Command Card (Minimalist Obsidian Black) */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Company & Contact Identity */}
          <div className="flex items-start gap-4">
            <CompanyLogo
              companyName={lead.company_name}
              website={lead.website}
              contactEmail={lead.contact_email}
              size="lg"
            />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {lead.company_name}
                </h1>
                {qual && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                    qual.fit_category === "HIGH_FIT" ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" :
                    qual.fit_category === "MEDIUM_FIT" ? "bg-amber-950/40 text-amber-400 border-amber-500/30" :
                    "bg-zinc-900 text-zinc-400 border-white/[0.1]"
                  }`}>
                    <Target className="w-3 h-3" />
                    {qual.fit_category.replace("_", " ")} ({qual.score}/100)
                  </span>
                )}
                {lead.industry && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-900 border border-white/[0.08] text-zinc-400">
                    {lead.industry}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400 font-sans">
                <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-zinc-500" />
                  {displayContactName} ({lead.role || "Executive Target"})
                </span>
                {lead.website && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Globe className="w-3 h-3 text-zinc-500" />
                      {lead.website.replace("https://", "").replace("http://", "")}
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
                    </a>
                  </>
                )}
                {lead.contact_email && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span className="inline-flex items-center gap-1 font-mono text-zinc-400 text-[11px]">
                      <Mail className="w-3 h-3 text-zinc-500" />
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
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunFullPipeline}
              disabled={Boolean(agentActionLoading)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {agentActionLoading === "PIPELINE" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-black" />
              )}
              Run Full Agent Pipeline
            </motion.button>

            <button
              onClick={handleRunResearch}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.18] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {agentActionLoading === "RESEARCH" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
              ) : (
                <Bot className="w-3 h-3 text-zinc-400" />
              )}
              Research
            </button>

            <button
              onClick={handleRunQualify}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.18] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {agentActionLoading === "QUALIFY" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-zinc-400" />
              )}
              Qualify
            </button>

            <button
              onClick={handleRunEmail}
              disabled={Boolean(agentActionLoading)}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] hover:border-white/[0.18] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {agentActionLoading === "EMAIL" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
              ) : (
                <Send className="w-3 h-3 text-zinc-400" />
              )}
              Draft Email
            </button>
          </div>
        </div>

        {/* Minimalist Pipeline Progress Tracker */}
        <div className="mt-8 pt-5 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: "01", title: "LEAD INGESTED", active: true },
            { step: "02", title: "DEEP RESEARCH", active: Boolean(research) },
            { step: "03", title: "ICP QUALIFICATION", active: Boolean(qual) },
            { step: "04", title: "OUTREACH STUDIO", active: Boolean(emailOut) },
          ].map((s) => (
            <div 
              key={s.step} 
              className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                s.active 
                  ? "bg-zinc-950 border-white/[0.1]" 
                  : "bg-transparent border-white/[0.04] opacity-40"
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${
                s.active 
                  ? "bg-white text-black" 
                  : "bg-zinc-900 text-zinc-600"
              }`}>
                {s.active ? "✓" : s.step}
              </div>
              <span className={`text-[11px] font-mono tracking-wider ${s.active ? "text-zinc-200" : "text-zinc-600"}`}>
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
            className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Research Agent Intelligence
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">Grounded live telemetry & market footprint</p>
                </div>
              </div>

              {research ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-white/[0.08]">
                  CONFIDENCE: {Math.round(research.confidence_score * 100)}%
                </span>
              ) : (
                <button
                  onClick={handleRunResearch}
                  disabled={Boolean(agentActionLoading)}
                  className="text-xs text-zinc-300 hover:text-white font-mono underline cursor-pointer"
                >
                  Run Deep Search →
                </button>
              )}
            </div>

            {research ? (
              <div className="space-y-4 text-xs">
                {/* Executive Summary */}
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 block mb-1.5">Executive Summary</span>
                  <div className="p-3.5 rounded-xl bg-[#060608] border border-white/[0.06] text-zinc-200 leading-relaxed font-sans text-xs shadow-inner">
                    {research.summary}
                  </div>
                </div>

                {/* Company Overview */}
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 block mb-1.5">Company Overview</span>
                  <p className="text-zinc-400 leading-relaxed px-1">
                    {research.company_overview}
                  </p>
                </div>

                {/* Bottlenecks */}
                <div>
                  <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 block mb-1.5">Detected Sales & Operational Bottlenecks</span>
                  <div className="space-y-1.5">
                    {research.target_pain_points.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-white/[0.04] text-zinc-300">
                        <span className="text-zinc-500 font-mono text-xs mt-0.5">•</span>
                        <span className="leading-relaxed text-xs">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technology Stack */}
                {research.technology_stack && research.technology_stack.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 block mb-1.5">Detected Technology Stack</span>
                    <div className="flex flex-wrap gap-1.5">
                      {research.technology_stack.map((tech, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-zinc-900 border border-white/[0.08] text-[11px] text-zinc-300 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Growth Signals */}
                {research.growth_signals && research.growth_signals.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500 block mb-1.5">Verified Market Signals</span>
                    <div className="space-y-1.5">
                      {research.growth_signals.map((sig, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.04] flex items-start gap-2 text-zinc-300 text-xs">
                          <TrendingUp className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-600">
                <Bot className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                <p className="text-xs font-mono">No research telemetry synthesized.</p>
              </div>
            )}
          </motion.div>

          {/* Card 2: Qualification Agent Scorecard */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Qualification Scorecard
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">Objective ICP Rubric Assessment</p>
                </div>
              </div>

              {qual && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                  qual.fit_category === "HIGH_FIT" ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" :
                  qual.fit_category === "MEDIUM_FIT" ? "bg-amber-950/40 text-amber-400 border-amber-500/30" :
                  "bg-zinc-900 text-zinc-400 border-white/[0.1]"
                }`}>
                  {qual.fit_category.replace("_", " ")}
                </span>
              )}
            </div>

            {qual ? (
              <div className="space-y-4">
                {/* Score & Rationale Bento Card */}
                <div className="p-4 rounded-xl bg-[#060608] border border-white/[0.06] flex items-center gap-5 shadow-inner">
                  <div className="w-16 h-16 rounded-xl bg-black border border-white/[0.08] flex flex-col items-center justify-center shrink-0">
                    <span className={`text-2xl font-light font-mono ${
                      qual.score >= 75 ? "text-emerald-400" :
                      qual.score >= 50 ? "text-amber-400" : "text-zinc-400"
                    }`}>
                      {qual.score}
                    </span>
                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">/ 100</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-zinc-500">ACTION:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold text-zinc-200 bg-zinc-900 border border-white/[0.08]">
                        {qual.recommendation || "PRIORITY_OUTREACH"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {qual.reasoning}
                    </p>
                  </div>
                </div>

                {/* Rubric Breakdown Progress Bars */}
                {qual.icp_fit_breakdown && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: "Authority", val: qual.icp_fit_breakdown.role_authority || 25, max: 30 },
                      { label: "Industry", val: qual.icp_fit_breakdown.industry_fit || 25, max: 30 },
                      { label: "Scale", val: qual.icp_fit_breakdown.company_size_fit || 20, max: 25 },
                      { label: "Intent", val: qual.icp_fit_breakdown.urgency_and_signals || 15, max: 15 },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.04] space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>{item.label}</span>
                          <span className="text-zinc-300 font-semibold">{item.val}/{item.max}</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-zinc-900 overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full"
                            style={{ width: `${Math.min(100, (item.val / item.max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Positive & Negative Signals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-2">
                    <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Positive ICP Drivers
                    </span>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {qual.positive_signals.map((pos, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-mono">✓</span>
                          <span>{pos}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-2">
                    <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risks & Notes
                    </span>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {qual.negative_signals.map((neg, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-zinc-500 font-mono">•</span>
                          <span>{neg}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-600">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                <p className="text-xs font-mono">Lead has not been qualified yet.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Outreach Email Studio & Activity Trail (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 3: Outreach Email Studio (Linear / Superhuman Aesthetic) */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-white">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    Outreach Email Studio
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono">Autonomous cold outreach cadence</p>
                </div>
              </div>

              {emailOut && (
                <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/[0.08] text-xs">
                  <button
                    onClick={() => setActiveEmailTab("initial")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      activeEmailTab === "initial"
                        ? "bg-zinc-800 text-white font-medium shadow-sm"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Touch 1
                  </button>
                  <button
                    onClick={() => setActiveEmailTab("followup")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                      activeEmailTab === "followup"
                        ? "bg-zinc-800 text-white font-medium shadow-sm"
                        : "text-zinc-500 hover:text-white"
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
                        <span className="text-[10px] font-mono uppercase text-zinc-500">SUBJECT</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.subject, "subject")}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        >
                          {copiedField === "subject" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-[#060608] border border-white/[0.06] font-mono text-zinc-200 text-xs shadow-inner">
                        {emailOut.subject}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">PERSONALIZED BODY</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.body, "body")}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        >
                          {copiedField === "body" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-[#060608] border border-white/[0.06] text-zinc-200 whitespace-pre-line leading-relaxed text-xs shadow-inner font-sans">
                        {emailOut.body}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Follow Up Touch */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">FOLLOW-UP SUBJECT (+3 DAYS)</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.follow_up_subject || "", "follow_subj")}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        >
                          {copiedField === "follow_subj" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-[#060608] border border-white/[0.06] font-mono text-zinc-200 text-xs shadow-inner">
                        {emailOut.follow_up_subject || `Follow-up re: ${lead.company_name}`}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">FOLLOW-UP BODY</span>
                        <button
                          onClick={() => copyToClipboard(emailOut.follow_up_body || "", "follow_body")}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-200 cursor-pointer"
                        >
                          {copiedField === "follow_body" ? (
                            <span className="text-emerald-400 inline-flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</span>
                          )}
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-[#060608] border border-white/[0.06] text-zinc-200 whitespace-pre-line leading-relaxed text-xs shadow-inner font-sans">
                        {emailOut.follow_up_body || "No follow-up body generated."}
                      </div>
                    </div>
                  </>
                )}

                {/* Personalization Rationale */}
                {emailOut.personalization_rationale && (
                  <div className="p-3 rounded-xl bg-zinc-950 border border-white/[0.05] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      Agent Targeting Rationale
                    </span>
                    <p className="text-zinc-400 leading-relaxed text-xs">
                      {emailOut.personalization_rationale}
                    </p>
                  </div>
                )}

                {/* Direct Dispatch & Redirect Actions */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleSendEmailNow("gmail")}
                    disabled={sendingEmail}
                    className="w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-white hover:bg-zinc-200 text-black font-semibold shadow-[0_0_15px_rgba(255,255,255,0.12)] active:scale-[0.99] cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-black" />
                    <span>Send to {lead.contact_email || "Prospect"} (Open Gmail)</span>
                  </button>

                  <button
                    onClick={() => handleSendEmailNow("mailto")}
                    disabled={sendingEmail}
                    className="w-full py-2 rounded-xl text-[11px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-white/[0.06] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3 h-3 text-zinc-500" />
                    <span>Or open in default mail app (Outlook / Apple Mail)</span>
                  </button>

                  <AnimatePresence>
                    {emailSentSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Opened in Composer with Drafted Text & Marked Contacted ✓</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-600">
                <Send className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                <p className="text-xs font-mono">No outreach cadence generated.</p>
              </div>
            )}
          </motion.div>

          {/* Card 4: Activity & Audit Trail */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          >
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/[0.06]">
              <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-white">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Execution Audit Trail</h2>
                <p className="text-[11px] text-zinc-500 font-mono">Autonomous agent telemetry</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-zinc-600 font-mono text-center py-4">No events logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-zinc-950 border border-white/[0.04] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-zinc-200 font-mono text-[11px]">
                        {act.action}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-white/[0.06]">
                        {act.agent_name || "SYSTEM"}
                      </span>
                      {act.details?.score !== undefined && (
                        <span>Score: {act.details.score}</span>
                      )}
                      {act.details?.subject && (
                        <span className="truncate max-w-[180px]">Subj: {act.details.subject}</span>
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
