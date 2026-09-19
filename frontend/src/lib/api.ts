const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: number;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface ResearchData {
  id?: number;
  summary: string;
  company_overview: string;
  target_pain_points: string[];
  key_decision_makers: { name: string; role: string; relevance: string }[];
  technology_stack: string[];
  growth_signals: string[];
  sources: string[];
  confidence_score: number;
  created_at?: string;
}

export interface QualificationData {
  id?: number;
  score: number;
  fit_category: "HIGH_FIT" | "MEDIUM_FIT" | "LOW_FIT";
  reasoning: string;
  positive_signals: string[];
  negative_signals: string[];
  icp_fit_breakdown?: {
    role_authority?: number;
    industry_fit?: number;
    company_size_fit?: number;
    urgency_and_signals?: number;
  };
  recommendation?: string;
  created_at?: string;
}

export interface EmailData {
  id?: number;
  subject: string;
  body: string;
  follow_up_subject?: string;
  follow_up_body?: string;
  personalization_rationale?: string;
  tone?: string;
  created_at?: string;
}

export interface Lead {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  role?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  latest_research?: ResearchData;
  latest_qualification?: QualificationData;
  latest_email?: EmailData;
}

export interface LeadSummaryItem {
  id: number;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  role?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  notes?: string;
  status: string;
  created_at: string;
  qualification_score?: number;
  fit_category?: string;
  last_activity?: string;
}

export interface DashboardMetrics {
  total_leads: number;
  researched_leads: number;
  qualified_leads: number;
  disqualified_leads: number;
  contacted_leads: number;
  high_fit_leads: number;
  medium_fit_leads: number;
  low_fit_leads: number;
  conversion_rate_percentage: number;
}

export interface ActivityLogItem {
  id: number;
  lead_id?: number;
  user_id?: number;
  action: string;
  agent_name?: string;
  details?: Record<string, any>;
  timestamp: string;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nexus_auth_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("nexus_auth_token", token);
  } else {
    localStorage.removeItem("nexus_auth_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    register: (body: { email: string; password: string; full_name?: string }) =>
      request<{ access_token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    googleLogin: (credential: string) =>
      request<{ access_token: string; user: User }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      }),
    getMe: () => request<User>("/auth/me"),
  },
  leads: {
    getMetrics: () => request<DashboardMetrics>("/leads/metrics"),
    list: (params: { search?: string; status?: string; fit_category?: string; industry?: string; skip?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params.search) query.set("search", params.search);
      if (params.status && params.status !== "ALL") query.set("status", params.status);
      if (params.fit_category && params.fit_category !== "ALL") query.set("fit_category", params.fit_category);
      if (params.industry && params.industry !== "ALL") query.set("industry", params.industry);
      if (params.skip !== undefined) query.set("skip", params.skip.toString());
      if (params.limit !== undefined) query.set("limit", params.limit.toString());
      return request<{ total: number; items: LeadSummaryItem[] }>(`/leads?${query.toString()}`);
    },
    get: (id: number | string) => request<Lead>(`/leads/${id}`),
    create: (lead: Partial<Lead>) =>
      request<Lead>("/leads", {
        method: "POST",
        body: JSON.stringify(lead),
      }),
    update: (id: number | string, lead: Partial<Lead>) =>
      request<Lead>(`/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(lead),
      }),
    delete: (id: number | string) =>
      request<void>(`/leads/${id}`, {
        method: "DELETE",
      }),
  },
  agents: {
    runResearch: (leadId: number | string) =>
      request<ResearchData>(`/leads/${leadId}/research`, { method: "POST" }),
    runQualify: (leadId: number | string) =>
      request<QualificationData>(`/leads/${leadId}/qualify`, { method: "POST" }),
    runEmail: (leadId: number | string) =>
      request<EmailData>(`/leads/${leadId}/email`, { method: "POST" }),
    runPipeline: (leadId: number | string) =>
      request<{
        lead_id: number;
        status: string;
        message: string;
        research?: ResearchData;
        qualification?: QualificationData;
        email?: EmailData;
      }>(`/leads/${leadId}/pipeline`, { method: "POST" }),
  },
  activity: {
    getLeadActivity: (leadId: number | string) =>
      request<ActivityLogItem[]>(`/leads/${leadId}/activity`),
    getRecent: (limit: number = 20) =>
      request<ActivityLogItem[]>(`/activities?limit=${limit}`),
  },
  settings: {
    getStatus: () => request<any>("/settings/system-status"),
  },
};
