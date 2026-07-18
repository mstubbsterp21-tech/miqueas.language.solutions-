import webpush from "web-push";

let cachedConfiguration = null;

async function configuration(db) {
  const environment = {
    publicKey: process.env.VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
    subject: process.env.VAPID_SUBJECT || "mailto:m.stubbs@miqueaslanguagesolutions.com",
  };
  if (environment.publicKey && environment.privateKey) return environment;
  if (cachedConfiguration) return cachedConfiguration;
  const result = await db.from("push_configuration").select("public_key,private_key,subject").eq("id", true).maybeSingle();
  if (result.error) throw result.error;
  cachedConfiguration = result.data ? {
    publicKey: result.data.public_key,
    privateKey: result.data.private_key,
    subject: result.data.subject,
  } : null;
  return cachedConfiguration;
}

function payloadFor(notification = {}) {
  const section = notification.section || "notifications";
  return JSON.stringify({
    title: notification.title || "MLS Portal update",
    body: notification.body || "Open MLS for details.",
    icon: "/apple-touch-icon.png",
    badge: "/favicon-32x32.png",
    tag: notification.notification_key || notification.id || `mls-${notification.category || "update"}`,
    url: `/portal?section=${encodeURIComponent(section)}`,
    notificationId: notification.id || null,
    category: notification.category || "general",
  });
}

export async function vapidPublicKey(db) {
  return (await configuration(db))?.publicKey || "";
}

export async function sendPushNotification(db, notification) {
  const config = await configuration(db);
  if (!config?.publicKey || !config?.privateKey || !notification?.recipient_clerk_user_id) return { sent: 0, configured: false };
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const subscriptions = await db.from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("clerk_user_id", notification.recipient_clerk_user_id)
    .eq("is_active", true);
  if (subscriptions.error) throw subscriptions.error;

  let sent = 0;
  const expired = [];
  await Promise.all((subscriptions.data || []).map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, payloadFor(notification), { TTL: 86400, urgency: "high" });
      sent += 1;
      await db.from("push_subscriptions").update({ last_used_at: new Date().toISOString(), last_error: null }).eq("id", subscription.id);
    } catch (error) {
      const statusCode = Number(error?.statusCode || 0);
      if ([404, 410].includes(statusCode)) expired.push(subscription.id);
      else await db.from("push_subscriptions").update({ last_error: String(error?.message || error).slice(0, 500) }).eq("id", subscription.id);
    }
  }));
  if (expired.length) await db.from("push_subscriptions").update({ is_active: false, disabled_at: new Date().toISOString(), last_error: "Subscription expired" }).in("id", expired);
  return { sent, configured: true, expired: expired.length };
}

export async function sendPushNotifications(db, notifications = []) {
  return Promise.all(notifications.map((notification) => sendPushNotification(db, notification)));
}
