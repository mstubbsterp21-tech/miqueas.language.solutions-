import { useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { CheckCircle2, Loader2, Mail, PlugZap, RefreshCw, Send, Unplug } from "lucide-react";
import { createMLSApi } from "./api";
import { Badge, Card, formatDate } from "./ui";

export default function GmailIntegrationCard() {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      setStatus(await api.gmailOAuth("status"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("gmail");
    const detail = params.get("gmail_message");
    if (result === "connected") setMessage(detail || "Gmail connected successfully.");
    if (result === "error") setError(detail || "Gmail authorization was not completed.");
    if (result) {
      params.delete("gmail");
      params.delete("gmail_message");
      const query = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
      load();
    }
  }, []);

  async function connect() {
    setBusy("connect");
    setError("");
    try {
      const result = await api.gmailOAuth("connect");
      window.location.assign(result.url);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : String(connectError));
      setBusy("");
    }
  }

  async function test() {
    setBusy("test");
    setError("");
    setMessage("");
    try {
      const result = await api.gmailOAuth("test", "POST", {});
      setMessage(`Test email sent to ${result.to}.`);
      await load();
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : String(testError));
    } finally {
      setBusy("");
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect Gmail from the MLS portal? Document-request emails and reminders will stop until Gmail is reconnected.")) return;
    setBusy("disconnect");
    setError("");
    setMessage("");
    try {
      await api.gmailOAuth("disconnect", "POST", {});
      setMessage("Gmail disconnected.");
      await load();
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : String(disconnectError));
    } finally {
      setBusy("");
    }
  }

  const connected = Boolean(status?.connected);
  const badge = connected ? "active" : status?.environmentConfigured ? "not connected" : "setup required";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Mail size={21} /></span>
        <Badge value={badge} />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-950">Gmail</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Sends document requests and reminders from the MLS business Gmail account through Google’s send-only API.</p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Checking Gmail connection…</div>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          <p><strong>Sender:</strong> {status?.sender || "Not configured"}</p>
          <p><strong>Connected account:</strong> {status?.email || "None"}</p>
          {status?.connectedAt && <p><strong>Connected:</strong> {formatDate(status.connectedAt)}</p>}
          {status?.lastTestAt && <p><strong>Last test:</strong> {formatDate(status.lastTestAt)}</p>}
          {!status?.environmentConfigured && <p className="font-bold text-amber-700">Missing Vercel settings: {(status?.missingEnvironmentVariables || []).join(", ")}</p>}
          {status?.lastError && <p className="font-bold text-rose-700">Last error: {status.lastError}</p>}
        </div>
      )}

      {message && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{message}</div>}
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-5 text-rose-700">{error}</div>}

      <div className="mt-5 flex flex-wrap gap-2">
        {!connected ? (
          <button type="button" onClick={connect} disabled={Boolean(busy) || loading || status?.environmentConfigured === false} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {busy === "connect" ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />} Connect Gmail
          </button>
        ) : (
          <>
            <button type="button" onClick={test} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
              {busy === "test" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send test email
            </button>
            <button type="button" onClick={connect} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50"><RefreshCw size={16} /> Reconnect</button>
            <button type="button" onClick={disconnect} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-black text-rose-700 disabled:opacity-50">
              {busy === "disconnect" ? <Loader2 size={16} className="animate-spin" /> : <Unplug size={16} />} Disconnect
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
