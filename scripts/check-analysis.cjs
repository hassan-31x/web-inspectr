const ts = require("typescript");
const fs = require("node:fs");
const assert = require("node:assert/strict");
require.extensions[".ts"] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
const { normalizeUrl, score } = require("../src/lib/analysis.ts");
const { analyzeHtml } = require("../src/lib/checks.ts");
const { isPublicAddress, safeFetch } = require("../src/lib/safe-fetch.ts");
assert.equal(normalizeUrl("  example.com/path  "), "https://example.com/path");
for (const url of [
  "javascript:alert(1)",
  "file:///etc/passwd",
  "https://user:pass@example.com",
  "",
  "not a domain",
])
  assert.throws(() => normalizeUrl(url));
for (const ip of [
  "127.0.0.1",
  "10.1.2.3",
  "172.16.0.1",
  "192.168.1.1",
  "169.254.169.254",
  "100.64.0.1",
  "::1",
  "fc00::1",
  "::ffff:127.0.0.1",
])
  assert.equal(isPublicAddress(ip), false, ip);
for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])
  assert.equal(isPublicAddress(ip), true, ip);
assert.equal(
  score([{ status: "success" }, { status: "warning" }, { status: "error" }]),
  50,
);
const fixture =
  '<html lang="en"><head><title>Test site</title><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><script type="application/ld+json">{bad}</script></head><body><main><h1>Hello</h1><img src="a"><img alt="" src="b"></main></body></html>';
const result = analyzeHtml("https://example.com/", fixture, {
  "x-content-type-options": "nosniff",
});
const items = result.categories.flatMap((category) => category.items);
assert.equal(items.find((item) => item.name === "HTTPS").status, "success");
assert.equal(items.find((item) => item.name === "Indexing").status, "warning");
assert.equal(
  items.find((item) => item.name === "Structured data").status,
  "error",
);
assert.match(
  items.find((item) => item.name === "Image alternatives").message,
  /1 of 2/,
);
assert.equal(result.overallScore, score(items));
assert.equal(
  analyzeHtml("http://example.com/", fixture, {}).categories.find(
    (c) => c.name === "Security",
  ).items[0].status,
  "error",
);
(async () => {
  await assert.rejects(safeFetch("http://127.0.0.1/"), /Private/);
  await assert.rejects(
    safeFetch("https://example.com:8443/"),
    /standard ports/,
  );
  console.log(
    "Analysis checks passed: URL validation, network restrictions, scoring, HTTPS, indexing, structured data, and image alternatives.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
