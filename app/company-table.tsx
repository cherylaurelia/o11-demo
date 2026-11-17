"use client";

import { useState } from "react";
import { type CompanyRow, outputDomainDiffers } from "@/lib/receipts";

type View = "all" | "domain";

function formatUsd(micros: number): string {
  return micros === 0 ? "$0" : `$${(micros / 1_000_000).toFixed(5).replace(/0+$/, "")}`;
}

export function CompanyTable({ rows }: { rows: CompanyRow[] }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const needle = query.trim().toLowerCase();

  const shown = rows.filter(
    (row) =>
      (view === "all" || outputDomainDiffers(row)) &&
      (needle === "" || `${row.name} ${row.oneLiner} ${row.inputDomain} ${row.industry ?? ""}`.toLowerCase().includes(needle)),
  );

  const domainCount = rows.filter(outputDomainDiffers).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="search">
          Search companies
        </label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search 197 companies, e.g. fintech"
          className="h-9 w-full rounded-lg border border-line bg-card px-3 text-sm outline-none focus:border-ink sm:w-72"
        />
        <div className="flex gap-1 rounded-lg bg-soft p-1 text-sm" role="group" aria-label="Rows to show">
          <button
            type="button"
            aria-pressed={view === "all"}
            onClick={() => setView("all")}
            className={`rounded-md px-3 py-1 ${view === "all" ? "bg-card text-ink shadow-sm" : "text-body"}`}
          >
            All {rows.length}
          </button>
          <button
            type="button"
            aria-pressed={view === "domain"}
            onClick={() => setView("domain")}
            className={`rounded-md px-3 py-1 ${view === "domain" ? "bg-card text-ink shadow-sm" : "text-body"}`}
          >
            output.domain ≠ site ({domainCount})
          </button>
        </div>
        <span className="text-sm text-muted" aria-live="polite">
          {shown.length} shown
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-soft text-xs text-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Company</th>
              <th scope="col" className="px-3 py-2 font-medium">Site looked up</th>
              <th scope="col" className="px-3 py-2 font-medium">Headcount</th>
              <th scope="col" className="px-3 py-2 font-medium">Founded</th>
              <th scope="col" className="px-3 py-2 font-medium">Industry</th>
              <th scope="col" className="px-3 py-2 font-medium">Served by</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.invocationId} className="border-b border-line align-top last:border-0">
                <td className="px-3 py-2">
                  <div className="font-medium text-ink">{row.name}</div>
                  <div className="max-w-xs text-xs text-muted">{row.oneLiner}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  <div>{row.inputDomain}</div>
                  {outputDomainDiffers(row) && (
                    <div className="mt-1 text-[#b45309]">output.domain: {row.outputDomain}</div>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.headcountRaw ?? row.headcountInOutput ?? "–"}
                  {row.headcountInOutput === null && row.headcountRaw !== null && (
                    <div className="text-xs text-muted">raw only</div>
                  )}
                </td>
                <td className="px-3 py-2">{row.founded ?? "–"}</td>
                <td className="px-3 py-2 text-xs text-body">{row.industry ?? "–"}</td>
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  <div>{row.provider}</div>
                  <div className="text-muted">
                    {row.cached ? "cache, $0" : formatUsd(row.billedMicros)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
