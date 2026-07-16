import { useEffect, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { FileCheck2, Loader2 } from "lucide-react";
import FirstLoginSetupWizard, { needsFirstLoginSetup } from "./FirstLoginSetupWizard";

export { needsFirstLoginSetup };

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function mergeAvailable(prefill, profile) {
  const result = { ...(prefill || {}) };
  Object.entries(profile || {}).forEach(([key, value]) => {
    if (hasValue(value)) result[key] = value;
  });
  return result;
}

export default function ClerkFirstLoginSetupWizard(props) {
  const { role, profile, user } = props;
  const { session } = useSession();
  const [prefill, setPrefill] = useState(null);
  const [loading, setLoading] = useState(role === "interpreter");
  const [source, setSource] = useState("");
  const [prefillError, setPrefillError] = useState("");

  useEffect(() => {
    let active = true;
    if (role !== "interpreter" || !session) { setLoading(false); return () => { active = false; }; }
    (async () => {
      try {
        const token = await session.getToken();
        const response = await fetch("/api/operations-v2?action=interpreterNetworkPrefill", { headers: { Authorization: `Bearer ${token}` } });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Interpreter Network prefill could not be loaded.");
        if (!active) return;
        if (result.matched) { setPrefill(result.prefill || {}); setSource(result.source || "MLS Interpreter Network form"); }
        else if (result.requiresWorkspaceReconnect) setPrefillError("MLS needs to reconnect Google Workspace before the Interpreter Network submission can be loaded. You may continue by entering the information manually.");
      } catch (error) {
        if (active) setPrefillError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [role, session]);

  if (loading) return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5"><div className="rounded-[2rem] bg-white p-10 text-center shadow-2xl"><Loader2 className="mx-auto animate-spin text-[#721100]" size={32} /><p className="mt-4 font-black text-slate-800">Matching your Interpreter Network submission…</p></div></div>;

  const merged = role === "interpreter" ? mergeAvailable(prefill, profile) : profile;
  const clerkIdentity = {
    first_name: merged?.first_name || user?.firstName || "",
    last_name: merged?.last_name || user?.lastName || "",
    email: merged?.email || user?.email || "",
  };
  const resolvedProfile = role === "interpreter" ? { ...(merged || {}), ...clerkIdentity } : profile;

  return <div className="relative">{source && <div className="fixed right-4 top-4 z-[80] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-xl"><FileCheck2 className="mt-0.5 shrink-0 text-emerald-700" size={18} /><div><p className="text-sm font-black text-emerald-950">Profile prefilled</p><p className="mt-1 text-xs leading-5 text-emerald-800">Matched your {source}. Review and edit every field before saving.</p></div></div>}{prefillError && <div className="fixed right-4 top-4 z-[80] max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900 shadow-xl">{prefillError}</div>}<FirstLoginSetupWizard {...props} profile={resolvedProfile} /></div>;
}
