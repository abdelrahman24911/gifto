import { computeNextAttemptAt } from "./backoff";
import { ACTIVE_CHANNEL } from "./channels";
import { getEmailConfig } from "./config";
import { sendOrderEmail } from "./email";
import { createSupabaseNotificationStore, type NotificationStore } from "./store";
import type { DispatchSummary, EmailConfig, NotificationJob } from "./types";

const DEFAULT_LIMIT = 10;

export interface DispatchDeps {
  store?: NotificationStore;
  fetchImpl?: typeof fetch;
  /** `undefined` reads the environment; pass explicitly (incl. null) in tests. */
  emailConfig?: EmailConfig | null;
  limit?: number;
  now?: () => Date;
  onError?: (message: string) => void;
}

function report(deps: DispatchDeps, error: unknown): void {
  const message = error instanceof Error ? error.message : "Unknown notification error.";
  if (deps.onError) deps.onError(message);
  else console.warn(`[notifications] ${message}`);
}

function nextAttempt(job: NotificationJob, deps: DispatchDeps): string {
  return computeNextAttemptAt(job.attempts, deps.now ? deps.now() : undefined);
}

/**
 * Claims due outbox jobs and delivers them over the active channel (email).
 *
 * Guarantees:
 *   - Never throws: an order that already persisted is never affected by an
 *     email failure.
 *   - Only the active channel is sent. Any job for another channel (e.g. the
 *     dormant WhatsApp channel) is stopped without calling a provider, so no
 *     WhatsApp API request can ever be made from here.
 *   - Retries only when the provider result is retryable AND attempts remain;
 *     permanent failures stop immediately and already-sent jobs are never
 *     re-claimed.
 *   - The claimed row's `attempts` was incremented inside the claim RPC, so the
 *     retry decision uses the authoritative count.
 */
export async function dispatchNotifications(deps: DispatchDeps = {}): Promise<DispatchSummary> {
  const emailConfig = deps.emailConfig === undefined ? getEmailConfig() : deps.emailConfig;
  const summary: DispatchSummary = {
    claimed: 0,
    sent: 0,
    failed: 0,
    retried: 0,
    configured: emailConfig !== null,
  };
  if (!emailConfig) return summary;

  let store: NotificationStore;
  try {
    store = deps.store ?? createSupabaseNotificationStore();
  } catch (error) {
    report(deps, error);
    return summary;
  }

  let jobs: NotificationJob[];
  try {
    jobs = await store.claim(deps.limit ?? DEFAULT_LIMIT);
  } catch (error) {
    report(deps, error);
    return summary;
  }
  summary.claimed = jobs.length;

  for (const job of jobs) {
    try {
      if (job.channel !== ACTIVE_CHANNEL) {
        // Dormant channel: never call a provider. Stop the job permanently so it
        // cannot loop, and never create or send WhatsApp traffic.
        await store.markFailed(
          job.id,
          `Channel "${job.channel}" is not enabled.`,
          false,
          null,
        );
        summary.failed += 1;
        continue;
      }

      const outcome = await sendOrderEmail(job.payload, {
        fetchImpl: deps.fetchImpl,
        config: emailConfig,
      });

      if (outcome.ok) {
        await store.markSent(job.id, outcome.providerMessageId);
        summary.sent += 1;
        continue;
      }

      const retry = outcome.retryable && job.attempts < job.max_attempts;
      await store.markFailed(
        job.id,
        outcome.error,
        retry,
        retry ? nextAttempt(job, deps) : null,
      );
      if (retry) summary.retried += 1;
      else summary.failed += 1;
    } catch (error) {
      report(deps, error);
      summary.failed += 1;
    }
  }

  return summary;
}
