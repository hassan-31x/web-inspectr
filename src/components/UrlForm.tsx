"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalizeUrl } from "@/lib/analysis";
export default function UrlForm({
  compact = false,
  initialUrl = "",
}: {
  compact?: boolean;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  function submit(e: FormEvent) {
    e.preventDefault();
    try {
      const normalized = normalizeUrl(url);
      setError("");
      setLoading(true);
      router.push(`/analyze?url=${encodeURIComponent(normalized)}`);
    } catch {
      setError("Enter a valid website address, such as example.com.");
    }
  }
  return (
    <div className={compact ? "url-form compact" : "url-form"}>
      <form onSubmit={submit} noValidate>
        <label htmlFor={compact ? "report-url" : "website-url"}>
          Website address
        </label>
        <div className="url-input-row">
          <span className="url-prefix" aria-hidden="true">
            ↗
          </span>
          <input
            id={compact ? "report-url" : "website-url"}
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="yourwebsite.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError("");
              setLoading(false);
            }}
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? "url-error" : "url-hint"}
          />
          <button className="button primary" disabled={loading}>
            {loading ? "Opening report…" : "Check website"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
        {error ? (
          <p id="url-error" role="alert" className="form-error">
            {error}
          </p>
        ) : (
          <p id="url-hint" className="form-hint">
            A public URL is all you need. We’ll add https:// for you.
          </p>
        )}
      </form>
      {!compact && (
        <div className="form-bottom">
          <span>No account. No setup.</span>
          <Link href="/analyze?demo=true">
            Explore a sample report <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
