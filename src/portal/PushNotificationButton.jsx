import { useEffect, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { Bell, BellOff, Loader2, Smartphone } from "lucide-react";

function decodeKey(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isAppleMobile() {
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

export default function PushNotificationButton() {
  const { session } = useSession();
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");

  const request = async (action, options = {}) => {
    const token = await session?.getToken();
    const response = await fetch(`/api/push-notifications?action=${action}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Notification request failed.");
    return data;
  };

  useEffect(() => {
    let active = true;
    async function inspect() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (active) setState("unsupported");
        return;
      }
      if (isAppleMobile() && !isStandalone()) {
        if (active) setState("install");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (active) setState(subscription ? "enabled" : Notification.permission === "denied" ? "blocked" : "disabled");
    }
    inspect().catch((error) => { if (active) { setMessage(error.message); setState("disabled"); } });
    return () => { active = false; };
  }, []);

  const enable = async () => {
    setState("loading");
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "disabled");
        return;
      }
      const config = await request("config");
      if (!config.configured) throw new Error("Push notification service is not configured.");
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeKey(config.publicKey),
      });
      await request("subscribe", { method: "POST", body: JSON.stringify({ subscription: subscription.toJSON() }) });
      setState("enabled");
      await request("test", { method: "POST", body: "{}" });
    } catch (error) {
      setMessage(error.message);
      setState("disabled");
    }
  };

  const disable = async () => {
    setState("loading");
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await request("unsubscribe", { method: "POST", body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      setState("disabled");
    } catch (error) {
      setMessage(error.message);
      setState("enabled");
    }
  };

  const config = {
    loading: [Loader2, "Checking alerts…", "animate-spin"],
    enabled: [Bell, "Alerts on", ""],
    disabled: [BellOff, "Enable alerts", ""],
    install: [Smartphone, "Install app for alerts", ""],
    blocked: [BellOff, "Alerts blocked", ""],
    unsupported: [BellOff, "Alerts unavailable", ""],
  }[state];
  const [Icon, label, iconClass] = config;
  const actionable = state === "enabled" || state === "disabled";

  return (
    <div className="mb-2">
      <button type="button" onClick={state === "enabled" ? disable : enable} disabled={!actionable} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-70" title={state === "install" ? "On iPhone or iPad, add MLS to your Home Screen first." : undefined}>
        <Icon size={16} className={iconClass} />{label}
      </button>
      {message && <p className="mt-1 px-2 text-center text-[10px] leading-4 text-amber-200">{message}</p>}
    </div>
  );
}
