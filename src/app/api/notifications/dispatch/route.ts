import { timingSafeEqual } from "node:crypto";
import { dispatchNotifications } from "@/lib/notifications/dispatch";

// Route handlers default to the Node.js runtime (needed for `node:crypto`).
// Reading `request.headers` makes this handler request-time (dynamic) under
// Cache Components, so no segment config (e.g. `force-dynamic`) is needed.
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * The dispatch endpoint is a privileged worker trigger, not a public API. It is
 * only reachable with the `CRON_SECRET` (Vercel Cron sends it as a Bearer
 * token), so an unauthorized caller cannot read or trigger notifications.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const headerSecret = (request.headers.get("x-cron-secret") ?? "").trim();

  return safeEqual(bearer, secret) || safeEqual(headerSecret, secret);
}

async function handle(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await dispatchNotifications();
  return Response.json(summary);
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
