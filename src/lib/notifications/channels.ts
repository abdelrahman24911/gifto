import type { NotificationChannel } from "./types";

/**
 * The single channel the worker actually delivers. New orders only enqueue jobs
 * for this channel. WhatsApp stays implemented but dormant: it is deliberately
 * absent from `IMPLEMENTED_CHANNELS`, so it is never claimed or dispatched and
 * no WhatsApp API call can be triggered.
 */
export const ACTIVE_CHANNEL: NotificationChannel = "email";

export const IMPLEMENTED_CHANNELS: readonly NotificationChannel[] = ["email"];

export function isImplementedChannel(channel: string): channel is NotificationChannel {
  return (IMPLEMENTED_CHANNELS as readonly string[]).includes(channel);
}
