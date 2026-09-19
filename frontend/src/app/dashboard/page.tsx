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
  ArrowUpRight, 
  Sparkles, 
  Bot, 
  Building2, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { api, LeadSummaryItem, DashboardMetrics } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [leads, setLeads] = useState<LeadSummaryItem[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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
        <span className="text-xs text-slate-500 italic">Unqualified</span>
      );
    }

    if (category === "HIGH_FIT" || score >= 75) {
      return (
        <span className="badge badge-high">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          High Fit ({score})
        </span>
      );
    }
    if (category === "MEDIUM_FIT" || score >= 50) {
      return (
        <span className="badge badge-med">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Mid Fit ({score})
        </span>
      );
    }
    return (
      <span className="badge badge-low">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Low Fit ({score})
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="badge badge-status-new">New Lead</span>;
      case "RESEARCHED":
        return <span className="badge badge-status-researched">Researched</span>;
      case "QUALIFIED":
        return <span className="badge badge-status-qualified">Qualified</span>;
      case "DISQUALIFIED":
        return <span className="badge badge-low">Disqualified</span>;
      case "CONTACTED":
        return <span className="badge badge-status-contacted">Contacted</span>;
      case "FOLLOW_UP":
        return <span className="badge badge-med">Follow Up</span>;
      case "CONVERTED":
        return <span className="badge badge-high">Converted</span>;
      default:
        return <span className="badge badge-status-new">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            SDR Pipeline Cockpit
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Feed
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-agent prospect intelligence, qualification scoring, and outbound generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Add Prospect
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <span className="font-semibold">Session Required:</span> Please log in to view your live pipeline.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Sign In to Demo Account
            </Link>
            <button
              onClick={() => loadData(true)}
              className="text-xs text-slate-400 underline hover:text-white"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Prospects */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics ? metrics.total_leads : "—"}
            </span>
            <span className="text-xs text-slate-400">Prospects</span>
          </div>
          <div className="mt-2 text-xs text-indigo-300/80 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" />
            <span>{metrics ? metrics.researched_leads : 0} autonomous researched</span>
          </div>
        </div>

        {/* High Fit Leads */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">ICP Qualified</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {metrics ? metrics.qualified_leads : "—"}
            </span>
            <span className="text-xs text-slate-400">Ready for Outreach</span>
          </div>
          <div className="mt-2 text-xs text-emerald-300/80 flex items-center gap-1">
            <span>{metrics ? metrics.high_fit_leads : 0} High Tier · {metrics ? metrics.medium_fit_leads : 0} Mid Tier</span>
          </div>
        </div>

        {/* Contacted / Outbound */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Outbound Active</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Send className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-300">
              {metrics ? metrics.contacted_leads : "—"}
            </span>
            <span className="text-xs text-slate-400">Campaigns Generated</span>
          </div>
          <div className="mt-2 text-xs text-purple-300/80 flex items-center gap-1">
            <span>Email Agent active with personalized hooks</span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Engagement Rate</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-300">
              {metrics ? `${metrics.conversion_rate_percentage}%` : "—"}
            </span>
            <span className="text-xs text-slate-400">Pipeline Velocity</span>
          </div>
          <div className="mt-2 text-xs text-cyan-300/80 flex items-center gap-1">
            <span>3.4x higher than standard manual SDR benchmarks</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by prospect name, company, role, or vertical..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
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
            className="bg-slate-900 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All ICP Tiers</option>
            <option value="HIGH_FIT">High Fit Tier</option>
            <option value="MEDIUM_FIT">Medium Fit Tier</option>
            <option value="LOW_FIT">Low Fit Tier</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            Prospect Accounts
            <span className="text-xs font-normal text-slate-400">({totalLeads} matching)</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Multi-Agent Workflow Engine Active</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Querying SDR leads database...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No prospects found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No leads match your current filter criteria. Try adjusting filters or create a new lead to kick off the multi-agent workflow.
            </p>
            <Link
              href="/leads/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Lead
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                  <th className="py-3.5 px-6">Prospect & Role</th>
                  <th className="py-3.5 px-6">Company & Vertical</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">ICP Fit Score</th>
                  <th className="py-3.5 px-6">Last Activity</th>
                  <th className="py-3.5 px-6 text-right">Cockpit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/leads/${lead.id}`}
                  >
                    {/* Contact & Role */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center font-semibold text-indigo-300 text-xs">
                          {lead.contact_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                            {lead.contact_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {lead.role || "Executive"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company & Vertical */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 flex items-center gap-1.5">
                          {lead.company_name}
                          {lead.website && (
                            <a
                              href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-500 hover:text-cyan-400 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </span>
                        <span className="text-xs text-slate-400">
                          {lead.industry || "B2B Tech"} · {lead.company_size || "Mid-Market"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {getStatusBadge(lead.status)}
                    </td>

                    {/* Score */}
                    <td className="py-4 px-6">
                      {getFitBadge(lead.fit_category, lead.qualification_score)}
                    </td>

                    {/* Last Activity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span className="font-mono text-[11px] truncate max-w-[150px]">
                          {lead.last_activity || "CREATED"}
                        </span>
                      </div>
                    </td>

                    {/* Cockpit link */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors"
                      >
                        Workspace
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
