import { createClient } from "@supabase/supabase-js";

export function supabaseForToken(jwt?: string) {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : undefined,
  });
}

// Service-role client for admin-only actions (never expose this key to clients)
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, service);
}
