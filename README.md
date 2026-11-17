# All of YC W26, enriched through one o11 wallet

Unofficial demo by Cheryl Aurelia, not affiliated with o11.

I ran every YC W26 company with a website on the public YC list (197, from
[yc-oss winter-2026.json](https://yc-oss.github.io/api/batches/winter-2026.json)) through o11's
`o11.companies.enrich` route with one `o11 batch` command, on a new account's $1 free credit and no provider
accounts (2026-11-16).

- **197/197 `route.outcome: hit`**, total billed **$0.01265**: 186 served free by crustdata, 11 fell through to
  crawl4ai at $0.00115 each. 40 rows came from o11's cache of an earlier run of mine (that run paid $0.00115 for
  one of them; included above).
- Rerunning the same command with the same journal returned the same invocation IDs; `o11 balance` didn't move.

## Two fields in the route's output

The docs call `result.output` "The answer" (https://docs.o11.ai/execution/). On the 186 crustdata hits:

- **Headcount is not in `output`** for 186/186, although the raw record has `employee_count_range` in every one.
  Ostack's qualify step says `o11.companies.enrich` "returns headcount and industry"
  (`src/ostack/content/playbooks/gtm/steps/qualify.md` in o11-ai/o11-wallet-sdk).
- **`output.domain` is `basic_info.all_domains[0]`** (186/186). For 18 it differs from the domain looked up,
  often an older name: moritzlegal.com → arcline-ai.com, maywoodai.com → shanghaimaywood.com, vercel.com → nextjs.org
  (Vercel was in an earlier 50-company test).

Suggested mapping for the crustdata step: `domain: matched_on ?? primary_domain`, `employees: employee_count_range`.

Agents reading the whole receipt cope: in a small test (Claude Sonnet, 40 runs: 16 headcount judgments and
24 "which domain would you pass to `o11.people.search`") they used the raw record every time, with or without the
mapping. Code that reads only `output` gets the gaps.

## Files

- `receipts/w26-route.jsonl`: one compact receipt per company (input, invocation ID, billed, route outcome and
  attempts, `output`, and the company fields of the raw record). `receipts/companies.csv` is the input list.
- `lib/receipts.ts`: parses a receipt line (zod) into a table row and flags the two gaps; `lib/receipts.test.ts`
  checks it against the real receipts.
- `scripts/run-batch.sh`: the command, to rerun with your own o11 account. `npm run data` rebuilds `data/w26.json`.

## Run

```
npm install
npm test
npm run data
npm run dev
```
