// Builds data/w26.json (what the page shows) from receipts/w26-route.jsonl (what o11 returned).
import { readFileSync, writeFileSync } from "node:fs";
import { headcountDropped, outputDomainDiffers, outputDomainKeepsName, parseReceipt } from "../lib/receipts.ts";

const lines = readFileSync(new URL("../receipts/w26-route.jsonl", import.meta.url), "utf8").trim().split("\n");
const rows = lines.map(parseReceipt).toSorted((a, b) => a.name.localeCompare(b.name));

// 40 rows were answered from o11's cache of an earlier run (233f7f0c) that paid $0.00115 for one of them (payna.com).
const earlierPaidMicros = 1150;
const billedMicros = rows.reduce((sum, row) => sum + row.billedMicros, 0);

const summary = {
  companies: rows.length,
  hits: rows.filter((row) => row.outcome === "hit").length,
  byProvider: Object.fromEntries(
    [...new Set(rows.map((row) => row.provider))].map((provider) => [provider, rows.filter((row) => row.provider === provider).length]),
  ),
  billedMicros,
  totalMicros: billedMicros + earlierPaidMicros,
  cached: rows.filter((row) => row.cached).length,
  headcountDropped: rows.filter(headcountDropped).length,
  outputDomainDiffers: rows.filter(outputDomainDiffers).length,
  outputDomainOtherName: rows.filter((row) => outputDomainDiffers(row) && !outputDomainKeepsName(row)).length,
};

writeFileSync(new URL("../data/w26.json", import.meta.url), JSON.stringify({ summary, rows }, null, 1) + "\n");

console.log(summary);
