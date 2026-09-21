"use client";

import { useEffect } from "react";

export default function BackendWarmer() {
  useEffect(() => {
    // Eagerly ping backend /health to wake up Render free tier container on user arrival
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nexus-sdr-backend.onrender.com/api/v1";
    const healthUrl = apiUrl.replace(/\/api\/v1\/?$/, "") + "/health";
    fetch(healthUrl, { method: "GET", keepalive: true }).catch(() => {});
  }, []);

  return null;
}
