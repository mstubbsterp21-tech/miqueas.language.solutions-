import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Eye, RefreshCcw, Search } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";

const requiredDocumentTypes = ["resume", "w9", "credential_proof", "liability_insurance", "ic_agreement"];

function statusPill(status) {
  return (status || "pending_profile").replaceAll("_", " ");
}

function requiredDocumentCount(interpreter = {}) {
  const docs = interpreter.interpreter_documents || [];
  return requiredDocumentTypes.filter((type) => docs.some((doc) => doc.document_type === type)).length;
}

function completionPercent(interpreter = {}) {
  const required = [
    interpreter.phone,
    interpreter.city || interpreter.current_location,
    interpreter.credentials,
    interpreter.modalities,
    interpreter.areas_of_experience,
    interpreter.assignment_type_preference,
    interpreter.availability_sunday || interpreter.availability_monday || interpreter.availability_tuesday || interpreter.availability_wednesday || interpreter.availability_thursday || interpreter.availability_friday || interpreter.availability_saturday,
    requiredDocumentCount(interpreter) === requiredDocumentTypes.length,
  ];
  return Math.round((required.filter(Boolean).length / required.length) * 100);
}

export default function AdminInterpreters({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);
  const isDarkMode = palette.white !== "#ffffff";
  const pageBackground = isDarkMode
    ? "radial-gradient(circle at 12% 18%, rgba(221,125,0,0.16), transparent 30%), radial-gradient(circle at 88% 12%, rgba(114,17,0,0.24), transparent 28%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";
  const bodyText = isDarkMode ? "#d8c8bc" : "#5f6368";
  const mutedText = isDarkMode ? "#bfaea2" : "#666";
  const softPanel = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const cardStyle = { borderColor: palette.border, backgroundColor: palette.white };

  async function portalRequest(action) {
    const token = await session?.getToken();
    const response = await fetch(`/api/portal?action=${action}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Portal request failed.");
    return data;
  }

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

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured || !isAdmin) return;
    loadInterpreters();
  }, [isAdmin, isLoaded, session, user]);

  const filtered = useMemo(() => {
    const search = query.toLowerCase();
    return interpreters
      .filter((interpreter) => interpreter.roster_status !== "removed")
      .filter((interpreter) => {
        const haystack = `${interpreter.first_name || ""} ${interpreter.last_name || ""} ${interpreter.email || ""} ${interpreter.city || ""} ${interpreter.state || ""} ${interpreter.credentials || ""} ${interpreter.modalities || ""} ${interpreter.areas_of_experience || ""}`.toLowerCase();
        return haystack.includes(search);
      });
  }, [interpreters, query]);

  const activeCount = interpreters.filter((interpreter) => interpreter.roster_status === "active").length;
  const incompleteCount = interpreters.filter((interpreter) => interpreter.roster_status !== "removed" && completionPercent(interpreter) < 100).length;
  const completeCount = interpreters.filter((interpreter) => interpreter.roster_status !== "removed" && completionPercent(interpreter) === 100).length;

  if (!isSupabaseConfigured) return <PortalSetupNotice palette={palette} />;

  if (isLoaded && !isAdmin) {
    return (
      <section className="px-5 py-16 md:px-8 md:py-24" style={{ background: pageBackground }}>
        <div className="mx-auto max-w-3xl rounded-[2rem] border p-8 text-center shadow-lg" style={cardStyle}>
          <AlertTriangle className="mx-auto" style={{ color: palette.gold }} />
          <h1 className="mt-4 text-3xl font-black" style={{ color: palette.charcoal }}>Admin access required</h1>
          <p className="mt-4 text-sm leading-7" style={{ color: bodyText }}>This roster is only available to MLS admin accounts configured in Vercel.</p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/portal" className="rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>Back to portal</Link>
            <PortalSignOutButton />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="px-5 py-12 md:px-8 md:py-16" style={{ background: pageBackground }}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-[2rem] border p-6 shadow-sm md:p-8" style={cardStyle}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>MLS admin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Interpreter roster</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: bodyText }}>
                Quick overview of interpreter profiles. Completion requires matching details plus résumé, W-9, credential proof, liability insurance, and IC Agreement uploads.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={loadInterpreters} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal }}>
                <RefreshCcw size={16} /> Refresh
              </button>
              <Link to="/portal" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>My portal</Link>
              <PortalSignOutButton />
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-4">
            <OverviewCard label="Visible roster" value={filtered.length} helper="Current search results" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Complete" value={completeCount} helper="100% profile completion" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Incomplete" value={incompleteCount} helper="Missing fields or required files" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Active" value={activeCount} helper="Marked active" palette={palette} mutedText={mutedText} softPanel={softPanel} />
          </div>
        </header>

        {message && <div className="mb-6 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.white, color: palette.burgundy }}>{message}</div>}

        <div className="mb-6 rounded-[1.5rem] border p-4 shadow-sm" style={cardStyle}>
          <label className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: softPanel }}>
            <Search size={18} style={{ color: palette.gold }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, location, credentials, modality, or experience" className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: palette.charcoal }} />
          </label>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border p-7 text-sm leading-7" style={{ ...cardStyle, color: bodyText }}>No interpreters match your search.</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((interpreter) => {
              const docCount = interpreter.interpreter_documents?.length || 0;
              const requiredCount = requiredDocumentCount(interpreter);
              const percent = completionPercent(interpreter);
              const complete = percent === 100;
              return (
                <article key={interpreter.id} className="rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={cardStyle}>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-xl font-black" style={{ color: palette.charcoal }}>{interpreter.first_name || "—"} {interpreter.last_name || ""}</div>
                      <div className="mt-1 break-words text-sm" style={{ color: mutedText }}>{interpreter.email || "No email"}</div>
                      <div className="mt-2 text-sm" style={{ color: mutedText }}>{interpreter.city || "—"}{interpreter.state ? `, ${interpreter.state}` : ""}</div>
                      <span className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ backgroundColor: complete ? "rgba(221,125,0,0.12)" : "rgba(114,17,0,0.08)", color: palette.burgundy }}>{complete ? "Complete" : "Incomplete"}</span>
                    </div>
                    <Link to={`/admin/interpreters/${interpreter.id}`} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>
                      <Eye size={15} /> View profile
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Completion" value={`${percent}%`} palette={palette} mutedText={mutedText} softPanel={softPanel} />
                    <MiniStat label="Required files" value={`${requiredCount}/${requiredDocumentTypes.length}`} palette={palette} mutedText={mutedText} softPanel={softPanel} />
                    <MiniStat label="Status" value={statusPill(interpreter.roster_status)} palette={palette} mutedText={mutedText} softPanel={softPanel} />
                  </div>

                  <div className="mt-5 space-y-2 text-sm" style={{ color: mutedText }}>
                    <div><strong style={{ color: palette.charcoal }}>Credentials:</strong> {interpreter.credentials || "—"}</div>
                    <div><strong style={{ color: palette.charcoal }}>Modalities:</strong> {interpreter.modalities || "—"}</div>
                    <div><strong style={{ color: palette.charcoal }}>Experience:</strong> {interpreter.areas_of_experience || "—"}</div>
                    <div className="flex items-center gap-2 font-bold"><BadgeCheck size={17} style={{ color: palette.gold }} /> {docCount} uploaded document record{docCount === 1 ? "" : "s"}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ label, value, helper, palette, mutedText, softPanel }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
      <div className="text-xs font-black uppercase tracking-[0.14em]" style={{ color: mutedText }}>{label}</div>
      <div className="mt-2 text-2xl font-black" style={{ color: palette.charcoal }}>{value}</div>
      <div className="mt-1 text-xs" style={{ color: mutedText }}>{helper}</div>
    </div>
  );
}

function MiniStat({ label, value, palette, mutedText, softPanel }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
      <div className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: mutedText }}>{label}</div>
      <div className="mt-1 text-sm font-black capitalize" style={{ color: palette.charcoal }}>{value}</div>
    </div>
  );
}
