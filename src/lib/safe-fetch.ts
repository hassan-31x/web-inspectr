import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import http from "node:http";
import https from "node:https";

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  // Only globally routable IPv6 unicast; mapped IPv4 and local ranges are excluded.
  return isIP(address) === 6 && /^[23][0-9a-f]{3}:/i.test(address);
}
export async function safeFetch(
  input: string,
  limit = 2 * 1024 * 1024,
  redirects = 0,
): Promise<{
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
}> {
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !["80", "443"].includes(url.port))
  )
    throw new Error(
      "Only public HTTP and HTTPS websites on standard ports are supported.",
    );
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(hostname, { all: true });
  if (
    !addresses.length ||
    addresses.some((entry) => !isPublicAddress(entry.address))
  )
    throw new Error("Private and local network addresses cannot be analyzed.");
  const pinned = addresses[0];
  const response = await new Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
  }>((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const req = transport.get(
      url,
      {
        family: pinned.family,
        headers: {
          "User-Agent": "Inspectr/1.0 website-check",
          Accept: "text/html,application/xml,text/plain,*/*",
          "Accept-Encoding": "identity",
        },
        lookup: (_host, _options, callback) =>
          callback(null, pinned.address, pinned.family),
      },
      (res) => {
        const headers = Object.fromEntries(
          Object.entries(res.headers).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(", ") : value || "",
          ]),
        );
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > limit) {
            req.destroy(new Error("The response is too large to analyze."));
          } else chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({
            status: res.statusCode || 500,
            headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
        res.on("error", reject);
      },
    );
    const deadline = setTimeout(
      () =>
        req.destroy(
          new Error("The website took too long to respond. Try again."),
        ),
      10000,
    );
    req.on("close", () => clearTimeout(deadline));
    req.on("error", reject);
  });
  if (
    [301, 302, 303, 307, 308].includes(response.status) &&
    response.headers.location
  ) {
    if (redirects >= 4)
      throw new Error("The website redirected too many times.");
    return safeFetch(
      new URL(response.headers.location, url).href,
      limit,
      redirects + 1,
    );
  }
  return { ...response, url: url.href };
}
