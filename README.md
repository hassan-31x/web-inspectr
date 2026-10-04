# Inspectr

A small website checker for the details that are easy to miss before launch. Enter a public website URL, review the findings, and export a JSON report.

## Local development

Use Node.js 24 LTS and npm. The supported minimum is Node.js 20.18.1 (Cheerio requires a newer patch release than Next.js's 20.9 minimum).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For another port, run `npm run dev -- --port 3100`.

```sh
npm run build
npm start
npm run lint
npm test
```

`lint` runs TypeScript validation. `test` runs focused analysis and network restriction regression checks.

No environment variables, API keys, database, or external analysis service are required. `npm ci` installs the versions recorded in `package-lock.json`. Next.js downloads the Geist fonts from Google during builds, so the build environment needs outbound network access.

## What it does

- Inspects metadata, indexing directives, social preview tags, declared icons, and structured data JSON syntax.
- Checks image alt attributes, main headings, landmarks, image dimension attributes, HTML size, caching, HTTPS, and security headers.
- Requests robots.txt, sitemap.xml, and /.well-known/security.txt concurrently and verifies recognizable content.
- Provides category navigation, search, status filters, detected values, retry, rerun, and JSON export.
- Stores the five most recent successful checks in browser local storage. Clear history from the home page. Revisiting a check runs it again.
- Offers an explicitly labeled sample report at `/analyze?demo=true`. Sample data is separate from live results.

## Scope and scoring

Inspectr reads server HTML without executing JavaScript. It does not measure Core Web Vitals, validate structured data semantics, crawl the entire website, or provide a complete accessibility or security audit. A check score is the percentage of checklist points earned: passed = 1, review = 0.5, fix = 0. Missing recommendations should be reviewed in the site's context.

Site file checks use conventional paths; a sitemap at another path may require manual verification. Requests ask for uncompressed content so the parser can inspect HTML; compression is not scored. The page response is capped at 2 MB and site files at 512 KB. Each request has a ten second deadline and allows four redirects. Redirect targets and DNS addresses are checked, and the HTTP connection is pinned to a validated public address. Local/private networks, credentials, nonstandard ports, and non-HTTP protocols are rejected.

Hosts may block automated requests, in which case the UI presents an actionable error instead of returning mock results.

## Architecture

The app uses the Next.js App Router. `/` renders the URL form and recent checks; `/analyze?url=...` renders a report inside a Suspense boundary. The report is a client component that requests the same-origin analysis API, supports cancellation when leaving the page, and implements filtering and JSON export. `/analyze?demo=true` uses a local fixture without requesting a target website.

For a live check, the API normalizes the supplied URL, fetches its HTML, and then requests the three conventional site files concurrently using the final page URL as their base. Cheerio parses the HTML into seven report categories, including the site file results. The overall score is calculated across all items, rather than averaging the category scores.

| Path | Responsibility |
| --- | --- |
| `src/app/api/analyze/route.ts` | Node.js route handler, response validation, site file checks, and HTTP errors |
| `src/lib/safe-fetch.ts` | DNS validation, pinned HTTP/HTTPS connections, redirects, deadlines, and response limits |
| `src/lib/checks.ts` | HTML/header inspection and category construction |
| `src/lib/analysis.ts` | Shared TypeScript report types, URL normalization, scoring, and history key |
| `src/app/analyze/_components/index.tsx` | Live/demo report state, search, filters, rerun, and download |
| `src/components/RecentScans.tsx` | Browser-local history display and clearing |
| `scripts/check-analysis.cjs` | Regression checks using local HTML fixtures and blocked network targets |

The server does not persist reports. Browser history uses the `inspectr-recent-scans` local storage key and retains up to five successful scans with only their URL, score, and timestamp. The complete report remains in component state and can be downloaded as JSON.

## Analysis API

Send a GET request with a URL-encoded `url` query parameter. Addresses without a scheme default to HTTPS; fragments are removed.

```sh
curl --get 'http://localhost:3000/api/analyze' \
  --data-urlencode 'url=https://example.com'
```

A successful response has this shape (the category and item below are illustrative):

```json
{
  "url": "https://example.com/",
  "overallScore": 75,
  "categories": [
    {
      "name": "Metadata",
      "score": 75,
      "items": [
        {
          "name": "Page title",
          "status": "success",
          "message": "Page title is present.",
          "preview": "Example Domain"
        }
      ]
    }
  ],
  "timestamp": "2026-10-04T00:00:00.000Z"
}
```

`url` is the final address after redirects, `timestamp` is an ISO 8601 UTC string, and scores are rounded percentages from 0 to 100. Each item has a `success`, `warning`, or `error` status; `preview` is optional. Successful responses send `Cache-Control: no-store`.

| HTTP status | Meaning |
| --- | --- |
| `200` | HTML was analyzed; individual findings may still need attention |
| `400` | Missing or invalid URL |
| `422` | Target could not be analyzed: blocked address, network failure, redirect/size/deadline limit, non-2xx page response, or non-HTML content |

Error responses contain `{ "error": "..." }`. Unavailable site files become warning items rather than failing an otherwise valid page analysis.

## Network safeguards and deployment

The API explicitly runs in the Node.js runtime because it uses Node DNS, HTTP, and HTTPS modules. Every request and redirect resolves the hostname, rejects it if any returned address fails the public-address check, and pins the connection to a validated address. This limits server-side request forgery and DNS rebinding; implementation details are in `src/lib/safe-fetch.ts`.

Requests identify themselves as `Inspectr/1.0 website-check` and send `Accept-Encoding: identity`. The ten-second deadline applies to each HTTP request after DNS resolution; it is not an overall scan timeout. A scan can make several sequential requests when redirects are involved, followed by concurrent site file requests.

Deploy to a Node.js-compatible Next.js host with outbound DNS and HTTP/HTTPS access. Static export and an Edge-only runtime cannot serve the analysis API. Build with `npm run build`, then serve with `npm start`; Next.js 16 uses Turbopack by default for development and production builds. Configure hosting-level rate limits and function timeouts for the expected traffic and scan duration. No application-level rate limiter is currently implemented.

## Verification

```sh
npm run lint
npm test
npm run build
```

The regression script transpiles the analysis modules with the TypeScript 5 compiler API and checks URL normalization, scoring, HTML/header findings, private address rejection, and nonstandard port rejection. It does not depend on an external website. For an optional live network check:

```sh
node scripts/check-live.cjs https://example.com
```

The live check runs the regression checks first, then exercises `safeFetch` directly; it does not test the API or browser UI.

## Design and stack

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 through its PostCSS plugin, and Cheerio. React and DOM types track React 19; Node types track the recommended Node.js 24 runtime. Cheerio supplies its own types. The exact installed versions are recorded in `package-lock.json`.

The UI uses Geist, light neutral surfaces, restrained green, semantic status colors, keyboard focus states, responsive layouts, and reduced motion support. Design direction is documented in [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md). See the [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) for framework migration details.
