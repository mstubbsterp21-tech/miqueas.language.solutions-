import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Eye, RefreshCcw, Search, Trash2 } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { deriveRosterStatus, getOverallProfileCompletion, getRequiredDocumentCompletion, rosterStatusLabel } from "../lib/profileCompletion";

export default function AdminInterpreters({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

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

  function hydrateDerivedStatus(interpreter) {
    const derivedStatus = deriveRosterStatus(interpreter, interpreter.interpreter_documents || []);
    return { ...interpreter, derived_roster_status: derivedStatus };
  }

  async function loadInterpreters() {
    setLoading(true);
    setMessage("");
    try {
      const data = await portalRequest("adminRoster");
      setInterpreters((data.interpreters || []).map(hydrateDerivedStatus));
    } catch (error) {
      setMessage(`Could not load roster: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteInterpreterProfile(interpreter) {
    const name = `${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email || "this interpreter";
    const confirmed = window.confirm(`Delete ${name} from the visible roster? This removes the profile from the admin roster view, but it does not destroy stored document records.`);
    if (!confirmed) return;

    setDeletingId(interpreter.id);
    setMessage("");
    try {
      await portalRequest("adminUpdateInterpreterProfile", {
        method: "POST",
        body: { interpreterId: interpreter.id, profile: { roster_status: "removed" } },
      });
      setInterpreters((current) => current.filter((item) => item.id !== interpreter.id));
      setMessage(`${name} was removed from the roster.`);
    } catch (error) {
      setMessage(`Could not delete profile: ${error.message}`);
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured || !isAdmin) return;
    loadInterpreters();
  }, [isAdmin, isLoaded, session, user]);

  const visibleInterpreters = useMemo(
    () => interpreters.map(hydrateDerivedStatus).filter((interpreter) => interpreter.derived_roster_status !== "removed"),
    [interpreters]
  );

  const filtered = useMemo(() => {
    const search = query.toLowerCase();
    return visibleInterpreters.filter((interpreter) => {
      const haystack = `${interpreter.first_name || ""} ${interpreter.last_name || ""} ${interpreter.email || ""} ${interpreter.city || ""} ${interpreter.state || ""} ${interpreter.credentials || ""} ${interpreter.modalities || ""} ${interpreter.areas_of_experience || ""} ${rosterStatusLabel(interpreter.derived_roster_status)}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [visibleInterpreters, query]);

  const activeCount = visibleInterpreters.filter((interpreter) => interpreter.derived_roster_status === "active").length;
  const pendingDocumentationCount = visibleInterpreters.filter((interpreter) => interpreter.derived_roster_status === "pending_documentation").length;
  const completeCount = visibleInterpreters.filter((interpreter) => getOverallProfileCompletion(interpreter, interpreter.interpreter_documents || []).isComplete).length;

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
                Completion now includes profile setup plus required uploads. Missing required documents automatically puts a profile in Pending Documentation.
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
            <OverviewCard label="Complete" value={completeCount} helper="Profile + required files" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Pending docs" value={pendingDocumentationCount} helper="Missing required uploads" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Active" value={activeCount} helper="Ready for assignments" palette={palette} mutedText={mutedText} softPanel={softPanel} />
          </div>
        </header>

        {message && <div className="mb-6 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.white, color: message.toLowerCase().includes("could not") ? palette.burgundy : palette.charcoal }}>{message}</div>}

        <div className="mb-6 rounded-[1.5rem] border p-4 shadow-sm" style={cardStyle}>
          <label className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: softPanel }}>
            <Search size={18} style={{ color: palette.gold }} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, location, credentials, modality, experience, or status" className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: palette.charcoal }} />
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
              const docs = getRequiredDocumentCompletion(interpreter.interpreter_documents || []);
              const completion = getOverallProfileCompletion(interpreter, interpreter.interpreter_documents || []);
              const status = deriveRosterStatus(interpreter, interpreter.interpreter_documents || []);
              return (
                <article key={interpreter.id} className="rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={cardStyle}>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-xl font-black" style={{ color: palette.charcoal }}>{interpreter.first_name || "—"} {interpreter.last_name || ""}</div>
                      <div className="mt-1 break-words text-sm" style={{ color: mutedText }}>{interpreter.email || "No email"}</div>
                      <div className="mt-2 text-sm" style={{ color: mutedText }}>{interpreter.city || "—"}{interpreter.state ? `, ${interpreter.state}` : ""}</div>
                      <span className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ backgroundColor: status === "active" ? "rgba(221,125,0,0.12)" : "rgba(114,17,0,0.08)", color: palette.burgundy }}>{rosterStatusLabel(status)}</span>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <Link to={`/admin/interpreters/${interpreter.id}`} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>
                        <Eye size={15} /> View profile
                      </Link>
                      <button type="button" disabled={deletingId === interpreter.id} onClick={() => deleteInterpreterProfile(interpreter)} className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.burgundy, backgroundColor: palette.white }}>
                        <Trash2 size={15} /> {deletingId === interpreter.id ? "Deleting..." : "Delete profile"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Completion" value={`${completion.percent}% (${completion.completed}/${completion.total})`} palette={palette} mutedText={mutedText} softPanel={softPanel} />
                    <MiniStat label="Required files" value={`${docs.completed}/${docs.total}`} palette={palette} mutedText={mutedText} softPanel={softPanel} />
                    <MiniStat label="Status" value={rosterStatusLabel(status)} palette={palette} mutedText={mutedText} softPanel={softPanel} />
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
