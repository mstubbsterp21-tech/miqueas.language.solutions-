import { useEffect, useRef, useState } from "react";
import { useClerk, useSession } from "@clerk/clerk-react";
import { AlertTriangle, CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import logo from "../logo.png";

async function secureRequest(session, action, method = "GET", body) {
  const token = await session?.getToken();
  if (!token) throw new Error("Sign in is required.");
  const response = await fetch(`/api/operations-v2?action=${encodeURIComponent(action)}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Security request failed (${response.status}).`);
  return data;
}

function IdleSignOut() {
  const { signOut } = useClerk();
  const [warning, setWarning] = useState(false);
  const deadline = useRef(Date.now() + 10 * 60 * 1000);
  const lastSignal = useRef(0);

  useEffect(() => {
    const reset = () => {
      const now = Date.now();
      if (now - lastSignal.current < 800) return;
      lastSignal.current = now;
      deadline.current = now + 10 * 60 * 1000;
      setWarning(false);
    };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    const interval = window.setInterval(() => {
      const remaining = deadline.current - Date.now();
      if (remaining <= 0) signOut({ redirectUrl: "/login?reason=idle" });
      else if (remaining <= 60 * 1000) setWarning(true);
    }, 1000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, reset));
      window.clearInterval(interval);
    };
  }, [signOut]);

  if (!warning) return null;
  return <div className="fixed inset-x-3 bottom-24 z-[260] mx-auto max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xl lg:bottom-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={19} /><div className="min-w-0 flex-1"><p className="font-black text-amber-950">You will be signed out soon</p><p className="mt-1 text-sm leading-6 text-amber-800">MLS Portal signs out after 10 minutes without activity.</p></div><button type="button" onClick={() => { deadline.current = Date.now() + 10 * 60 * 1000; setWarning(false); }} className="rounded-xl bg-amber-800 px-3 py-2 text-xs font-black text-white">Stay signed in</button></div></div>;
}

export default function PortalSecurityGate() {
  const { session } = useSession();
  const { signOut } = useClerk();
  const [status, setStatus] = useState("checking");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    secureRequest(session, "deviceStatus").then((result) => active && setStatus(result.trusted ? "trusted" : "verify")).catch((reason) => { if (active) { setError(reason.message); setStatus("verify"); } });
    return () => { active = false; };
  }, [session]);

  async function sendCode() {
    setBusy(true); setError("");
    try {
      const result = await secureRequest(session, "beginDeviceVerification", "POST", {});
      setEmailHint(result.emailHint || "your email"); setSent(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  }

  async function verify(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await secureRequest(session, "verifyDevice", "POST", { code });
      setStatus("trusted");
    } catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  }

  if (status === "trusted") return <IdleSignOut />;
  return <div className="fixed inset-0 z-[250] flex min-h-[100dvh] items-center justify-center bg-[#24130e]/95 p-4 backdrop-blur-xl"><div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#f7f3ef] p-6 shadow-2xl md:p-9"><div className="flex items-center gap-4"><img src={logo} alt="Miqueas Language Solutions" className="h-14 w-auto" /><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#dd7d00]">MLS Portal Security</p><h1 className="mt-1 text-2xl font-black text-slate-950">Verify this browser</h1></div></div>{status === "checking" ? <div className="flex min-h-48 flex-col items-center justify-center"><Loader2 className="animate-spin text-[#721100]" size={32} /><p className="mt-4 text-sm font-bold text-slate-500">Checking this device…</p></div> : <><div className="mt-7 rounded-2xl border border-[#721100]/10 bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><LockKeyhole size={20} /></span><div><p className="font-black text-slate-900">New or unrecognized browser</p><p className="mt-1 text-sm leading-6 text-slate-500">We verify browsers that do not have an MLS trusted-device cookie. After verification, this browser stays trusted for up to 180 days.</p></div></div></div>{error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-800">{error}</div>}{!sent ? <button type="button" disabled={busy} onClick={sendCode} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <Mail size={17} />}Send verification code</button> : <form onSubmit={verify} className="mt-5"><p className="text-center text-sm text-slate-500">Code sent to <strong>{emailHint}</strong></p><label className="mt-4 block text-sm font-black text-slate-700">Six-digit code<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-black tracking-[.25em] outline-none focus:border-[#dd7d00] focus:ring-4 focus:ring-[#dd7d00]/10" autoFocus /></label><button type="submit" disabled={busy || code.length !== 6} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-4 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}Verify and continue</button><button type="button" disabled={busy} onClick={sendCode} className="mt-3 w-full py-2 text-xs font-black text-[#721100]">Send a new code</button></form>}<button type="button" onClick={() => signOut({ redirectUrl: "/login" })} className="mt-5 inline-flex w-full items-center justify-center gap-2 py-2 text-xs font-black text-slate-500"><ShieldCheck size={15} />Sign out instead</button></> }</div></div>;
}
