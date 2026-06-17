import { useEffect, useMemo, useState } from "react";
import { useSession, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Eye, LayoutGrid, List, Mail, MessageSquare, Phone, RefreshCcw, Search, Trash2, X } from "lucide-react";
import { PortalSignOutButton } from "../components/AuthStatus";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { adminEmails, isSupabaseConfigured } from "../lib/env";
import { deriveRosterStatus, getOverallProfileCompletion, getRequiredDocumentCompletion, rosterStatusLabel } from "../lib/profileCompletion";

const JOIN_FORM_CONTACT_OPTIONS = ["Email", "Phone", "Text"];
const JOIN_FORM_CREDENTIAL_OPTIONS = [
  "National Interpreter Certification (NIC)",
  "Certified Deaf Interpreter (CDI)",
  "Board for Evaluation of Interpreters (BEI)",
  "Educational Interpreter Performance Assessment (EIPA)",
  "Uncertified",
  "Other",
];
const JOIN_FORM_MODALITY_OPTIONS = [
  "ASL (American Sign Language)",
  "PTASL (Pro-Tactile ASL)",
  "CASE (Conceptually Accurate Signed English)",
  "Trilingual (ASL, English, Spanish)",
  "MCE (Manually Coded English)",
  "Cued Speech",
  "Other",
];
const JOIN_FORM_EXPERIENCE_OPTIONS = [
  "Medical",
  "Legal",
  "Edu.(K-12)",
  "Edu.(Post-Secondary)",
  "Mental Health",
  "Community / Freelance",
  "Platform / Conference",
  "Performance / Arts",
  "Cruise",
  "Video Relay Service (VRS)",
  "Video Remote Interpreting (VRI)",
  "English > ASL Translation",
  "ASL > English Translation",
];

const defaultFilters = {
  rosterStatuses: [],
  credentials: [],
  modalities: [],
  experience: [],
  contactMethods: [],
};

function safeText(value) {
  return value ? String(value) : "";
}

function displayValue(value) {
  return safeText(value).trim() || "—";
}

function splitOptions(value) {
  return safeText(value)
    .split(/[,;\n|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function fieldMatchesAnyFilter(fieldValue, selectedValues) {
  if (!selectedValues.length) return true;
  const field = safeText(fieldValue).trim().toLowerCase();
  if (!field) return false;

  return selectedValues.some((selectedValue) => {
    const selected = safeText(selectedValue).trim().toLowerCase();
    if (!selected) return false;
    return field === selected || field.includes(selected) || field.includes(`${selected}:`);
  });
}

function normalizePhoneNumber(value) {
  return safeText(value).replace(/[^+\d]/g, "");
}

function buildExperienceText(interpreter) {
  const years = displayValue(interpreter.years_experience);
  const areas = displayValue(interpreter.areas_of_experience);

  if (years === "—") return areas;
  if (areas === "—") return years;
  return `${years} · ${areas}`;
}

export default function AdminInterpreters({ palette }) {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("profile");
  const [filters, setFilters] = useState(defaultFilters);
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
  const tableHeader = isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(114,17,0,0.05)";
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

  function toggleFilter(name, value) {
    setFilters((current) => {
      const currentValues = current[name] || [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...current, [name]: nextValues };
    });
  }

  function clearFilters() {
    setQuery("");
    setFilters(defaultFilters);
  }

  useEffect(() => {
    if (!isLoaded || !user || !session || !isSupabaseConfigured || !isAdmin) return;
    loadInterpreters();
  }, [isAdmin, isLoaded, session, user]);

  const visibleInterpreters = useMemo(
    () => interpreters.map(hydrateDerivedStatus).filter((interpreter) => interpreter.derived_roster_status !== "removed"),
    [interpreters]
  );

  const filterOptions = useMemo(() => ({
    statusOptions: uniqueSorted(visibleInterpreters.map((interpreter) => rosterStatusLabel(interpreter.derived_roster_status))),
    credentialOptions: JOIN_FORM_CREDENTIAL_OPTIONS,
    modalityOptions: JOIN_FORM_MODALITY_OPTIONS,
    experienceOptions: JOIN_FORM_EXPERIENCE_OPTIONS,
    contactMethodOptions: JOIN_FORM_CONTACT_OPTIONS,
  }), [visibleInterpreters]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return visibleInterpreters.filter((interpreter) => {
      const status = deriveRosterStatus(interpreter, interpreter.interpreter_documents || []);
      const statusLabel = rosterStatusLabel(status);

      const haystack = [
        interpreter.first_name,
        interpreter.last_name,
        interpreter.email,
        interpreter.phone,
        interpreter.preferred_contact_method,
        interpreter.city,
        interpreter.state,
        interpreter.current_location,
        interpreter.credentials,
        interpreter.modalities,
        interpreter.years_experience,
        interpreter.areas_of_experience,
        statusLabel,
      ].map(safeText).join(" ").toLowerCase();

      const matchesSearch = !search || haystack.includes(search);
      const matchesStatus =
        !filters.rosterStatuses.length ||
        filters.rosterStatuses.some((selectedStatus) => statusLabel.toLowerCase() === selectedStatus.toLowerCase());
      const matchesCredential = fieldMatchesAnyFilter(interpreter.credentials, filters.credentials);
      const matchesModality = fieldMatchesAnyFilter(interpreter.modalities, filters.modalities);
      const matchesExperience = fieldMatchesAnyFilter(interpreter.areas_of_experience, filters.experience);
      const matchesContactMethod = fieldMatchesAnyFilter(interpreter.preferred_contact_method, filters.contactMethods);

      return matchesSearch && matchesStatus && matchesCredential && matchesModality && matchesExperience && matchesContactMethod;
    });
  }, [visibleInterpreters, query, filters]);

  const hasActiveFilters =
    query.trim() ||
    filters.rosterStatuses.length ||
    filters.credentials.length ||
    filters.modalities.length ||
    filters.experience.length ||
    filters.contactMethods.length;

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
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>Interpreter Roster</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: bodyText }}>
                Search, filter, and review interpreter profiles in either profile cards or a faster list view.
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
            <OverviewCard label="Visible roster" value={filtered.length} helper="Current filtered results" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Complete" value={completeCount} helper="Profile + required files" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Pending docs" value={pendingDocumentationCount} helper="Missing required uploads" palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <OverviewCard label="Active" value={activeCount} helper="Ready for assignments" palette={palette} mutedText={mutedText} softPanel={softPanel} />
          </div>
        </header>

        {message && <div className="mb-6 rounded-2xl border p-4 text-sm font-semibold" style={{ borderColor: palette.border, backgroundColor: palette.white, color: message.toLowerCase().includes("could not") ? palette.burgundy : palette.charcoal }}>{message}</div>}

        <div className="mb-6 rounded-[1.5rem] border p-4 shadow-sm" style={cardStyle}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: softPanel }}>
              <Search size={18} style={{ color: palette.gold }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, phone, location, credentials, modality, experience, contact method, or status" className="w-full bg-transparent text-sm font-semibold outline-none" style={{ color: palette.charcoal }} />
            </label>

            <div className="flex shrink-0 rounded-2xl border p-1" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
              <ViewToggleButton active={viewMode === "profile"} onClick={() => setViewMode("profile")} Icon={LayoutGrid} label="Profile View" palette={palette} />
              <ViewToggleButton active={viewMode === "list"} onClick={() => setViewMode("list")} Icon={List} label="List View" palette={palette} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
            <FilterCheckboxGroup label="Status" values={filters.rosterStatuses} onToggle={(value) => toggleFilter("rosterStatuses", value)} options={filterOptions.statusOptions} palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <FilterCheckboxGroup label="Credentials" values={filters.credentials} onToggle={(value) => toggleFilter("credentials", value)} options={filterOptions.credentialOptions} palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <FilterCheckboxGroup label="Modalities" values={filters.modalities} onToggle={(value) => toggleFilter("modalities", value)} options={filterOptions.modalityOptions} palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <FilterCheckboxGroup label="Experience" values={filters.experience} onToggle={(value) => toggleFilter("experience", value)} options={filterOptions.experienceOptions} palette={palette} mutedText={mutedText} softPanel={softPanel} />
            <FilterCheckboxGroup label="Preferred Contact" values={filters.contactMethods} onToggle={(value) => toggleFilter("contactMethods", value)} options={filterOptions.contactMethodOptions} palette={palette} mutedText={mutedText} softPanel={softPanel} />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold" style={{ color: mutedText }}>
              Showing {filtered.length} of {visibleInterpreters.length} visible interpreter{visibleInterpreters.length === 1 ? "" : "s"}.
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold" style={{ borderColor: palette.border, color: palette.burgundy, backgroundColor: palette.white }}>
                <X size={15} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border p-8 text-center shadow-sm" style={cardStyle}>
            <RefreshCcw className="mx-auto animate-spin" style={{ color: palette.gold }} />
            <p className="mt-4 font-bold" style={{ color: palette.charcoal }}>Loading roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border p-7 text-sm leading-7" style={{ ...cardStyle, color: bodyText }}>No interpreters match your current search or filters.</div>
        ) : viewMode === "list" ? (
          <InterpreterListView interpreters={filtered} palette={palette} mutedText={mutedText} cardStyle={cardStyle} tableHeader={tableHeader} deletingId={deletingId} onDelete={deleteInterpreterProfile} />
        ) : (
          <InterpreterProfileView interpreters={filtered} palette={palette} mutedText={mutedText} softPanel={softPanel} cardStyle={cardStyle} deletingId={deletingId} onDelete={deleteInterpreterProfile} />
        )}
      </div>
    </div>
  );
}

function InterpreterProfileView({ interpreters, palette, mutedText, softPanel, cardStyle, deletingId, onDelete }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {interpreters.map((interpreter) => {
        const docCount = interpreter.interpreter_documents?.length || 0;
        const docs = getRequiredDocumentCompletion(interpreter.interpreter_documents || []);
        const completion = getOverallProfileCompletion(interpreter, interpreter.interpreter_documents || []);
        const status = deriveRosterStatus(interpreter, interpreter.interpreter_documents || []);
        return (
          <article key={interpreter.id} className="rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={cardStyle}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-xl font-black" style={{ color: palette.charcoal }}>{displayValue(interpreter.first_name)} {safeText(interpreter.last_name)}</div>
                <div className="mt-1 break-words text-sm" style={{ color: mutedText }}>{interpreter.email || "No email"}</div>
                <div className="mt-2 text-sm" style={{ color: mutedText }}>{interpreter.city || interpreter.current_location || "—"}{interpreter.state ? `, ${interpreter.state}` : ""}</div>
                <span className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em]" style={{ backgroundColor: status === "active" ? "rgba(221,125,0,0.12)" : "rgba(114,17,0,0.08)", color: palette.burgundy }}>{rosterStatusLabel(status)}</span>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Link to={`/admin/interpreters/${interpreter.id}`} className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: palette.burgundy }}>
                  <Eye size={15} /> View profile
                </Link>
                <button type="button" disabled={deletingId === interpreter.id} onClick={() => onDelete(interpreter)} className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.burgundy, backgroundColor: palette.white }}>
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
              <div><strong style={{ color: palette.charcoal }}>Phone:</strong> {displayValue(interpreter.phone)}</div>
              <div>
                <strong style={{ color: palette.charcoal }}>Preferred contact:</strong>
                <ContactMethodButtons interpreter={interpreter} palette={palette} mutedText={mutedText} />
              </div>
              <div><strong style={{ color: palette.charcoal }}>Credentials:</strong> {displayValue(interpreter.credentials)}</div>
              <div><strong style={{ color: palette.charcoal }}>Modalities:</strong> {displayValue(interpreter.modalities)}</div>
              <div><strong style={{ color: palette.charcoal }}>Experience:</strong> {buildExperienceText(interpreter)}</div>
              <div className="flex items-center gap-2 font-bold"><BadgeCheck size={17} style={{ color: palette.gold }} /> {docCount} uploaded document record{docCount === 1 ? "" : "s"}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function InterpreterListView({ interpreters, palette, mutedText, cardStyle, tableHeader, deletingId, onDelete }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border shadow-sm" style={cardStyle}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead style={{ backgroundColor: tableHeader }}>
            <tr>
              {["First Name", "Last Name", "Email", "Phone", "Preferred Contact", "Credentials", "Modalities", "Experience", "Actions"].map((heading) => (
                <th key={heading} className="whitespace-nowrap border-b px-4 py-3 text-xs font-black uppercase tracking-[0.12em]" style={{ borderColor: palette.border, color: mutedText }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interpreters.map((interpreter) => (
              <tr key={interpreter.id} className="align-top">
                <TableCell palette={palette}>{displayValue(interpreter.first_name)}</TableCell>
                <TableCell palette={palette}>{displayValue(interpreter.last_name)}</TableCell>
                <TableCell palette={palette}><span className="break-words">{displayValue(interpreter.email)}</span></TableCell>
                <TableCell palette={palette}>{displayValue(interpreter.phone)}</TableCell>
                <TableCell palette={palette}><ContactMethodButtons interpreter={interpreter} palette={palette} mutedText={mutedText} compact /></TableCell>
                <TableCell palette={palette}><span className="min-w-44 max-w-72 whitespace-normal">{displayValue(interpreter.credentials)}</span></TableCell>
                <TableCell palette={palette}><span className="min-w-44 max-w-72 whitespace-normal">{displayValue(interpreter.modalities)}</span></TableCell>
                <TableCell palette={palette}><span className="min-w-52 max-w-80 whitespace-normal">{buildExperienceText(interpreter)}</span></TableCell>
                <td className="border-b px-4 py-4" style={{ borderColor: palette.border }}>
                  <div className="flex min-w-36 flex-col gap-2">
                    <Link to={`/admin/interpreters/${interpreter.id}`} className="inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: palette.burgundy }}>
                      <Eye size={14} /> View
                    </Link>
                    <button type="button" disabled={deletingId === interpreter.id} onClick={() => onDelete(interpreter)} className="inline-flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-bold disabled:opacity-60" style={{ borderColor: palette.border, color: palette.burgundy, backgroundColor: palette.white }}>
                      <Trash2 size={14} /> {deletingId === interpreter.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContactMethodButtons({ interpreter, palette, mutedText, compact = false }) {
  const methods = splitOptions(interpreter.preferred_contact_method);
  const email = safeText(interpreter.email).trim();
  const phone = normalizePhoneNumber(interpreter.phone);

  if (!methods.length) return <span className="ml-2" style={{ color: mutedText }}>—</span>;

  return (
    <div className={compact ? "flex min-w-36 flex-col gap-2" : "mt-2 flex flex-wrap gap-2"}>
      {methods.map((method) => {
        const normalized = method.toLowerCase();
        const isEmail = normalized.includes("email");
        const isText = normalized.includes("text");
        const isPhone = normalized.includes("phone") || normalized.includes("call");
        const href = isEmail && email ? `mailto:${email}` : isText && phone ? `sms:${phone}` : isPhone && phone ? `tel:${phone}` : "";
        const Icon = isEmail ? Mail : isText ? MessageSquare : Phone;
        const label = isEmail ? "Email" : isText ? "Text" : isPhone ? "Call" : method;
        const disabled = !href;

        if (disabled) {
          return (
            <span key={method} className="inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold opacity-60" style={{ borderColor: palette.border, color: mutedText, backgroundColor: palette.white }}>
              <Icon size={13} /> {label}
            </span>
          );
        }

        return (
          <a key={method} href={href} className="inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5" style={{ borderColor: palette.border, color: palette.burgundy, backgroundColor: palette.white }}>
            <Icon size={13} /> {label}
          </a>
        );
      })}
    </div>
  );
}

function TableCell({ children, palette }) {
  return (
    <td className="border-b px-4 py-4 font-semibold" style={{ borderColor: palette.border, color: palette.charcoal }}>
      {children}
    </td>
  );
}

function ViewToggleButton({ active, onClick, Icon, label, palette }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition"
      style={{
        backgroundColor: active ? palette.burgundy : "transparent",
        color: active ? "#ffffff" : palette.charcoal,
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function FilterCheckboxGroup({ label, values, onToggle, options, palette, mutedText, softPanel }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: palette.border, backgroundColor: softPanel }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: mutedText }}>{label}</span>
        <span className="rounded-full px-2 py-1 text-[10px] font-black" style={{ backgroundColor: values.length ? "rgba(221,125,0,0.14)" : "transparent", color: values.length ? palette.burgundy : mutedText }}>
          {values.length ? `${values.length} selected` : "Any"}
        </span>
      </div>
      <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
        {options.length ? options.map((option) => (
          <label key={option} className="flex items-start gap-2 text-xs font-semibold leading-5" style={{ color: palette.charcoal }}>
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              className="mt-1 h-4 w-4 rounded"
              style={{ accentColor: palette.burgundy }}
            />
            <span>{option}</span>
          </label>
        )) : (
          <p className="text-xs" style={{ color: mutedText }}>No options yet.</p>
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
