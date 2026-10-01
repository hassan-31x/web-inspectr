require("./check-analysis.cjs");
const { safeFetch } = require("../src/lib/safe-fetch.ts");
(async () => {
  for (const url of process.argv.length > 2
    ? process.argv.slice(2)
    : ["https://www.wikipedia.org"]) {
    try {
      const response = await safeFetch(url);
      console.log(url, response.status, response.body.length);
    } catch (err) {
      console.error(url, err);
      process.exitCode = 1;
    }
  }
})();
