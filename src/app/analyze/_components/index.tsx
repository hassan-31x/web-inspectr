"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UrlForm from "@/components/UrlForm";
import {
  AnalysisResult,
  HISTORY_KEY,
  RecentScan,
  Status,
} from "@/lib/analysis";
const labels = { success: "Passed", warning: "Review", error: "Fix" };
export default function Report({ demoResult }: { demoResult: AnalysisResult }) {
  const params = useSearchParams();
  const url = params.get("url");
  const demo = params.get("demo") === "true";
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState<"all" | "issues" | Status>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setResult(null);
    setError("");
    setQuery("");
    setCategory("all");
    async function run() {
      try {
        let data: AnalysisResult;
        if (demo) {
          data = demoResult;
        } else {
          if (!url)
            throw new Error("Enter a website address to start a check.");
          const response = await fetch(
            `/api/analyze?url=${encodeURIComponent(url)}`,
            { signal: controller.signal, cache: "no-store" },
          );
          const payload = await response.json();
          if (!response.ok)
            throw new Error(
              payload.error || "The check could not be completed. Try again.",
            );
          data = payload;
        }
        if (!active) return;
        setResult(data);
        if (!demo) {
          try {
            const stored = JSON.parse(
              localStorage.getItem(HISTORY_KEY) || "[]",
            );
            const history: RecentScan[] = Array.isArray(stored) ? stored : [];
            localStorage.setItem(
              HISTORY_KEY,
              JSON.stringify(
                [
                  {
                    url: data.url,
                    overallScore: data.overallScore,
                    timestamp: data.timestamp,
                  },
                  ...history.filter((scan) => scan.url !== data.url),
                ].slice(0, 5),
              ),
            );
          } catch {}
        }
      } catch (err) {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "The check could not be completed.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [url, demo, retry, demoResult]);
  const items = result?.categories.flatMap((c) => c.items) || [];
  const counts = {
    success: items.filter((i) => i.status === "success").length,
    warning: items.filter((i) => i.status === "warning").length,
    error: items.filter((i) => i.status === "error").length,
  };
  const visible =
    result?.categories
      .filter((c) => category === "all" || c.name === category)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            (filter === "all" ||
              (filter === "issues"
                ? i.status !== "success"
                : i.status === filter)) &&
            `${i.name} ${i.message} ${i.preview || ""}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        ),
      }))
      .filter((c) => c.items.length) || [];
  function exportReport() {
    if (!result) return;
    const blob = new Blob(
      [JSON.stringify({ ...result, sample: demo }, null, 2)],
      { type: "application/json" },
    );
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `inspectr-${demo ? "sample" : new URL(result.url).hostname}-${result.timestamp.slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice("Report exported as JSON.");
  }
  return (
    <>
      <Header report />
      <main id="main-content" className="shell report-main">
        <div className="report-topline">
          <Link href="/" className="back-link">
            ← New website check
          </Link>
          <span className="eyebrow">
            {demo ? "SAMPLE REPORT" : "WEBSITE REPORT"}
          </span>
        </div>
        {loading ? (
          <section className="report-loading" role="status" aria-live="polite">
            <span className="eyebrow">CHECK IN PROGRESS</span>
            <h1>Looking at the details.</h1>
            <p>
              Reading the page, inspecting headers, and checking site files.
              This can take up to a minute for sites with redirects.
            </p>
            <div className="skeleton wide" />
            <div className="skeleton" />
            <div className="skeleton wide" />
          </section>
        ) : error ? (
          <section className="error-state">
            <span className="status-badge error">Check incomplete</span>
            <h1>
              {url ? "We couldn’t check this site." : "Start with a website."}
            </h1>
            <p role="alert">{error}</p>
            {url && (
              <button
                className="button secondary"
                onClick={() => setRetry((r) => r + 1)}
              >
                Try again ↻
              </button>
            )}
            <UrlForm key={url} compact initialUrl={url || ""} />
          </section>
        ) : (
          result && (
            <>
              {demo && (
                <div className="demo-banner">
                  <span>
                    This is an illustrative sample, not a live scan of
                    example.com.
                  </span>
                  <Link href="/">Check your own site →</Link>
                </div>
              )}
              <section className="report-heading">
                <div>
                  <span className="eyebrow">THE RESULTS ARE IN</span>
                  <h1>{new URL(result.url).hostname}</h1>
                  <a
                    className="site-url"
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {result.url} ↗
                  </a>
                  <p className="small muted">
                    Checked{" "}
                    {new Date(result.timestamp).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="report-actions">
                  <button className="button secondary" onClick={exportReport}>
                    Export report ↓
                  </button>
                  {!demo && (
                    <button
                      className="button secondary"
                      onClick={() => setRetry((r) => r + 1)}
                    >
                      Run again ↻
                    </button>
                  )}
                </div>
              </section>
              <section className="report-summary" aria-label="Report summary">
                <div className="score-summary">
                  <span className="eyebrow">CHECK SCORE</span>
                  <div>
                    <strong>{result.overallScore}</strong>
                    <span>/ 100</span>
                  </div>
                  <p>Passed = 1 · Review = ½ · Fix = 0</p>
                </div>
                <div className="summary-explanation">
                  <h2>
                    {counts.error
                      ? "A few things need your attention."
                      : counts.warning
                        ? "A good start. A few details to review."
                        : "All automated checks passed."}
                  </h2>
                  <p>
                    {items.length} checks across {result.categories.length}{" "}
                    categories. Start with fixes, then review the
                    recommendations in context.
                  </p>
                  <div className="status-counts">
                    {(["error", "warning", "success"] as Status[]).map(
                      (status) => (
                        <button
                          key={status}
                          className={`count-button ${status}`}
                          aria-pressed={filter === status}
                          onClick={() =>
                            setFilter(filter === status ? "all" : status)
                          }
                        >
                          <span>{counts[status]}</span>{" "}
                          {status === "error"
                            ? "to fix"
                            : status === "warning"
                              ? "to review"
                              : "passed"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </section>
              <div className="report-workspace">
                <aside className="category-nav" aria-label="Report categories">
                  <span className="eyebrow">CATEGORIES</span>
                  <button
                    className={category === "all" ? "selected" : ""}
                    aria-pressed={category === "all"}
                    onClick={() => setCategory("all")}
                  >
                    All checks<span>{items.length}</span>
                  </button>
                  {result.categories.map((c) => (
                    <button
                      key={c.name}
                      className={category === c.name ? "selected" : ""}
                      aria-pressed={category === c.name}
                      onClick={() => setCategory(c.name)}
                    >
                      {c.name}
                      <span>
                        {c.items.filter((i) => i.status !== "success").length ||
                          "✓"}
                      </span>
                    </button>
                  ))}
                  <p>
                    Checks reflect server HTML. Dynamic content and real user
                    performance need separate testing.
                  </p>
                </aside>
                <div className="report-detail">
                  <div className="report-toolbar">
                    <div
                      className="filter-tabs"
                      aria-label="Filter check status"
                    >
                      {(["all", "issues"] as const).map((value) => (
                        <button
                          key={value}
                          aria-pressed={filter === value}
                          className={filter === value ? "active" : ""}
                          onClick={() => setFilter(value)}
                        >
                          {value === "all" ? "All checks" : "Needs attention"}
                        </button>
                      ))}
                    </div>
                    <label className="search-field">
                      <span className="sr-only">Search checks</span>
                      <input
                        type="search"
                        placeholder="Search checks…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="results-meta" aria-live="polite">
                    <span>
                      {visible.reduce((sum, c) => sum + c.items.length, 0)}{" "}
                      checks shown
                    </span>
                    {(filter !== "all" || query || category !== "all") && (
                      <button
                        className="text-button"
                        onClick={() => {
                          setFilter("all");
                          setQuery("");
                          setCategory("all");
                        }}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                  {!visible.length && (
                    <div className="empty-state">
                      <h2>No matching checks.</h2>
                      <p>
                        Try another search or reset your filters to see the
                        whole report.
                      </p>
                    </div>
                  )}
                  {visible.map((c) => (
                    <section key={c.name} className="result-category">
                      <div className="category-heading">
                        <h2>{c.name}</h2>
                        <span>{c.score}/100</span>
                      </div>
                      {c.items.map((item) => (
                        <article className="result-row" key={item.name}>
                          <span
                            className={`status-symbol ${item.status}`}
                            aria-hidden="true"
                          >
                            {item.status === "success"
                              ? "✓"
                              : item.status === "warning"
                                ? "!"
                                : "×"}
                          </span>
                          <div className="result-content">
                            <div className="result-item-heading">
                              <h3>{item.name}</h3>
                              <span className={`status-badge ${item.status}`}>
                                {labels[item.status]}
                              </span>
                            </div>
                            <p>{item.message}</p>
                            {item.preview && (
                              <details>
                                <summary>View detected value</summary>
                                <pre>{item.preview}</pre>
                              </details>
                            )}
                          </div>
                        </article>
                      ))}
                    </section>
                  ))}
                </div>
              </div>
              <p className="report-footnote">
                A check score is a checklist summary, not a security
                certification, search ranking, or performance score.
              </p>
              <p role="status" className="notice">
                {notice}
              </p>
            </>
          )
        )}
      </main>
      <Footer />
    </>
  );
}
