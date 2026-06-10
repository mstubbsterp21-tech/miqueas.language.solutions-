import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, RefreshCcw, Search } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { supabase } from "../lib/supabaseClient";

export default function AdminInterpreters({ palette }) {
  const { user, isLoaded } = useUser();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  useEffect(() => {
    if (!isLoaded || !user || !isSupabaseConfigured || !supabase || !isAdmin) return;

    async function loadInterpreters() {
      setLoading(true);
      const { data, error } = await supabase
        .from("interpreters")
        .select("*, interpreter_documents(id, document_type, status)")
        .order("updated_at", { ascending: false });

      if (error) {
        setMessage(`Could not load roster: ${error.message}`);
      } else {
        setInterpreters(data || []);
      }
      setLoading(false);
    }

    loadInterpreters();
  }, [isAdmin, isLoaded, user]);

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

  const filtered = interpreters.filter((interpreter) => {
    const haystack = `${interpreter.first_name || ""} ${interpreter.last_name || ""} ${interpreter.email || ""} ${interpreter.city || ""} ${interpreter.state || ""} ${interpreter.credentials || ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="bg-[#f7f3ef] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between" style={{ borderColor: palette.border }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>MLS admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Interpreter roster</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f6368]">Review portal profiles, onboarding status, document counts, credentials, availability, and rates.</p>
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
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, location, or credentials" className="w-full bg-transparent text-sm font-semibold outline-none" />
          </label>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border bg-white p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading roster...</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm" style={{ borderColor: palette.border }}>
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_0.7fr] gap-4 border-b bg-black/[0.03] px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#666] md:grid">
              <div>Interpreter</div>
              <div>Location</div>
              <div>Credentials</div>
              <div>Status</div>
              <div>Docs</div>
              <div>Rates</div>
            </div>
            <div className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <div className="p-7 text-sm leading-7 text-[#666]">No interpreters match your search.</div>
              ) : filtered.map((interpreter) => (
                <article key={interpreter.id} className="grid gap-4 p-5 text-sm md:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_0.7fr] md:items-center">
                  <div>
                    <div className="font-black" style={{ color: palette.charcoal }}>{interpreter.first_name} {interpreter.last_name}</div>
                    <div className="mt-1 text-[#666]">{interpreter.email}</div>
                  </div>
                  <div className="text-[#666]">{interpreter.city || "—"}{interpreter.state ? `, ${interpreter.state}` : ""}</div>
                  <div className="text-[#666]">{interpreter.credentials || "—"}</div>
                  <div><span className="inline-flex rounded-full bg-[#dd7d00]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ color: palette.burgundy }}>{(interpreter.roster_status || "pending").replaceAll("_", " ")}</span></div>
                  <div className="flex items-center gap-2 font-bold text-[#666]"><BadgeCheck size={17} style={{ color: palette.gold }} /> {interpreter.interpreter_documents?.length || 0}</div>
                  <div className="text-[#666]">Onsite: {interpreter.onsite_rate || "—"}<br />VRI: {interpreter.vri_rate || "—"}</div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
