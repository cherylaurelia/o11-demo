import data from "@/data/w26.json";
import { CompanyTable } from "./company-table";

const REPO = "https://github.com/cherylaurelia/o11-demo";
const RECEIPTS = `${REPO}/blob/main/receipts/w26-route.jsonl`;
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
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden className="h-4 w-5 rounded-[4px] bg-[linear-gradient(180deg,#f2c94c_0_33%,#eb5757_33%_66%,#4494e5_66%)]" />
          YC W26 × o11 wallet
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
          {summary.companies} companies, one <code className="rounded bg-soft px-1 font-mono text-[0.9em]">o11 batch</code> command
          on <code className="rounded bg-soft px-1 font-mono text-[0.9em]">o11.companies.enrich</code>, no provider accounts.
          The route found every one of them, most with teams under ten people.
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

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Results">
        <Stat value={`${summary.hits}/${summary.companies}`} label="route outcome: hit" />
        <Stat value={`$${totalUsd}`} label="total billed, every row" />
        <Stat value={`${summary.byProvider.crustdata}`} label="served free by crustdata" />
        <Stat value={`${summary.byProvider.crawl4ai}`} label="fell through to crawl4ai, $0.00115 each" />
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
              {summary.cached} rows came from o11&apos;s cache of an earlier run of mine, at $0 (that run paid $0.00115 for one of
              them). The ${totalUsd} includes it.
            </li>
            <li>
              <code className="font-mono text-xs">--run-max</code> caps the whole run. Rerunning the same command with the same
              journal returned the same invocation IDs, and the balance didn&apos;t move.
            </li>
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-card p-5">
          <h2 className="text-xl font-medium tracking-tight">Two fields in the route&apos;s output</h2>
          <p className="mt-2 text-sm text-body">
            The docs call <code className="font-mono text-xs">result.output</code> &ldquo;the answer&rdquo;. On the{" "}
            {summary.byProvider.crustdata} crustdata hits:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-body">
            <li>
              <strong className="font-medium text-ink">No headcount</strong> in output for {summary.headcountDropped} of{" "}
              {summary.byProvider.crustdata}, although the raw record has{" "}
              <code className="font-mono text-xs">employee_count_range</code>. Ostack&apos;s qualify step says enrich
              &ldquo;returns headcount&rdquo;.
            </li>
            <li>
              <strong className="font-medium text-ink">output.domain</strong> is{" "}
              <code className="font-mono text-xs">all_domains[0]</code>. It differs from the domain looked up for{" "}
              {summary.outputDomainDiffers}, often a pre-pivot name: moritzlegal.com → arcline-ai.com, maywoodai.com →
              shanghaimaywood.com.
            </li>
          </ul>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-soft p-3 font-mono text-xs leading-relaxed text-ink">
            {mapping}
          </pre>
          <p className="mt-3 text-xs text-muted">
            Agents reading the whole receipt cope: in a small test (40 Sonnet runs on these receipts) they took headcount and
            domain from the raw record every time. Code that reads only <code className="font-mono">output</code> gets the
            gaps.
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
