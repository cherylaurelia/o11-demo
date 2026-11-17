import data from "@/data/w26.json";
import { CompanyTable } from "./company-table";

const REPO = "https://github.com/cherylaurelia/o11-demo";
const RECEIPTS = `${REPO}/blob/main/receipts/w26-route.jsonl`;

const QUALIFY =
  "https://github.com/o11-ai/o11-wallet-sdk/blob/33d7984/src/ostack/content/playbooks/gtm/steps/qualify.md#L15";

const { summary, rows } = data;
const totalUsd = (summary.totalMicros / 1_000_000).toFixed(5);

const command = `o11 batch o11.companies.enrich --rows companies.csv --map domain=domain \\
  --run-id "$(o11 session-id)" --run-max 0.20 --concurrency 4`;

const mapping = `// crustdata.companies.identify -> route output
domain:    match.matched_on ?? basic_info.primary_domain,  // today: basic_info.all_domains[0]
employees: basic_info.employee_count_range,                // today: not in output`;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <div className="text-2xl font-semibold tracking-tight text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <nav className="flex items-center justify-between py-5 text-sm">
        <span className="font-medium">
          Unofficial demo <span className="text-muted">· Cheryl Aurelia</span>
        </span>
        <a href={REPO} className="rounded-md bg-ink px-3 py-1.5 text-white hover:bg-ink/90">
          Repo
        </a>
      </nav>

      <section className="pt-8 sm:pt-14">
        <h1 className="max-w-3xl text-3xl leading-tight font-medium tracking-tight text-balance sm:text-5xl">
          All of YC W26, enriched through one o11 wallet for ${totalUsd}.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-body sm:text-lg">
          The <code className="rounded bg-soft px-1 font-mono text-[0.9em]">o11.companies.enrich</code> route found all{" "}
          {summary.companies}. But its <code className="rounded bg-soft px-1 font-mono text-[0.9em]">output</code> drops
          headcount on every crustdata hit, and for {summary.outputDomainOtherName + 1} companies it names a domain that
          points somewhere else.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <a href={REPO} className="rounded-lg bg-ink px-4 py-2 text-white hover:bg-ink/90">
            Code and receipts
          </a>
          <a href={RECEIPTS} className="rounded-lg bg-line px-4 py-2 text-ink hover:bg-line/80">
            All {summary.companies} receipts (JSONL)
          </a>
        </div>
      </section>

      <p className="mt-8 text-sm text-body sm:hidden">
        {summary.hits}/{summary.companies} hits · ${totalUsd} total* · {summary.byProvider.crustdata} free via crustdata ·{" "}
        {summary.byProvider.crawl4ai} via crawl4ai
      </p>
      <section className="mt-10 hidden grid-cols-4 gap-3 sm:grid" aria-label="Results">
        <Stat value={`${summary.hits}/${summary.companies}`} label="route outcome: hit" />
        <Stat value={`$${totalUsd}*`} label="total billed, every row" />
        <Stat value={`${summary.byProvider.crustdata}`} label="served free by crustdata" />
        <Stat value={`${summary.byProvider.crawl4ai}`} label="fell through to crawl4ai, $0.00115 each" />
      </section>
      <p className="mt-2 text-xs text-muted">
        * Two runs: o11&apos;s cache served {summary.cached} rows of this batch from an earlier run of mine, which paid
        $0.00115 for one of them. A fresh rerun may differ by that much.
      </p>

      <section className="mt-6 rounded-xl border border-line bg-card p-5" aria-labelledby="gaps">
        <h2 id="gaps" className="text-lg font-medium tracking-tight">
          What reading only <code className="font-mono text-base">output</code> gets you
        </h2>
        <ul className="mt-3 space-y-3 text-sm text-body">
          <li>
            <strong className="font-medium text-ink">The wrong people.</strong> Vercel&apos;s output.domain came back as
            nextjs.org (earlier 50-company run). <code className="font-mono text-xs">o11.people.search</code> for owners there
            returned one software engineer with no Vercel tie ($0.0026). For Maywood, shanghaimaywood.com paid a $0.0245
            fallback, and one of the two people returned is an &ldquo;Owner, maywood&rdquo; in Itasca, not the New York
            startup. The right domain, maywoodai.com, returned the CEO for free.
          </li>
          <li>
            <strong className="font-medium text-ink">
              Only {summary.outputDomainOtherName} (+1) domains point elsewhere.
            </strong>{" "}
            output.domain is <code className="font-mono text-xs">all_domains[0]</code>, and it differs from the domain looked up
            for {summary.outputDomainDiffers} of {summary.byProvider.crustdata}. {summary.outputDomainOtherName} carry another
            name (moritzlegal.com → arcline-ai.com, foreman.co → scoutout.ai), plus maywoodai.com → shanghaimaywood.com. The
            other {summary.outputDomainDiffers - summary.outputDomainOtherName - 1} are harmless variants (usechamber.io →
            usechamber.com).
          </li>
          <li>
            <strong className="font-medium text-ink">
              No headcount, {summary.headcountDropped} of {summary.byProvider.crustdata}.
            </strong>{" "}
            The raw record has <code className="font-mono text-xs">employee_count_range</code> every time; output leaves it
            out.
          </li>
        </ul>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-soft p-3 font-mono text-xs leading-relaxed text-ink">
          {mapping}
        </pre>
        <p className="mt-3 text-xs text-muted">
          Why it counts as a bug: the docs list <code className="font-mono">result.output</code> as &ldquo;The answer&rdquo; (
          <a className="underline" href="https://docs.o11.ai/execution/">
            docs.o11.ai/execution
          </a>
          ), and Ostack&apos;s qualify step says enrich &ldquo;returns headcount and industry&rdquo; (
          <a className="underline" href={QUALIFY}>
            steps/qualify.md, line 15
          </a>
          ). Agents reading the whole receipt were fine: in 40 Claude Sonnet runs on these receipts they took headcount and
          domain from the raw record every time.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-medium tracking-tight">The batch</h2>
        <p className="mt-2 max-w-2xl text-sm text-body">
          Every YC W26 company with a website on the public YC list, looked up by domain. Headcount, founding year and
          industry come from each receipt.
        </p>
        <div className="mt-4">
          <CompanyTable rows={rows} />
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-medium tracking-tight">How I ran it</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs leading-relaxed text-[#f4f4f5]">
            {command}
          </pre>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-body">
            <li>A new o11 account&apos;s $1 free credit, with a CLI key limited to running tools (no cards, no API keys).</li>
            <li>
              The route tried crustdata first (free). On a miss it fell through to crawl4ai and billed only that call.
            </li>
            <li>
              <code className="font-mono text-xs">--run-max</code> caps the whole run. Rerunning the same command with the same
              journal returned the same invocation IDs, and the balance didn&apos;t move.
            </li>
          </ul>
        </div>

        <div className="text-sm text-body md:pt-9">
          <p>
            Receipts for every row are in the repo, with the parser that reads them and tests that recount the
            page&apos;s counts from the receipts.
          </p>
        </div>
      </section>

      <footer className="mt-16 border-t border-line pt-5 text-xs text-muted">
        Unofficial demo by Cheryl Aurelia: not affiliated with o11. Company data is what o11&apos;s route returned on
        2026-11-16; the company list is from the public YC directory.
      </footer>
    </main>
  );
}
