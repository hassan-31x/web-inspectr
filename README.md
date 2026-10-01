# Inspectr

A small website checker for the details that are easy to miss before launch. Enter a public website URL, review the findings, and export a JSON report.

## Local development

Use Node.js 20 or later.

```sh
npm install
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

The API is `/api/analyze?url=...`. Hosts may block automated requests, in which case the UI presents an actionable error instead of returning mock results. A public production deployment should also apply hosting-level rate limits appropriate to its traffic.

## Design and stack

Next.js 15, React 19, TypeScript, Tailwind CSS 4, and Cheerio. The UI uses Geist, light neutral surfaces, restrained green, semantic status colors, keyboard focus states, responsive layouts, and reduced motion support. Design direction is documented in PRODUCT.md and DESIGN.md.
