import { load } from "cheerio";
import { AnalysisItem, AnalysisResult, score } from "./analysis";

export function analyzeHtml(
  url: string,
  html: string,
  headers: Record<string, string>,
  fileItems: AnalysisItem[] = [],
): AnalysisResult {
  const $ = load(html);
  const meta = (name: string) =>
    $(`meta[name="${name}"], meta[property="${name}"]`)
      .first()
      .attr("content")
      ?.trim();
  const present = (
    name: string,
    value: string | undefined,
    missing: string,
    critical = false,
  ): AnalysisItem => ({
    name,
    status: value ? "success" : critical ? "error" : "warning",
    message: value ? `${name} is present.` : missing,
    preview: value,
  });
  const title = $("title").first().text().trim();
  const description = meta("description");
  const structured = $('script[type="application/ld+json"]');
  let validJson = true;
  structured.each((_, el) => {
    try {
      JSON.parse($(el).text());
    } catch {
      validJson = false;
    }
  });
  const images = $("img");
  const missingAlt = images.filter(
    (_, el) => $(el).attr("alt") === undefined,
  ).length;
  const size = Buffer.byteLength(html, "utf8");
  const categories = [
    {
      name: "Metadata",
      items: [
        present(
          "Page title",
          title,
          "Add a descriptive <title> to the page.",
          true,
        ),
        present(
          "Meta description",
          description,
          "Add a meta description that summarizes the page.",
          true,
        ),
        present(
          "Canonical URL",
          $('link[rel="canonical"]').attr("href"),
          "Add a canonical URL to identify the preferred page address.",
        ),
        present(
          "Viewport",
          meta("viewport"),
          "Add a viewport meta tag for mobile screens.",
          true,
        ),
        present(
          "Page language",
          $("html").attr("lang"),
          "Set the lang attribute on the <html> element.",
          true,
        ),
        {
          name: "Indexing",
          status: /noindex/i.test(
            `${meta("robots") || ""} ${headers["x-robots-tag"] || ""}`,
          )
            ? "warning"
            : "success",
          message: /noindex/i.test(
            `${meta("robots") || ""} ${headers["x-robots-tag"] || ""}`,
          )
            ? "This page asks search engines not to index it. Confirm this is intentional."
            : "No noindex directive found in the page or response headers.",
        } as AnalysisItem,
      ],
    },
    {
      name: "Social sharing",
      items: [
        present(
          "Open Graph title",
          meta("og:title"),
          "Add og:title for shared link previews.",
        ),
        present(
          "Open Graph description",
          meta("og:description"),
          "Add og:description for shared link previews.",
        ),
        present(
          "Open Graph image",
          meta("og:image"),
          "Add og:image to give shared links an image.",
        ),
        present(
          "Open Graph URL",
          meta("og:url"),
          "Add og:url with the canonical page address.",
        ),
        present(
          "Twitter card",
          meta("twitter:card"),
          "Add twitter:card to specify the preview format.",
        ),
      ],
    },
    {
      name: "Icons & discovery",
      items: [
        present(
          "Favicon",
          $('link[rel~="icon"]').first().attr("href"),
          'Declare a favicon with a <link rel="icon"> element.',
        ),
        present(
          "Touch icon",
          $('link[rel="apple-touch-icon"]').attr("href"),
          "Add an Apple touch icon if users save the site to their home screen.",
        ),
        {
          name: "Structured data",
          status: structured.length
            ? validJson
              ? "success"
              : "error"
            : "warning",
          message: structured.length
            ? validJson
              ? `${structured.length} JSON blocks parse successfully. Schema semantics have not been validated.`
              : "Fix invalid JSON in the structured data blocks."
            : "No JSON structured data found. Add it if relevant to this page.",
          preview: structured.first().text().trim() || undefined,
        } as AnalysisItem,
      ],
    },
    {
      name: "Accessibility",
      items: [
        {
          name: "Image alternatives",
          status: missingAlt ? "error" : "success",
          message: missingAlt
            ? `${missingAlt} of ${images.length} images lack an alt attribute. Add descriptive text, or an empty alt for decorative images.`
            : `${images.length} images checked. None lack an alt attribute; text quality requires manual review.`,
        } as AnalysisItem,
        {
          name: "Main heading",
          status: $("h1").length === 1 ? "success" : "warning",
          message: `Found ${$("h1").length} main headings. A single descriptive H1 gives the page a clear starting point.`,
        } as AnalysisItem,
        present(
          "Main landmark",
          $('main, [role="main"]').length ? "Present" : undefined,
          "Add a <main> landmark so visitors can navigate to the primary content.",
        ),
      ],
    },
    {
      name: "Delivery",
      items: [
        {
          name: "HTML size",
          status: size < 200 * 1024 ? "success" : "warning",
          message: `The HTML response is ${(size / 1024).toFixed(1)} KB before compression. This is not a page speed measurement.`,
          preview: `${size.toLocaleString()} bytes`,
        } as AnalysisItem,
        present(
          "Cache policy",
          headers["cache-control"],
          "No Cache-Control header found. Review the caching policy for this page.",
        ),
        {
          name: "Image dimensions",
          status: images.filter(
            (_, el) => !$(el).attr("width") || !$(el).attr("height"),
          ).length
            ? "warning"
            : "success",
          message: `${images.filter((_, el) => !$(el).attr("width") || !$(el).attr("height")).length} of ${images.length} images lack explicit width or height attributes. CSS may reserve space instead; review layout stability in a browser.`,
        } as AnalysisItem,
      ],
    },
    {
      name: "Security",
      items: [
        {
          name: "HTTPS",
          status: new URL(url).protocol === "https:" ? "success" : "error",
          message:
            new URL(url).protocol === "https:"
              ? "The final page address uses HTTPS."
              : "Serve this page over HTTPS to encrypt the connection.",
        } as AnalysisItem,
        present(
          "Content security policy",
          headers["content-security-policy"],
          "Consider a Content-Security-Policy header to control which resources may load.",
        ),
        {
          name: "Content type protection",
          status:
            headers["x-content-type-options"]?.toLowerCase() === "nosniff"
              ? "success"
              : "warning",
          message:
            headers["x-content-type-options"]?.toLowerCase() === "nosniff"
              ? "X-Content-Type-Options is set to nosniff."
              : "Set X-Content-Type-Options to nosniff.",
        } as AnalysisItem,
        present(
          "Strict transport security",
          headers["strict-transport-security"],
          "Review adding HSTS once your domain consistently uses HTTPS.",
        ),
      ],
    },
    ...(fileItems.length ? [{ name: "Site files", items: fileItems }] : []),
  ].map((category) => ({ ...category, score: score(category.items) }));
  return {
    url,
    categories,
    overallScore: score(categories.flatMap((category) => category.items)),
    timestamp: new Date().toISOString(),
  };
}
