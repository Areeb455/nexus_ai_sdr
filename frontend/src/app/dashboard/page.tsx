"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, 
  CheckCircle2, 
  Send, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  Bot, 
  Building2, 
  ArrowRight, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  Trash2,
  AlertCircle
} from "lucide-react";
import { api, LeadSummaryItem, DashboardMetrics } from "@/lib/api";
import AutonomousCompanyHunter from "@/components/AutonomousCompanyHunter";
import CompanyLogo from "@/components/CompanyLogo";

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [leads, setLeads] = useState<LeadSummaryItem[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fitFilter, setFitFilter] = useState("ALL");

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    try {
      const [m, l] = await Promise.all([
        api.leads.getMetrics(),
        api.leads.list({
          search: searchQuery,
          status: statusFilter,
          fit_category: fitFilter,
        }),
      ]);
      setMetrics(m);
      setLeads(l.items);
      setTotalLeads(l.total);
    } catch (err: any) {
      setError(err.message || "Failed to load pipeline data. Is the backend server running?");
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Activate Clean Slate? This will purge existing sample leads so you can test fresh.")) {
      setClearing(true);
      try {
        await api.leads.clearAll();
        await loadData(true);
      } catch (err: any) {
        alert("Failed to clear leads: " + err.message);
      } finally {
        setClearing(false);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("nexus_auth_token")) {
      router.push("/login");
      return;
    }
    loadData();
  }, [searchQuery, statusFilter, fitFilter]);

  const getFitBadge = (category?: string, score?: number) => {
    if (score === undefined || score === null) {
      return (
        <span className="text-xs font-mono text-zinc-600">Unqualified</span>
      );
    }

    if (category === "HIGH_FIT" || score >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          High Fit ({score})
        </span>
      );
    }
    if (category === "MEDIUM_FIT" || score >= 50) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-950/40 text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Mid Fit ({score})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-zinc-900 text-zinc-400 border border-white/[0.08]">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
        Low Fit ({score})
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-white/[0.08] text-zinc-400">New Lead</span>;
      case "RESEARCHED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-white/[0.15] text-zinc-200">Researched</span>;
      case "QUALIFIED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">Qualified</span>;
      case "DISQUALIFIED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-white/[0.08] text-zinc-500">Disqualified</span>;
      case "CONTACTED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.1] border border-white/[0.2] text-white">Contacted</span>;
      case "FOLLOW_UP":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/40 border border-amber-500/30 text-amber-400">Follow Up</span>;
      case "CONVERTED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 border border-emerald-500 text-emerald-300">Converted</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-white/[0.08] text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            SDR Pipeline Cockpit
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-zinc-900 text-zinc-400 border border-white/[0.08]">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Autonomous multi-agent prospect intelligence, qualification scoring, and outbound cadence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh Data"
            className="p-2 rounded-xl bg-zinc-900 border border-white/[0.08] hover:border-white/[0.18] text-zinc-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-white" : ""}`} />
          </button>

          <button
            onClick={handleClearAll}
            disabled={clearing || leads.length === 0}
            title="Clean Slate: Remove sample leads to start fresh"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-white/[0.08] text-xs font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {clearing ? "Clearing..." : "Clean Slate"}
          </button>

          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight shadow-[0_0_15px_rgba(255,255,255,0.12)] transition-all group cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Prospect
          </Link>
        </div>
      </div>

      {/* Autonomous AI SDR Hunter & Lead Prospector */}
      <AutonomousCompanyHunter onSuccess={() => loadData(true)} />

      {error && (
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-red-500/30 text-red-400 text-xs font-mono flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Session expired or backend unavailable. Please verify session.</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-2.5 py-1 rounded-md bg-white text-black text-xs font-medium"
            >
              Sign In
            </Link>
            <button
              onClick={() => loadData(true)}
              className="text-xs text-zinc-400 underline hover:text-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Prospects */}
        <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">TOTAL PIPELINE</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extralight font-mono text-white">
              {metrics ? metrics.total_leads : "—"}
            </span>
            <span className="text-xs font-mono text-zinc-600">Prospects</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-zinc-400" />
            <span>{metrics ? metrics.researched_leads : 0} autonomous researched</span>
          </div>
        </div>

        {/* High Fit Leads */}
        <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">ICP QUALIFIED</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extralight font-mono text-emerald-400">
              {metrics ? metrics.qualified_leads : "—"}
            </span>
            <span className="text-xs font-mono text-zinc-600">Ready</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <span>{metrics ? metrics.high_fit_leads : 0} High Tier · {metrics ? metrics.medium_fit_leads : 0} Mid Tier</span>
          </div>
        </div>

        {/* Contacted / Outbound */}
        <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">OUTBOUND GENERATED</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
              <Send className="w-3.5 h-3.5 text-zinc-300" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extralight font-mono text-white">
              {metrics ? metrics.contacted_leads : "—"}
            </span>
            <span className="text-xs font-mono text-zinc-600">Campaigns</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <span>Personalized touches generated</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">ENGAGEMENT RATE</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extralight font-mono text-white">
              {metrics ? `${metrics.conversion_rate_percentage}%` : "—"}
            </span>
            <span className="text-xs font-mono text-zinc-600">Velocity</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
            <span>Autonomous agent pipeline conversion</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-3.5 rounded-2xl bg-[#0a0a0c] border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter accounts by name, domain, vertical, or executive target..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 mr-1">
            <Filter className="w-3 h-3" />
            <span>FILTER:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-white/[0.08] text-zinc-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="RESEARCHED">Researched</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="DISQUALIFIED">Disqualified</option>
            <option value="CONTACTED">Contacted</option>
          </select>

          <select
            value={fitFilter}
            onChange={(e) => setFitFilter(e.target.value)}
            className="bg-zinc-900 border border-white/[0.08] text-zinc-300 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="ALL">All ICP Tiers</option>
            <option value="HIGH_FIT">High Fit Tier</option>
            <option value="MEDIUM_FIT">Medium Fit Tier</option>
            <option value="LOW_FIT">Low Fit Tier</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            PROSPECT ACCOUNTS
            <span className="text-zinc-500 font-normal">({totalLeads})</span>
          </h2>
          <span className="text-[10px] text-zinc-500 font-mono">AUTONOMOUS MULTI-AGENT CADENCE ACTIVE</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-xs font-mono text-zinc-500">Querying SDR accounts database...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No prospects found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto font-sans">
              No leads match your criteria. Use the Autonomous Prospector above or add a lead to initiate workflow.
            </p>
            <Link
              href="/leads/new"
              className="inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Lead
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-black/40">
                  <th className="py-3 px-5">Prospect & Role</th>
                  <th className="py-3 px-5">Company & Domain</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">ICP Fit Score</th>
                  <th className="py-3 px-5">Last Activity</th>
                  <th className="py-3 px-5 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    {/* Contact & Role */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center font-mono text-white text-xs shrink-0">
                          {lead.contact_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-zinc-300 transition-colors">
                            {lead.contact_name}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-sans">
                            {lead.role || "Executive Target"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company & Domain */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <CompanyLogo
                          companyName={lead.company_name}
                          website={lead.website}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200 flex items-center gap-1.5">
                            {lead.company_name}
                            {lead.website && (
                              <a
                                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-zinc-600 hover:text-white transition-colors"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            {lead.industry || "B2B Tech"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      {getStatusBadge(lead.status)}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-5">
                      {getFitBadge(lead.fit_category, lead.qualification_score)}
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                        <span className="truncate max-w-[130px]">
                          {lead.last_activity || "CREATED"}
                        </span>
                      </div>
                    </td>

                    {/* Workspace link */}
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 group-hover:text-white transition-colors"
                      >
                        Open
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
