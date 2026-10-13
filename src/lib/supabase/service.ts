import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Privileged, cookie-less Supabase client for the notification worker.
 *
 * This bypasses Row Level Security, so it must only ever be imported from
 * server-only modules (route handlers, `after()` callbacks). The key is read
 * from a server-side environment variable and is never sent to the browser.
 */
export function createServiceClient() {
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Notification worker is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export type SupabaseServiceClient = ReturnType<typeof createServiceClient>;
