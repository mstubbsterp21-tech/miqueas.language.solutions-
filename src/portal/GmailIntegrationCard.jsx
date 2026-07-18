import { useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import {
  CalendarDays, CheckCircle2, FolderOpen, Loader2, Mail, PlugZap,
  RefreshCw, Send, Tag, Unplug,
} from "lucide-react";
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
    if (result === "connected") setMessage(detail || "Google Workspace connected successfully.");
    if (result === "error") setError(detail || "Google Workspace authorization was not completed.");
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
    if (!window.confirm("Disconnect Google Workspace from MLS Portal? Assignment emails, calendar sync, Drive folders, document-request emails, and reminders will stop until it is reconnected.")) return;
    setBusy("disconnect");
    setError("");
    setMessage("");
    try {
      await api.gmailOAuth("disconnect", "POST", {});
      setMessage("Google Workspace disconnected.");
      await load();
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : String(disconnectError));
    } finally {
      setBusy("");
    }
  }

  const gmailConnected = Boolean(status?.connected);
  const workspaceConnected = Boolean(status?.workspaceConnected);
  const badge = workspaceConnected
    ? "active"
    : gmailConnected
      ? "reconnect required"
      : status?.environmentConfigured
        ? "not connected"
        : "setup required";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><PlugZap size={21} /></span>
        <Badge value={badge} />
      </div>
      <h2 className="mt-5 text-xl font-black text-slate-950">Google Workspace</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Connects Gmail delivery and feedback filing, the MLS Assignments calendar, and MLS assignment folders in Google Drive.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Mail, "Gmail", gmailConnected ? "Email delivery ready" : "Not connected"],
          [Tag, "Feedback", workspaceConnected ? "MLS Portal Feedback label ready" : "Reconnect required"],
          [CalendarDays, "Calendar", status?.calendarSummary || (workspaceConnected ? "Created on first sync" : "Reconnect required")],
          [FolderOpen, "Drive", status?.driveRootFolderId ? "MLS Assignments folder ready" : (workspaceConnected ? "Created on first sync" : "Reconnect required")],
        ].map(([Icon, label, detail]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4">
            <Icon size={18} className="text-[#721100]" />
            <p className="mt-3 text-sm font-black text-slate-900">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Checking Google Workspace connection…</div>
      ) : (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">
          <p><strong>Sender:</strong> {status?.sender || "Not configured"}</p>
          <p><strong>Connected account:</strong> {status?.email || "None"}</p>
          {status?.connectedAt && <p><strong>Connected:</strong> {formatDate(status.connectedAt)}</p>}
          {status?.workspaceLastVerifiedAt && <p><strong>Workspace verified:</strong> {formatDate(status.workspaceLastVerifiedAt)}</p>}
          {status?.lastTestAt && <p><strong>Last email test:</strong> {formatDate(status.lastTestAt)}</p>}
          {!status?.environmentConfigured && <p className="font-bold text-amber-700">Missing Vercel settings: {(status?.missingEnvironmentVariables || []).join(", ")}</p>}
          {status?.missingScopes?.length > 0 && <p className="font-bold text-amber-700">Reconnect once to approve Gmail feedback filing, Calendar, and Drive access.</p>}
          {status?.lastError && <p className="font-bold text-rose-700">Last error: {status.lastError}</p>}
        </div>
      )}

      {message && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{message}</div>}
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-5 text-rose-700">{error}</div>}

      <div className="mt-5 flex flex-wrap gap-2">
        {!workspaceConnected ? (
          <button type="button" onClick={connect} disabled={Boolean(busy) || loading || status?.environmentConfigured === false} className="inline-flex items-center gap-2 rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {busy === "connect" ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />} {gmailConnected ? "Reconnect Google Workspace" : "Connect Google Workspace"}
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
