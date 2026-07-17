import { useEffect, useMemo, useRef } from "react";
import { createPortalSupabaseClient } from "../lib/supabaseClient";

export default function PortalRealtimeBridge({ topic, refresh }) {
  const client = useMemo(() => createPortalSupabaseClient(null), []);
  const timer = useRef(null);
  const latestRefresh = useRef(refresh);

  useEffect(() => {
    latestRefresh.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!topic) return undefined;
    const run = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(async () => {
        window.dispatchEvent(new CustomEvent("mls:portal-realtime"));
        await latestRefresh.current?.();
      }, 180);
    };
    const channel = client.channel(topic).on("broadcast", { event: "portal-update" }, run).subscribe();
    const focus = () => document.visibilityState === "visible" && run();
    const fallback = window.setInterval(() => document.visibilityState === "visible" && run(), 60000);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      window.clearTimeout(timer.current);
      window.clearInterval(fallback);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      client.removeChannel(channel);
    };
  }, [client, topic]);

  return null;
}
