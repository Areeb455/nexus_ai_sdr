"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  User, 
  Mail, 
  Briefcase, 
  Globe, 
  Layers, 
  Users2, 
  MapPin, 
  FileText, 
  ArrowLeft, 
  Sparkles,
  Check
} from "lucide-react";
import { api } from "@/lib/api";
import AutonomousCompanyHunter from "@/components/AutonomousCompanyHunter";

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("nexus_auth_token")) {
      router.push("/login");
    }
  }, [router]);

  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    contact_email: "",
    role: "",
    website: "",
    industry: "B2B SaaS / Technology",
    company_size: "50-200 employees",
    location: "",
    notes: "",
  });

  const [extractQuery, setExtractQuery] = useState("");
  const [extracting, setExtracting] = useState(false);

  const handleAutoExtract = async () => {
    if (!extractQuery.trim()) return;
    setExtracting(true);
    setError(null);
    try {
      const data = await api.leads.extractCompany(extractQuery);
      setFormData((prev) => ({
        ...prev,
        company_name: data.company_name || prev.company_name,
        website: data.website || (extractQuery.startsWith("http") ? extractQuery : `https://${extractQuery}`),
        industry: data.industry || prev.industry,
        company_size: data.company_size || prev.company_size,
        role: data.suggested_role || prev.role || "VP of Sales & Operations",
        notes: data.notes || prev.notes,
      }));
    } catch (err: any) {
      setError(err.message || "Failed to auto-extract company data. You can still enter details manually.");
    } finally {
      setExtracting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyPreset = (preset: any) => {
    setFormData(preset);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await api.leads.create(formData);
      router.push(`/leads/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create prospect lead.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with back navigation */}
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
          Autonomous Multi-Agent Enrichment Ready
        </span>
      </div>

      {/* Autonomous AI Hunter */}
      <AutonomousCompanyHunter />

      <div className="glass-panel p-8">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Manual Prospect Account Creation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Input prospect company details to initialize the Research, Qualification, and Email generation agents.
          </p>
        </div>

        {/* AI Autonomous Company Extractor Bar */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              ⚡ Autonomous AI Company Enrichment:
            </span>
            <span className="text-[11px] text-indigo-300/70">Enter a website or company name to auto-fill</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={extractQuery}
              onChange={(e) => setExtractQuery(e.target.value)}
              placeholder="e.g. stripe.com, figma.com, or Datadog"
              className="flex-1 px-3 py-2 bg-slate-900/90 border border-slate-700/60 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAutoExtract();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAutoExtract}
              disabled={extracting || !extractQuery.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {extracting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Fill with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Evaluator Presets Bar */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              1-Click Demo Evaluation Presets:
            </span>
            <span className="text-[11px] text-slate-500">Auto-populates realistic data across ICP tiers</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  company_name: "Linear",
                  contact_name: "Conor Muirhead",
                  contact_email: "conor@linear.app",
                  role: "Head of Product Design",
                  website: "https://linear.app",
                  industry: "B2B SaaS / Developer Tooling",
                  company_size: "118 employees",
                  location: "San Francisco, CA",
                  notes: "Fast-growing issue tracking platform ($100M ARR, $2.5B valuation). High-efficiency team scaling enterprise GTM motion.",
                })
              }
              className="px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
            >
              🌟 High Fit: Linear (Conor @ linear.app)
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  company_name: "Stripe",
                  contact_name: "Eileen O'Mara",
                  contact_email: "eileen@stripe.com",
                  role: "Chief Revenue Officer",
                  website: "https://stripe.com",
                  industry: "Fintech / Financial Infrastructure",
                  company_size: "8000+ employees",
                  location: "South San Francisco, CA",
                  notes: "Global payments infrastructure ($19.4B ARR, $159B valuation). Enterprise scale with extensive global sales operations.",
                })
              }
              className="px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
            >
              ⚡ Enterprise: Stripe (Eileen, CRO @ stripe.com)
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  company_name: "Miller Creative Crafts",
                  contact_name: "Gary Miller",
                  contact_email: "gary@millercreativeshop.net",
                  role: "Owner / Solo Creator",
                  website: "https://millercreativeshop.net",
                  industry: "Art & Handcrafted Goods",
                  company_size: "1 employee",
                  location: "Portland, OR",
                  notes: "One-man craft shop making handmade goods. Solopreneur scale with zero outbound sales motion or software budget.",
                })
              }
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
            >
              ⚠️ Disqualify / Low Fit: Solo Potter (1 person)
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Lead Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Company Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g. CloudScale Data"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="contact_name"
                  required
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Elena Rostova"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Role / Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. VP of Revenue Operations"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="e.g. elena@cloudscaledata.io"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://cloudscaledata.io"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Industry / Vertical
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Layers className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g. B2B SaaS / Data Platforms"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Company Size
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Users2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                  placeholder="e.g. 150 employees"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Headquarters Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notes / Context */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Sales Intelligence Notes / Known Signals
            </label>
            <div className="relative">
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any supplied context, recent press, job postings, or SDR priorities..."
                className="w-full p-3.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Prospect & Launch Workspace
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
