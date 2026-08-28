#!/usr/bin/env node
/**
 * Preflight for the shared backend.
 *
 *   npm run check:backend
 *
 * Answers what "it doesn't sync" can actually mean, in order: are the keys
 * filled in, does the project answer, did the migrations run, and is realtime
 * switched on. Prints no secret values.
 */
import { readFileSync } from "node:fs";

const PLACEHOLDER =
  /^(placeholder|your-project|your-anon-key|changeme)|^https:\/\/(placeholder|your-project|example)\./i;
const PROJECT_URL = /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/;

const color = process.stdout.isTTY;
const paint = (code, text) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const PASS = paint(32, "  ok ");
const FAIL = paint(31, "FAIL ");
const WARN = paint(33, "warn ");

const TABLES = [
  "users",
  "clubs",
  "club_members",
  "posts",
  "reactions",
  "events",
  "event_signups",
  "council",
];

let failed = 0;
const fixes = [];

function report(state, label, detail, fix) {
  console.log(`${state} ${label}${detail ? ` - ${detail}` : ""}`);
  if (state === FAIL) {
    failed += 1;
    if (fix) fixes.push(fix);
  }
}

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // Optional; real env vars win anyway.
    }
  }
}

function finish() {
  if (failed === 0) {
    console.log("\nBackend looks good. Everyone on this project shares one school.\n");
    process.exit(0);
  }
  console.log(`\n${failed} check(s) failed. Next steps:`);
  for (const fix of [...new Set(fixes)]) console.log(`  - ${fix}`);
  console.log("");
  process.exit(1);
}

async function main() {
  loadEnv();

  console.log("\nEnvironment");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || PLACEHOLDER.test(url) || !PROJECT_URL.test(url)) {
    report(
      FAIL,
      "NEXT_PUBLIC_SUPABASE_URL",
      !url ? "not set" : "placeholder or malformed",
      "Put your project URL in .env.local (Project Settings -> API Keys)",
    );
  } else {
    report(PASS, "NEXT_PUBLIC_SUPABASE_URL", "set");
  }

  if (!key || PLACEHOLDER.test(key)) {
    report(
      FAIL,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      !key ? "not set" : "placeholder",
      "Put your anon / publishable key in .env.local",
    );
  } else {
    report(PASS, "NEXT_PUBLIC_SUPABASE_ANON_KEY", "set");
  }

  if (failed > 0) {
    console.log("\nUntil these are set the app runs on this browser only.");
    finish();
    return;
  }

  console.log("\nProject");
  try {
    // Probe a real table, not `/rest/v1/`. The REST root serves the OpenAPI
    // spec and answers 401 to the anon key even on a perfectly healthy
    // project, which makes it useless as a reachability check.
    const res = await fetch(`${url}/rest/v1/clubs?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (res.status === 401) {
      report(FAIL, "REST API", "401", "Use the URL and key from the SAME project");
      finish();
      return;
    }
    if (res.status === 404) {
      report(FAIL, "REST API", "no `clubs` table", "Run supabase/migrations/0001_schema.sql");
      finish();
      return;
    }
    report(PASS, "REST API", "reachable");
  } catch (cause) {
    report(FAIL, "REST API", cause.message, "Check the URL and that the project is not paused");
    finish();
    return;
  }

  console.log("\nSchema");
  let readable = 0;
  for (const table of TABLES) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" },
      });
      if (res.ok) {
        readable += 1;
        const count = res.headers.get("content-range")?.split("/")[1] ?? "?";
        report(PASS, `table ${table}`, `${count} row(s)`);
      } else if (res.status === 404) {
        report(FAIL, `table ${table}`, "missing", "Run supabase/migrations/0001_schema.sql");
      } else {
        // RLS with no policy returns an empty 200, so a 401/403 here means the
        // key itself is being rejected rather than the row filter.
        report(
          FAIL,
          `table ${table}`,
          `HTTP ${res.status}`,
          "Run supabase/migrations/0002_demo_open_access.sql to grant the anon key access",
        );
      }
    } catch (cause) {
      report(FAIL, `table ${table}`, cause.message);
    }
  }

  if (readable === TABLES.length) {
    console.log("\nWrite access");
    try {
      const res = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
        method: "HEAD",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      report(
        res.ok ? PASS : WARN,
        "anon key",
        res.ok ? "can read users" : `HEAD returned ${res.status}`,
      );
    } catch {
      report(WARN, "anon key", "could not be checked");
    }
  }

  console.log("\nRealtime is not checkable over REST. If rows save but other");
  console.log("screens do not update, open Database -> Replication in the");
  console.log("dashboard and confirm the eight tables are in supabase_realtime.");

  finish();
}

main();
