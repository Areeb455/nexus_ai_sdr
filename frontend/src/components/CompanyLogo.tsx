"use client";

import React, { useState, useEffect } from "react";

interface CompanyLogoProps {
  companyName: string;
  website?: string | null;
  contactEmail?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function CompanyLogo({
  companyName,
  website,
  contactEmail,
  size = "lg",
  className = ""
}: CompanyLogoProps) {
  const [imgErrorCount, setImgErrorCount] = useState(0);

  // Extract clean domain
  const extractDomain = (): string | null => {
    if (website && website.trim()) {
      try {
        let clean = website.trim().toLowerCase();
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          clean = `https://${clean}`;
        }
        const parsed = new URL(clean);
        return parsed.hostname.replace(/^www\./, "");
      } catch {
        // Fallback simple regex
        const match = website.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
        if (match?.[1]) return match[1].toLowerCase();
      }
    }

    if (contactEmail && contactEmail.includes("@")) {
      const parts = contactEmail.split("@");
      if (parts.length === 2) {
        const domain = parts[1].trim().toLowerCase();
        const genericProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "proton.me", "protonmail.com"];
        if (!genericProviders.includes(domain)) {
          return domain;
        }
      }
    }

    if (companyName) {
      const simplified = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (simplified.length > 2) {
        return `${simplified}.com`;
      }
    }

    return null;
  };

  const domain = extractDomain();

  // Reset error count if domain changes
  useEffect(() => {
    setImgErrorCount(0);
  }, [domain]);

  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg"
  };

  const logoSources = domain
    ? [
        `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
        `https://unavatar.io/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`
      ]
    : [];

  const currentLogoUrl = domain && imgErrorCount < logoSources.length ? logoSources[imgErrorCount] : null;

  const monogram = companyName
    ? companyName.trim().slice(0, 2).toUpperCase()
    : "CO";

  return (
    <div
      className={`rounded-xl bg-zinc-900 border border-white/[0.12] flex items-center justify-center font-mono font-bold text-white shadow-inner shrink-0 overflow-hidden relative select-none ${sizeClasses[size]} ${className}`}
    >
      {currentLogoUrl ? (
        <img
          src={currentLogoUrl}
          alt={`${companyName} logo`}
          className="w-full h-full object-contain p-2 rounded-lg bg-zinc-950/40"
          onError={() => {
            setImgErrorCount((prev) => prev + 1);
          }}
          loading="eager"
        />
      ) : (
        <span className="tracking-tight">{monogram}</span>
      )}
    </div>
  );
}
