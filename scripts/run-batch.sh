#!/bin/sh
# Reproduce the run: needs the o11 CLI signed in (curl -fsSL https://go.o11.ai/install.sh | sh, then o11 login).
# companies.csv has one row per YC W26 company with a website (columns: domain,name,...), from
# https://yc-oss.github.io/api/batches/winter-2026.json
set -eu
RUN_ID="$(o11 session-id)"
o11 batch o11.companies.enrich --rows companies.csv --map domain=domain \
  --run-id "$RUN_ID" --run-max 0.20 --journal w26-journal.jsonl --concurrency 4 > batch.json
# Each row's full receipt: o11 status <invocationId>
o11 run-status "$RUN_ID"
