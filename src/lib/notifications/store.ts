import { createServiceClient, type SupabaseServiceClient } from "@/lib/supabase/service";
import { ACTIVE_CHANNEL } from "./channels";
import type { NotificationJob } from "./types";

/**
 * Narrow persistence boundary for the worker. Keeping the Supabase calls behind
 * this interface lets the dispatch logic be unit tested with a fake store and
 * keeps credentials out of the orchestration code.
 */
export interface NotificationStore {
  claim(limit: number): Promise<NotificationJob[]>;
  markSent(id: string, providerMessageId: string | null): Promise<void>;
  markFailed(
    id: string,
    error: string,
    retry: boolean,
    nextAttemptAt: string | null,
  ): Promise<void>;
}

export function createSupabaseNotificationStore(
  client: SupabaseServiceClient = createServiceClient(),
): NotificationStore {
  return {
    async claim(limit) {
      // The RPC only returns jobs for the requested channel, so dormant
      // channels are never even claimed (and never sent).
      const { data, error } = await client.rpc("claim_notification_jobs", {
        p_limit: limit,
        p_channel: ACTIVE_CHANNEL,
      });
      if (error) throw new Error(error.message);
      return (Array.isArray(data) ? data : []) as unknown as NotificationJob[];
    },

    async markSent(id, providerMessageId) {
      const { error } = await client.rpc("mark_notification_sent", {
        p_id: id,
        p_provider_message_id: providerMessageId ?? undefined,
      });
      if (error) throw new Error(error.message);
    },

    async markFailed(id, error, retry, nextAttemptAt) {
      const { error: rpcError } = await client.rpc("mark_notification_failed", {
        p_id: id,
        p_error: error,
        p_retry: retry,
        p_next_attempt_at: nextAttemptAt ?? undefined,
      });
      if (rpcError) throw new Error(rpcError.message);
    },
  };
}
