import { useEffect, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, RefreshCcw, Save, Search } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";

export default function AdminInterpreters({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [savingRateId, setSavingRateId] = useState("");

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  async function portalRequest(action, options = {}) {
    const token = await session?.getToken();
    const response = await fetch(`/api/portal?action=${action}`, {
      method: options.method || "GET",
      headers: {
        authorization: `Bearer ${token}`,
        ...(options.body ? { "content-type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Portal request failed.");
    return data;
  }

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured || !isAdmin) return;

    async function loadInterpreters() {
      setLoading(true);
      setMessage("");
      try {
        const data = await portalRequest("adminRoster");
        setInterpreters(data.interpreters || []);
      } catch (error) {
        setMessage(`Could not load roster: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadInterpreters();
  }, [isAdmin, isLoaded, session, user]);

  if (!isSupabaseConfigured) {
    return <PortalSetupNotice palette={palette} />;
  }

  if (isLoaded && !isAdmin) {
    return (
      <section className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-8 text-center shadow-lg" style={cardStyle}>
          <AlertTriangle className="mx-auto" style={{ color: palette.gold }} />
          <h1 className="mt-4 text-3xl font-black" style={{ color: palette.charcoal }}>Admin access required</h1>
          <p className="mt-4 text-sm leading-7 text-[#666]">This roster is only available to MLS admin accounts configured in Vercel.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/portal" className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>Back to portal</Link>
            <PortalSignOutButton />
          </div>
        </div>
      </section>
    );
  }

  const updateInterpreterField = (id, field, value) => {
    setInterpreters((current) => current.map((interpreter) => (interpreter.id === id ? { ...interpreter, [field]: value } : interpreter)));
  };

  const saveRates = async (interpreter) => {
    setSavingRateId(interpreter.id);
    setMessage("");
    try {
      const data = await portalRequest("adminUpdateRates", {
        method: "POST",
        body: {
          interpreterId: interpreter.id,
          onsiteRate: interpreter.onsite_rate || "",
          vriRate: interpreter.vri_rate || "",
        },
      });
      setInterpreters((current) => current.map((item) => (item.id === interpreter.id ? { ...item, ...data.interpreter } : item)));
      setMessage("Rates updated.");
    } catch (error) {
      setMessage(`Could not update rates: ${error.message}`);
    } finally {
      setSavingRateId("");
    }
  };

  const filtered = interpreters.filter((interpreter) => {
    const haystack = `${interpreter.first_name || ""} ${interpreter.last_name || ""} ${interpreter.email || ""} ${interpreter.city || ""} ${interpreter.state || ""} ${interpreter.credentials || ""} ${interpreter.modalities || ""} ${interpreter.areas_of_experience || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="bg-[#f7f3ef] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between" style={{ borderColor: palette.border }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>MLS admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Interpreter roster</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f6368]">Review matching details, onboarding status, document counts, and admin-managed rates.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/portal" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>My portal</Link>
            <PortalSignOutButton />
          </div>
        </div>

        {message && <div className="mb-6 rounded-2xl border bg-white p-4 text-sm font-semibold text-[#721100]" style={{ borderColor: palette.border }}>{message}</div>}

        <div className="mb-6 rounded-[1.5rem] border bg-white p-4 shadow-sm" style={cardStyle}>
          <label className="flex items-center gap-3 rounded-2xl bg-black/[0.03] px-4 py-3">
            <Search size={18} style={{ color: palette.gold }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, location, credentials, modality, or experience" className="w-full bg-transparent text-sm font-semibold outline-none" />
          </label>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading roster...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-[2rem] border bg-white p-7 text-sm leading-7 text-[#666]" style={cardStyle}>No interpreters match your search.</div>
            ) : filtered.map((interpreter) => (
              <article key={interpreter.id} className="rounded-[2rem] border bg-white p-5 shadow-sm" style={{ borderColor: palette.border }}>
                <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_0.9fr]">
                  <div>
                    <div className="font-black text-xl" style={{ color: palette.charcoal }}>{interpreter.first_name} {interpreter.last_name}</div>
                    <div className="mt-1 text-sm text-[#666]">{interpreter.email}</div>
                    <div className="mt-2 text-sm text-[#666]">{interpreter.city || "—"}{interpreter.state ? `, ${interpreter.state}` : ""}</div>
                    <span className="mt-3 inline-flex rounded-full bg-[#dd7d00]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ color: palette.burgundy }}>{(interpreter.roster_status || "pending").replaceAll("_", " ")}</span>
                  </div>

                  <div className="space-y-2 text-sm text-[#666]">
                    <div><strong style={{ color: palette.charcoal }}>Credentials:</strong> {interpreter.credentials || "—"}</div>
                    <div><strong style={{ color: palette.charcoal }}>Modalities:</strong> {interpreter.modalities || "—"}</div>
                    <div><strong style={{ color: palette.charcoal }}>Experience:</strong> {interpreter.areas_of_experience || "—"}</div>
                    <div className="flex items-center gap-2 font-bold"><BadgeCheck size={17} style={{ color: palette.gold }} /> {interpreter.interpreter_documents?.length || 0} document records</div>
                  </div>

                  <div className="rounded-2xl border bg-black/[0.02] p-4" style={{ borderColor: palette.border }}>
                    <div className="text-xs font-black uppercase tracking-[0.12em] text-[#666]">Admin-managed rates</div>
                    <label className="mt-3 block text-xs font-bold" style={{ color: palette.charcoal }}>
                      On-site rate
                      <input value={interpreter.onsite_rate || ""} onChange={(event) => updateInterpreterField(interpreter.id, "onsite_rate", event.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none" style={{ borderColor: palette.border }} />
                    </label>
                    <label className="mt-3 block text-xs font-bold" style={{ color: palette.charcoal }}>
                      VRI rate
                      <input value={interpreter.vri_rate || ""} onChange={(event) => updateInterpreterField(interpreter.id, "vri_rate", event.target.value)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none" style={{ borderColor: palette.border }} />
                    </label>
                    <button type="button" disabled={savingRateId === interpreter.id} onClick={() => saveRates(interpreter)} className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white disabled:opacity-60" style={{ backgroundColor: palette.burgundy }}>
                      <Save size={14} /> {savingRateId === interpreter.id ? "Saving..." : "Save rates"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
