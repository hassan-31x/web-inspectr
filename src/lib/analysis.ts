export type Status = "success" | "warning" | "error";
export interface AnalysisItem {
  name: string;
  status: Status;
  message: string;
  preview?: string;
}
export interface AnalysisCategory {
  name: string;
  score: number;
  items: AnalysisItem[];
}
export interface AnalysisResult {
  url: string;
  overallScore: number;
  categories: AnalysisCategory[];
  timestamp: string;
}
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value || /\s/.test(value))
    throw new Error("Enter a valid website address, such as example.com.");
  const url = new URL(
    /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
  );
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !url.hostname.includes(".")
  ) {
    throw new Error("Enter a public HTTP or HTTPS website address.");
  }
  url.hash = "";
  return url.href;
}
export function score(items: AnalysisItem[]) {
  return items.length
    ? Math.round(
        (items.reduce(
          (sum, item) =>
            sum +
            (item.status === "success"
              ? 1
              : item.status === "warning"
                ? 0.5
                : 0),
          0,
        ) /
          items.length) *
          100,
      )
    : 0;
}
export const HISTORY_KEY = "inspectr-recent-scans";
export interface RecentScan {
  url: string;
  overallScore: number;
  timestamp: string;
}
