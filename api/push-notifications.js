import { database, readBody, send, signedInUser } from "./_shared/ops-v2-core.js";
import { sendPushNotification, vapidPublicKey } from "./_shared/web-push.js";

function cleanSubscription(value = {}) {
  const endpoint = String(value.endpoint || "").trim();
  const p256dh = String(value.keys?.p256dh || "").trim();
  const auth = String(value.keys?.auth || "").trim();
  if (!endpoint.startsWith("https://") || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    const db = database();
    const action = String(req.query?.action || "status");
    const payload = readBody(req);

    if (action === "config") {
      const publicKey = await vapidPublicKey(db);
      return send(res, 200, { configured: Boolean(publicKey), publicKey });
    }
    if (action === "status") {
      const result = await db.from("push_subscriptions").select("id,endpoint,user_agent,created_at,last_used_at,is_active").eq("clerk_user_id", user.id).eq("is_active", true).order("created_at", { ascending: false });
      if (result.error) throw result.error;
      return send(res, 200, { subscriptions: result.data || [] });
    }
    if (req.method !== "POST") return send(res, 405, { error: "POST is required." });
    if (action === "subscribe") {
      const subscription = cleanSubscription(payload.subscription);
      if (!subscription) return send(res, 400, { error: "A valid browser push subscription is required." });
      const result = await db.from("push_subscriptions").upsert({
        clerk_user_id: user.id,
        ...subscription,
        user_agent: String(req.headers["user-agent"] || "").slice(0, 500),
        is_active: true,
        disabled_at: null,
        last_error: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "endpoint" }).select("id,endpoint,is_active").single();
      if (result.error) throw result.error;
      return send(res, 200, { subscription: result.data });
    }
    if (action === "unsubscribe") {
      const endpoint = String(payload.endpoint || "");
      const result = await db.from("push_subscriptions").update({ is_active: false, disabled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("clerk_user_id", user.id).eq("endpoint", endpoint).select("id");
      if (result.error) throw result.error;
      return send(res, 200, { disabled: result.data?.length || 0 });
    }
    if (action === "test") {
      const notification = { recipient_clerk_user_id: user.id, category: "test", title: "MLS alerts are enabled", body: "Apple-style portal notifications are ready on this device.", section: "notifications" };
      const delivery = await sendPushNotification(db, notification);
      return send(res, 200, { delivery });
    }
    return send(res, 404, { error: "Unknown push notification action." });
  } catch (error) {
    console.error("push-notifications", error);
    return send(res, 500, { error: error instanceof Error ? error.message : "Push notification request failed." });
  }
}
