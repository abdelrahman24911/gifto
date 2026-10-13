export const BASE_BACKOFF_MS = 60_000; // 1 minute
export const MAX_BACKOFF_MS = 60 * 60_000; // 1 hour

/** Exponential backoff for a job that has just failed on `attempts` tries. */
export function backoffMs(attempts: number): number {
  const step = Math.max(0, Math.floor(attempts) - 1);
  return Math.min(BASE_BACKOFF_MS * 2 ** step, MAX_BACKOFF_MS);
}

/** ISO timestamp for the next retry, computed in the app so it is testable. */
export function computeNextAttemptAt(attempts: number, now: Date = new Date()): string {
  return new Date(now.getTime() + backoffMs(attempts)).toISOString();
}
