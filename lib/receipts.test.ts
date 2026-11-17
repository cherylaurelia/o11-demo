import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { bareDomain, headcountDropped, outputDomainDiffers, parseReceipt } from "./receipts.ts";

const lines = readFileSync(new URL("../receipts/w26-route.jsonl", import.meta.url), "utf8").trim().split("\n");

const byDomain = (domain: string) => {
  const line = lines.find((entry) => entry.includes(`"input": {"domain": "${domain}"}`));
  assert.ok(line, `no receipt for ${domain}`);

  return parseReceipt(line);
};

test("bareDomain normalizes scheme, www and path", () => {
  assert.equal(bareDomain("https://www.Vercel.com/"), "vercel.com");
  assert.equal(bareDomain("shofo.ai"), "shofo.ai");
  assert.equal(bareDomain(""), null);
  assert.equal(bareDomain(null), null);
});

test("crustdata hit: headcount only in raw, output domain matches", () => {
  const row = byDomain("menza.ai");
  assert.equal(row.provider, "crustdata");
  assert.equal(row.headcountRaw, "2-10");
  assert.equal(row.headcountInOutput, null);
  assert.equal(headcountDropped(row), true);
  assert.equal(outputDomainDiffers(row), false);
});

test("crustdata hit: output.domain is another domain than the site looked up", () => {
  const row = byDomain("moritzlegal.com");
  assert.equal(row.primaryDomain, "moritzlegal.com");
  assert.equal(row.outputDomain, "arcline-ai.com");
  assert.equal(outputDomainDiffers(row), true);
});

test("crawl4ai hit (not from cache): headcount is in output, nothing dropped, billed", () => {
  const line = lines.find((entry) => entry.includes('"provider": "crawl4ai"}') && entry.includes('"cached": null'));
  assert.ok(line);
  const row = parseReceipt(line);
  assert.equal(row.provider, "crawl4ai");
  assert.equal(headcountDropped(row), false);
  assert.equal(row.cached, false);
  assert.ok(row.billedMicros > 0);
});

test("whole batch: every row a hit; counts used on the page", () => {
  const rows = lines.map(parseReceipt);
  assert.equal(rows.length, 197);
  assert.equal(rows.filter((row) => row.outcome === "hit").length, 197);
  assert.equal(rows.filter((row) => row.provider === "crustdata").length, 186);
  assert.equal(rows.filter(headcountDropped).length, 186);
  assert.equal(rows.filter(outputDomainDiffers).length, 18);
});
