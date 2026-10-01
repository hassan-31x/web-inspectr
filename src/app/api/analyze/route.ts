import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, AnalysisItem } from "@/lib/analysis";
import { analyzeHtml } from "@/lib/checks";
import { safeFetch } from "@/lib/safe-fetch";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  let url: string;
  try {
    url = normalizeUrl(request.nextUrl.searchParams.get("url") || "");
  } catch {
    return NextResponse.json(
      { error: "Enter a valid public HTTP or HTTPS website address." },
      { status: 400 },
    );
  }
  try {
    const response = await safeFetch(url);
    if (response.status < 200 || response.status >= 300)
      return NextResponse.json(
        {
          error: `The website returned HTTP ${response.status}. Check the address or try again later.`,
        },
        { status: 422 },
      );
    if (
      !/text\/html|application\/xhtml\+xml/i.test(
        response.headers["content-type"],
      )
    )
      return NextResponse.json(
        {
          error:
            "This address does not return an HTML page. Enter a website page URL.",
        },
        { status: 422 },
      );
    const files: AnalysisItem[] = await Promise.all(
      [
        {
          path: "/robots.txt",
          valid: (body: string) => /user-agent\s*:/i.test(body),
          hint: "Add a robots.txt file to declare crawler rules.",
        },
        {
          path: "/sitemap.xml",
          valid: (body: string) => /<(urlset|sitemapindex)\b/i.test(body),
          hint: "Add a sitemap, or verify that your sitemap uses another path.",
        },
        {
          path: "/.well-known/security.txt",
          valid: (body: string) => /^Contact\s*:/im.test(body),
          hint: "Consider publishing a security contact file at this standard path.",
        },
      ].map(async (file) => {
        try {
          const found = await safeFetch(
            new URL(file.path, response.url).href,
            512 * 1024,
          );
          const valid =
            found.status === 200 &&
            file.valid(found.body) &&
            !/text\/html/i.test(found.headers["content-type"]);
          return {
            name: file.path,
            status: valid ? "success" : "warning",
            message: valid
              ? "File found with recognizable content."
              : `${found.status === 200 ? "Expected file content was not found." : `Returned HTTP ${found.status}.`} ${file.hint}`,
            preview: valid ? found.body.slice(0, 3000) : undefined,
          } as AnalysisItem;
        } catch {
          return {
            name: file.path,
            status: "warning",
            message:
              "Could not verify this file. Check it manually; the request may have been blocked or timed out.",
          } as AnalysisItem;
        }
      }),
    );
    return NextResponse.json(
      analyzeHtml(response.url, response.body, response.headers, files),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          /private|public|too (long|large|many)|standard ports/i.test(
            error.message,
          )
            ? error.message
            : "We could not reach this website. Check that it is public and allows automated requests, then try again.",
      },
      { status: 422 },
    );
  }
}
