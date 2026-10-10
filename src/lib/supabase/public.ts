import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cookie-less public client for storefront reads.
 *
 * It never sees a session, so it can only ever receive what RLS exposes to the
 * `anon` role (live products, active categories, public tags). Pages that use
 * it may be statically rendered and revalidated.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}

export type SupabasePublicClient = ReturnType<typeof createPublicClient>;
