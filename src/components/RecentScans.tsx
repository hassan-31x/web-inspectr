"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HISTORY_KEY, RecentScan } from "@/lib/analysis";
export default function RecentScans() {
  const [scans, setScans] = useState<RecentScan[]>([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(stored))
        setScans(
          stored
            .filter(
              (x) =>
                typeof x.url === "string" &&
                typeof x.overallScore === "number" &&
                typeof x.timestamp === "string",
            )
            .slice(0, 5),
        );
    } catch {}
  }, []);
  if (!scans.length) return null;
  return (
    <section className="recent-scans">
      <div className="section-label">
        <h2>Recent checks</h2>
        <button
          className="text-button"
          onClick={() => {
            try {
              localStorage.removeItem(HISTORY_KEY);
            } catch {}
            setScans([]);
          }}
        >
          Clear history
        </button>
      </div>
      {scans.map((scan) => (
        <Link
          key={scan.url}
          className="recent-row"
          href={`/analyze?url=${encodeURIComponent(scan.url)}`}
        >
          <span>{scan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
          <span>
            {scan.overallScore}/100 <span aria-hidden="true">↗</span>
          </span>
        </Link>
      ))}
      <p className="muted small">
        History stays in this browser. Opening a check runs a fresh analysis.
      </p>
    </section>
  );
}
