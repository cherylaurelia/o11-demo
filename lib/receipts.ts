// Reads one compact o11 receipt line from receipts/w26-route.jsonl into a table row.
// The route's `output` is what o11 calls "the answer"; the raw provider record sits next to it.
// Headcount and the provider's primary domain are read from raw, and we record where `output` differs.
import { z } from "zod";

const text = z.string().nullish();

const receiptSchema = z.object({
  input: z.object({ domain: z.string() }),
  yc: z.object({ slug: z.string(), name: z.string(), one_liner: z.string() }),
  invocationId: z.string(),
  billedMicros: z.string(),
  route: z.object({
    outcome: z.string(),
    servedBy: z.object({ provider: z.string() }),
    cached: z.object({ invocation: z.string() }).nullish(),
  }),
  output: z.object({
    domain: text,
    industry: text,
    linkedin_url: text,
    employees: z.union([z.number(), z.string()]).nullish(),
  }),
  raw: z.object({
    crustdata: z
      .object({
        basic_info: z.object({
          primary_domain: text,
          employee_count_range: text,
          year_founded: z.number().nullish(),
        }),
      })
      .optional(),
    crawl4ai: z.object({ domain: text, employees: z.number().nullish() }).optional(),
  }),
});

export interface CompanyRow {
  slug: string;
  name: string;
  oneLiner: string;
  inputDomain: string;
  outputDomain: string | null;
  primaryDomain: string | null;
  headcountInOutput: string | null;
  headcountRaw: string | null;
  industry: string | null;
  linkedin: string | null;
  founded: number | null;
  provider: string;
  outcome: string;
  billedMicros: number;
  cached: boolean;
  invocationId: string;
}

/** Strips scheme, "www." and path so vercel.com and https://www.vercel.com/ compare equal. */
export function bareDomain(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "") || null;
}

export function parseReceipt(line: string): CompanyRow {
  const receipt = receiptSchema.parse(JSON.parse(line));
  const crust = receipt.raw.crustdata?.basic_info;
  const crawl = receipt.raw.crawl4ai;
  const crawlEmployees = crawl?.employees ?? null;
  const outputEmployees = receipt.output.employees ?? null;

  return {
    slug: receipt.yc.slug,
    name: receipt.yc.name,
    oneLiner: receipt.yc.one_liner,
    inputDomain: bareDomain(receipt.input.domain) ?? "",
    outputDomain: bareDomain(receipt.output.domain),
    primaryDomain: bareDomain(crust?.primary_domain ?? crawl?.domain),
    headcountInOutput: outputEmployees === null ? null : String(outputEmployees),
    headcountRaw: crust?.employee_count_range ?? (crawlEmployees === null ? null : String(crawlEmployees)),
    industry: receipt.output.industry ?? null,
    linkedin: receipt.output.linkedin_url ?? null,
    founded: crust?.year_founded ?? null,
    provider: receipt.route.servedBy.provider,
    outcome: receipt.route.outcome,
    billedMicros: Number(receipt.billedMicros),
    cached: receipt.route.cached !== null && receipt.route.cached !== undefined,
    invocationId: receipt.invocationId,
  };
}

/** True when the route's output names a different site than the one the company was looked up by. */
export function outputDomainDiffers(row: CompanyRow): boolean {
  return row.outputDomain !== null && row.outputDomain !== row.inputDomain;
}

/** True when the raw record has a headcount that the route's output leaves out. */
export function headcountDropped(row: CompanyRow): boolean {
  return row.headcountRaw !== null && row.headcountInOutput === null;
}

/** True when output.domain still carries the company's first name word (usechamber.com for Chamber). */
export function outputDomainKeepsName(row: CompanyRow): boolean {
  const word = row.name.toLowerCase().split(/[^a-z0-9]+/).find((part) => part !== "") ?? "";

  return word !== "" && row.outputDomain !== null && row.outputDomain.includes(word);
}
