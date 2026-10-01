import { analyzeHtml } from "./checks";
export function createDemoResult() {
  return analyzeHtml(
    "https://example.com/",
    '<!doctype html><html lang="en"><head><title>Example domain</title><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="canonical" href="https://example.com/"><meta property="og:title" content="Example domain"><link rel="icon" href="/favicon.ico"></head><body><main><h1>Example domain</h1><p>An illustrative page for this sample report.</p><img src="/sample.jpg"></main></body></html>',
    { "cache-control": "max-age=3600", "x-content-type-options": "nosniff" },
    [
      {
        name: "/robots.txt",
        status: "success",
        message: "Sample crawler rules found.",
        preview: "User-agent: *\nAllow: /",
      },
      {
        name: "/sitemap.xml",
        status: "warning",
        message:
          "Sample sitemap is missing. Add a sitemap to help crawlers find your pages.",
      },
    ],
  );
}
