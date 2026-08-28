"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The shared backend, or nothing.
 *
 * When the two public env vars are missing or still placeholders, this returns
 * null and the app falls back to per-browser localStorage. That keeps the demo
 * runnable while the Supabase project is being set up, instead of a blank page
 * and a console error.
 */
const PLACEHOLDER =
  /^(placeholder|your-project|your-anon-key|changeme)|^https:\/\/(placeholder|your-project|example)\./i;

function readEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return null;
  if (PLACEHOLDER.test(url) || PLACEHOLDER.test(key)) return null;
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url.replace(/\/+$/, ""))) return null;

  return { url: url.replace(/\/+$/, ""), key };
}

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const env = readEnv();
  cached = env
    ? createClient(env.url, env.key, {
        // Nobody signs in yet, so there is no session to persist or refresh.
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 5 } },
      })
    : null;

  return cached;
}

export function isBackendConfigured(): boolean {
  return getSupabase() !== null;
}
