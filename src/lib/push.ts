// Web Push sender. Wraps the `web-push` library with our VAPID keys and sends
// notifications to all of a user's subscribed devices, pruning dead ones.

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPushSubs, deletePushSub } from "./data";

let configured = false;

/** Configure web-push from env once. Returns false if keys are missing. */
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@feasters.cloud";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;   // where to go when the notification is clicked
  tag?: string;   // collapses notifications with the same tag
}

/**
 * Send a push to every device the user has registered. Dead subscriptions
 * (404/410 from the push service) are deleted. Returns how many were delivered.
 */
export async function sendPushToUser(
  admin: SupabaseClient, userId: string, payload: PushPayload,
): Promise<number> {
  if (!ensureConfigured()) return 0;
  const subs = await fetchPushSubs(admin, userId);
  if (!subs.length) return 0;

  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      );
      delivered++;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) await deletePushSub(admin, s.endpoint);
    }
  }));

  return delivered;
}
