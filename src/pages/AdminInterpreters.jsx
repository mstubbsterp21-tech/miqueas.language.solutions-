import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  Eye,
  LayoutGrid,
  List,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { deriveRosterStatus, rosterStatusLabel } from "../lib/profileCompletion";

const EMPTY_FILTERS = {
  firstName: "",
  lastName: "",
  location: "",
  credentials: [],
  modalities: [],
  settings: [],
  experience: [],
  rateType: "either",
  minRate: "",
  maxRate: "",
};

const SORT_OPTIONS = [
  ["first_name", "First name"],
  ["last_name", "Last name"],
  ["location", "Location"],
  ["credentials", "Credentials"],
  ["modalities", "Modalities"],
  ["settings", "Settings"],
  ["experience", "Experience"],
  ["rate", "Rate"],
];

function safeText(value) {
  return value == null ? "" : String(value).trim();
}

function displayValue(value) {
  return safeText(value) || "—";
}

function splitValues(value) {
  return safeText(value)
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values.flatMap(splitValues).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function parseRate(value) {
  const match = safeText(value).replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function getLocation(interpreter) {
  const cityState = [safeText(interpreter.city), safeText(interpreter.state)].filter(Boolean).join(", ");
  return cityState || safeText(interpreter.current_location);
}

function getRate(interpreter, rateType = "either") {
  const onsite = parseRate(interpreter.onsite_rate);
  const vri = parseRate(interpreter.vri_rate);
  if (rateType === "onsite") return onsite;
  if (rateType === "vri") return vri;
  return onsite ?? vri;
}

function matchesText(value, filter) {
  return !safeText(filter) || safeText(value).toLowerCase().includes(safeText(filter).toLowerCase());
}

function matchesSelections(value, selected) {
  if (!selected.length) return true;
  const text = safeText(value).toLowerCase();
  return selected.every((item) => text.includes(item.toLowerCase()));
}

function getSortValue(interpreter, field, rateType) {
  switch (field) {
    case "first_name": return safeText(interpreter.first_name).toLowerCase();
    case "last_name": return safeText(interpreter.last_name).toLowerCase();
    case "location": return getLocation(interpreter).toLowerCase();
    case "credentials": return safeText(interpreter.credentials).toLowerCase();
    case "modalities": return safeText(interpreter.modalities).toLowerCase();
    case "settings": return safeText(interpreter.areas_of_experience).toLowerCase();
    case "experience": return parseRate(interpreter.years_experience) ?? safeText(interpreter.years_experience).toLowerCase();
    case "rate": return getRate(interpreter, rateType) ?? Number.POSITIVE_INFINITY;
    default: return safeText(interpreter.last_name).toLowerCase();
  }
}

function OptionGroup({ label, options, values, onToggle, palette }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
      <div className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: palette.gold }}>{label}</div>
      <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
        {options.length ? options.map((option) => (
          <label key={option} className="flex cursor-pointer items-start gap-2 text-sm" style={{ color: palette.charcoal }}>
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="mt-0.5 h-4 w-4 rounded"
            />
            <span>{option}</span>
          </label>
        )) : <span className="text-xs opacity-60">No values yet</span>}
      </div>
    </div>
  );
}

function ViewToggle({ active, onClick, icon: Icon, children, palette }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black"
      style={{ backgroundColor: active ? palette.burgundy : "transparent", color: active ? "#fff" : palette.charcoal }}
    >
      <Icon size={16} /> {children}
    </button>
  );
}

export default function AdminInterpreters({ palette, embedded = false }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortField, setSortField] = useState("last_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [viewMode, setViewMode] = useState("list");
  const [deletingId, setDeletingId] = useState("");

  const primaryEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const isAdmin = adminEmails.includes(primaryEmail);
  const isDark = palette.white !== "#ffffff";
  const panel = { borderColor: palette.border, backgroundColor: palette.white };
  const muted = isDark ? "#bfaea2" : "#667085";
  const background = isDark
    ? "linear-gradient(180deg,#15100e 0%,#211714 100%)"
    : "linear-gradient(180deg,#fff 0%,#f7f3ef 100%)";

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

  async function loadInterpreters() {
    setLoading(true);
    setMessage("");
    try {
      const data = await portalRequest("adminRoster");
      setInterpreters((data.interpreters || []).filter((item) => item.roster_status !== "removed"));
    } catch (error) {
      setMessage(`Could not load roster: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteInterpreter(interpreter) {
    const name = `${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email;
    if (!window.confirm(`Remove ${name} from the visible roster?`)) return;
    setDeletingId(interpreter.id);
    try {
      await portalRequest("adminUpdateInterpreterProfile", {
        method: "POST",
        body: { interpreterId: interpreter.id, profile: { roster_status: "removed" } },
      });
      setInterpreters((current) => current.filter((item) => item.id !== interpreter.id));
      setMessage(`${name} was removed from the roster.`);
    } catch (error) {
      setMessage(`Could not remove profile: ${error.message}`);
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    if (isLoaded && user && session && isSupabaseConfigured && isAdmin) loadInterpreters();
  }, [isLoaded, user?.id, session, isAdmin]);

  const options = useMemo(() => ({
    credentials: uniqueSorted(interpreters.map((item) => item.credentials)),
    modalities: uniqueSorted(interpreters.map((item) => item.modalities)),
    settings: uniqueSorted(interpreters.map((item) => item.areas_of_experience)),
    experience: uniqueSorted(interpreters.map((item) => item.years_experience)),
  }), [interpreters]);

  const filtered = useMemo(() => {
    const min = filters.minRate === "" ? null : Number(filters.minRate);
    const max = filters.maxRate === "" ? null : Number(filters.maxRate);
    const global = safeText(query).toLowerCase();

    return interpreters
      .filter((interpreter) => {
        const rate = getRate(interpreter, filters.rateType);
        const haystack = [
          interpreter.first_name,
          interpreter.last_name,
          interpreter.email,
          getLocation(interpreter),
          interpreter.credentials,
          interpreter.modalities,
          interpreter.areas_of_experience,
          interpreter.years_experience,
          interpreter.onsite_rate,
          interpreter.vri_rate,
        ].map(safeText).join(" ").toLowerCase();

        return (
          (!global || haystack.includes(global)) &&
          matchesText(interpreter.first_name, filters.firstName) &&
          matchesText(interpreter.last_name, filters.lastName) &&
          matchesText(getLocation(interpreter), filters.location) &&
          matchesSelections(interpreter.credentials, filters.credentials) &&
          matchesSelections(interpreter.modalities, filters.modalities) &&
          matchesSelections(interpreter.areas_of_experience, filters.settings) &&
          matchesSelections(interpreter.years_experience, filters.experience) &&
          (min == null || (rate != null && rate >= min)) &&
          (max == null || (rate != null && rate <= max))
        );
      })
      .sort((a, b) => {
        const av = getSortValue(a, sortField, filters.rateType);
        const bv = getSortValue(b, sortField, filters.rateType);
        const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDirection === "asc" ? result : -result;
      });
  }, [interpreters, query, filters, sortField, sortDirection]);

  function toggleFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: current[name].includes(value)
        ? current[name].filter((item) => item !== value)
        : [...current[name], value],
    }));
  }

  function clearAll() {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    setSortField("last_name");
    setSortDirection("asc");
  }

  if (!isSupabaseConfigured) return <PortalSetupNotice palette={palette} />;

  if (isLoaded && !isAdmin) {
    return (
      <section className="px-5 py-16" style={{ background }}>
        <div className="mx-auto max-w-3xl rounded-[2rem] border p-8 text-center shadow-lg" style={panel}>
          <AlertTriangle className="mx-auto" style={{ color: palette.gold }} />
          <h1 className="mt-4 text-3xl font-black" style={{ color: palette.charcoal }}>Admin access required</h1>
          <p className="mt-4 text-sm" style={{ color: muted }}>Clients and interpreters cannot view the MLS administrative roster.</p>
          <Link to="/portal" className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>Back to portal</Link>
        </div>
      </section>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen px-5 py-12 md:px-8"} style={embedded ? undefined : { background }}>
      <div className={embedded ? "" : "mx-auto max-w-[96rem]"}>
        {!embedded && (
        <header className="rounded-[2rem] border p-6 shadow-sm md:p-8" style={panel}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: palette.gold }}>MLS admin only</p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl" style={{ color: palette.charcoal }}>Interpreter Roster</h1>
              <p className="mt-3 text-sm" style={{ color: muted }}>Filter and sort by name, location, credentials, modalities, settings, experience, and rate.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={loadInterpreters} className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold" style={{ borderColor: palette.border, color: palette.charcoal }}><RefreshCcw size={16} /> Refresh</button>
              <Link to="/portal" className="rounded-full px-5 py-3 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>My portal</Link>
              <PortalSignOutButton />
            </div>
          </div>
        </header>
        )}

        {message && <div className="mt-5 rounded-2xl border p-4 text-sm font-semibold" style={{ ...panel, color: palette.charcoal }}>{message}</div>}

        <section className="mt-6 rounded-[2rem] border p-5 shadow-sm" style={panel}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: palette.border }}>
              <Search size={18} style={{ color: palette.gold }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the complete roster" className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: palette.charcoal }} />
            </label>
            <div className="flex rounded-2xl border p-1" style={{ borderColor: palette.border }}>
              <ViewToggle active={viewMode === "list"} onClick={() => setViewMode("list")} icon={List} palette={palette}>List</ViewToggle>
              <ViewToggle active={viewMode === "cards"} onClick={() => setViewMode("cards")} icon={LayoutGrid} palette={palette}>Cards</ViewToggle>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[['firstName','First name'],['lastName','Last name'],['location','Location']].map(([key, label]) => (
              <label key={key} className="text-xs font-black uppercase tracking-[0.1em]" style={{ color: muted }}>
                {label}
                <input value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} className="mt-2 w-full rounded-2xl border bg-transparent px-4 py-3 text-sm normal-case tracking-normal outline-none" style={{ borderColor: palette.border, color: palette.charcoal }} />
              </label>
            ))}
            <label className="text-xs font-black uppercase tracking-[0.1em]" style={{ color: muted }}>
              Sort by
              <div className="mt-2 flex gap-2">
                <select value={sortField} onChange={(event) => setSortField(event.target.value)} className="min-w-0 flex-1 rounded-2xl border bg-transparent px-4 py-3 text-sm normal-case tracking-normal" style={{ borderColor: palette.border, color: palette.charcoal }}>
                  {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="button" onClick={() => setSortDirection((current) => current === "asc" ? "desc" : "asc")} className="rounded-2xl border px-4" style={{ borderColor: palette.border, color: palette.burgundy }} aria-label="Reverse sort direction">
                  {sortDirection === "asc" ? <ArrowDownAZ size={19} /> : <ArrowUpAZ size={19} />}
                </button>
              </div>
            </label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OptionGroup label="Credentials" options={options.credentials} values={filters.credentials} onToggle={(value) => toggleFilter("credentials", value)} palette={palette} />
            <OptionGroup label="Modalities" options={options.modalities} values={filters.modalities} onToggle={(value) => toggleFilter("modalities", value)} palette={palette} />
            <OptionGroup label="Settings" options={options.settings} values={filters.settings} onToggle={(value) => toggleFilter("settings", value)} palette={palette} />
            <OptionGroup label="Experience" options={options.experience} values={filters.experience} onToggle={(value) => toggleFilter("experience", value)} palette={palette} />
          </div>

          <div className="mt-4 grid gap-4 rounded-2xl border p-4 md:grid-cols-4" style={{ borderColor: palette.border }}>
            <label className="text-xs font-black uppercase tracking-[0.1em]" style={{ color: muted }}>Rate type<select value={filters.rateType} onChange={(event) => setFilters({ ...filters, rateType: event.target.value })} className="mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm normal-case" style={{ borderColor: palette.border, color: palette.charcoal }}><option value="either">Either rate</option><option value="onsite">On-site rate</option><option value="vri">VRI rate</option></select></label>
            <label className="text-xs font-black uppercase tracking-[0.1em]" style={{ color: muted }}>Minimum rate<input type="number" min="0" value={filters.minRate} onChange={(event) => setFilters({ ...filters, minRate: event.target.value })} className="mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm normal-case" style={{ borderColor: palette.border, color: palette.charcoal }} /></label>
            <label className="text-xs font-black uppercase tracking-[0.1em]" style={{ color: muted }}>Maximum rate<input type="number" min="0" value={filters.maxRate} onChange={(event) => setFilters({ ...filters, maxRate: event.target.value })} className="mt-2 w-full rounded-xl border bg-transparent px-3 py-2.5 text-sm normal-case" style={{ borderColor: palette.border, color: palette.charcoal }} /></label>
            <div className="flex items-end"><button type="button" onClick={clearAll} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ borderColor: palette.border, color: palette.burgundy }}><X size={16} /> Clear filters</button></div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-semibold" style={{ color: muted }}><SlidersHorizontal size={16} /> Showing {filtered.length} of {interpreters.length} interpreters</div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="rounded-[2rem] border p-10 text-center" style={panel}><RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} /><p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading roster…</p></div>
          ) : !filtered.length ? (
            <div className="rounded-[2rem] border p-10 text-center" style={panel}><p className="font-bold" style={{ color: palette.charcoal }}>No interpreters match these filters.</p></div>
          ) : viewMode === "cards" ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{filtered.map((interpreter) => <InterpreterCard key={interpreter.id} interpreter={interpreter} palette={palette} muted={muted} deletingId={deletingId} onDelete={deleteInterpreter} />)}</div>
          ) : (
            <InterpreterTable interpreters={filtered} palette={palette} muted={muted} deletingId={deletingId} onDelete={deleteInterpreter} />
          )}
        </section>
      </div>
    </div>
  );
}

function InterpreterCard({ interpreter, palette, muted, deletingId, onDelete }) {
  const status = deriveRosterStatus(interpreter, interpreter.interpreter_documents || []);
  return (
    <article className="rounded-[2rem] border p-5 shadow-sm" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black" style={{ color: palette.charcoal }}>{displayValue(interpreter.first_name)} {safeText(interpreter.last_name)}</h2>
          <p className="mt-1 text-sm" style={{ color: muted }}>{displayValue(getLocation(interpreter))}</p>
          <span className="mt-3 inline-flex rounded-full bg-[#dd7d00]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ color: palette.burgundy }}>{rosterStatusLabel(status)}</span>
        </div>
        <Link to={`/admin/interpreters/${interpreter.id}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}><Eye size={15} /> View</Link>
      </div>
      <div className="mt-5 space-y-2 text-sm" style={{ color: muted }}>
        <p><strong style={{ color: palette.charcoal }}>Credentials:</strong> {displayValue(interpreter.credentials)}</p>
        <p><strong style={{ color: palette.charcoal }}>Modalities:</strong> {displayValue(interpreter.modalities)}</p>
        <p><strong style={{ color: palette.charcoal }}>Settings:</strong> {displayValue(interpreter.areas_of_experience)}</p>
        <p><strong style={{ color: palette.charcoal }}>Experience:</strong> {displayValue(interpreter.years_experience)}</p>
        <p><strong style={{ color: palette.charcoal }}>Rates:</strong> On-site {displayValue(interpreter.onsite_rate)} · VRI {displayValue(interpreter.vri_rate)}</p>
      </div>
      <button type="button" disabled={deletingId === interpreter.id} onClick={() => onDelete(interpreter)} className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-50" style={{ borderColor: palette.border, color: palette.burgundy }}><Trash2 size={14} /> Remove</button>
    </article>
  );
}

function InterpreterTable({ interpreters, palette, muted, deletingId, onDelete }) {
  const headings = ["First Name", "Last Name", "Location", "Credentials", "Modalities", "Settings", "Experience", "On-site Rate", "VRI Rate", "Actions"];
  return (
    <div className="overflow-hidden rounded-[2rem] border shadow-sm" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#721100]/5"><tr>{headings.map((heading) => <th key={heading} className="whitespace-nowrap border-b px-4 py-3 text-xs font-black uppercase tracking-[0.1em]" style={{ borderColor: palette.border, color: muted }}>{heading}</th>)}</tr></thead>
          <tbody>{interpreters.map((interpreter) => (
            <tr key={interpreter.id} className="align-top">
              {[interpreter.first_name, interpreter.last_name, getLocation(interpreter), interpreter.credentials, interpreter.modalities, interpreter.areas_of_experience, interpreter.years_experience, interpreter.onsite_rate, interpreter.vri_rate].map((value, index) => <td key={index} className="max-w-72 border-b px-4 py-4 font-semibold" style={{ borderColor: palette.border, color: palette.charcoal }}><span className="whitespace-normal">{displayValue(value)}</span></td>)}
              <td className="border-b px-4 py-4" style={{ borderColor: palette.border }}><div className="flex min-w-28 flex-col gap-2"><Link to={`/admin/interpreters/${interpreter.id}`} className="inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: palette.burgundy }}><Eye size={14} /> View</Link><button type="button" disabled={deletingId === interpreter.id} onClick={() => onDelete(interpreter)} className="inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-50" style={{ borderColor: palette.border, color: palette.burgundy }}><Trash2 size={14} /> Remove</button></div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
