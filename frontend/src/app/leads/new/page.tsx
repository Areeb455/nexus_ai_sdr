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
  ArrowLeft, 
  Sparkles,
  Loader2
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
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>BACK TO DASHBOARD</span>
        </Link>
        <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
          AUTONOMOUS MULTI-AGENT INGESTION
        </span>
      </div>

      {/* Autonomous AI Hunter */}
      <AutonomousCompanyHunter />

      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6 sm:p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Manual Prospect Account Creation
          </h1>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Input prospect company details to initialize the Research, Qualification, and Email generation agents.
          </p>
        </div>

        {/* AI Autonomous Company Extractor Bar */}
        <div className="mt-6 p-4 rounded-xl bg-[#060608] border border-white/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Autonomous AI Company Enrichment
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Enter a website or company name to auto-fill</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={extractQuery}
              onChange={(e) => setExtractQuery(e.target.value)}
              placeholder="e.g. stripe.com, figma.com, or Datadog"
              className="flex-1 px-3.5 py-2 bg-zinc-950 border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
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
              className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Auto-Fill with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Evaluator Presets Bar */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-zinc-950 border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
              1-CLICK DEMO PRESETS
            </span>
            <span className="text-[10px] font-mono text-zinc-600">Auto-populates realistic data across ICP tiers</span>
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
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-emerald-500/25 text-emerald-400 text-xs font-mono transition-colors cursor-pointer"
            >
              ★ High Fit: Linear (Conor @ linear.app)
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
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
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
              className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-amber-500/25 text-amber-400 text-xs font-mono transition-colors cursor-pointer"
            >
              ⚠️ Low Fit: Solo Potter (1 person)
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-red-500/30 text-red-400 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Lead Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Company Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g. CloudScale Data"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Contact Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="contact_name"
                  required
                  value={formData.contact_name}
                  onChange={handleChange}
                  placeholder="e.g. Elena Rostova"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Role / Title
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g. VP of Revenue Operations"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="e.g. elena@cloudscaledata.io"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://cloudscaledata.io"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Industry / Vertical
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g. B2B SaaS / Data Platforms"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Company Size
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Users2 className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                  placeholder="e.g. 150 employees"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                Headquarters Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>
          </div>

          {/* Notes / Context */}
          <div>
            <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
              Sales Intelligence Notes / Known Signals
            </label>
            <div className="relative">
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any supplied context, recent press, job postings, or SDR priorities..."
                className="w-full p-3 bg-[#060608] border border-white/[0.08] rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-mono transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight shadow-[0_0_15px_rgba(255,255,255,0.12)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Create Prospect & Launch Workspace</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
