import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import {
  CREDENTIAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  MODALITY_OPTIONS,
  SETTING_OPTIONS,
} from "../forms";
import { Badge, Card, EmptyState, Hero, INPUT, SectionHeader, cx, parseRate, pretty } from "../ui";
import { ActionButton } from "./shared";

const CLIENT_STATUS_OPTIONS = ["active", "on_hold", "inactive"];
const CONTACT_OPTIONS = ["Email", "Phone", "Text"];
const CLIENT_SERVICE_OPTIONS = [
  "ASL/English Interpreting",
  "Certified Deaf Interpreter Team",
  "DeafBlind / ProTactile Access",
  "ASL Video Translation",
];
const CLIENT_DELIVERY_OPTIONS = ["On-site", "VRI", "Hybrid"];
const INTERPRETER_STATUS_OPTIONS = [
  "pending_profile",
  "pending_documents",
  "pending_screening",
  "active",
  "inactive",
];
const STATE_LICENSE_OPTIONS = ["Yes", "No", "In progress", "Not applicable"];
const ASSIGNMENT_PREFERENCE_OPTIONS = [
  "On-site only",
  "VRI only",
  "Both",
  "Depends on setting",
  "On-site",
  "VRI",
];
const TRAVEL_PREFERENCE_OPTIONS = ["Yes", "No", "Depends on assignment", "Limited"];
const VRI_READINESS_OPTIONS = [
  "Confirmed",
  "Needs review",
  "Not available",
  "Yes",
  "No",
  "Needs discussion",
];
const INSURANCE_OPTIONS = [
  "Current",
  "Pending",
  "Not currently held",
  "Yes",
  "No",
  "In progress",
];
const AVAILABILITY_BLOCKS = [
  "Morning (6AM-12PM EST)",
  "Afternoon (12PM-6PM EST)",
  "Evening (6PM-12AM EST)",
  "Overnight (12AM-6AM EST)",
];
const AVAILABILITY_DAYS = [
  ["Sunday", "availability_sunday"],
  ["Monday", "availability_monday"],
  ["Tuesday", "availability_tuesday"],
  ["Wednesday", "availability_wednesday"],
  ["Thursday", "availability_thursday"],
  ["Friday", "availability_friday"],
  ["Saturday", "availability_saturday"],
];

const EMPTY_CLIENT_FILTERS = {
  organization: "",
  contact: "",
  email: "",
  phone: "",
  billingEmail: "",
  billingPhone: "",
  address: "",
  postalCode: "",
  notes: "",
  industries: [],
  statuses: [],
  contactMethods: [],
  services: [],
  deliveryModes: [],
  cities: [],
  states: [],
  countries: [],
};

const EMPTY_INTERPRETER_FILTERS = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  postalCode: "",
  travelRadius: "",
  credentials: [],
  modalities: [],
  settings: [],
  experience: [],
  statuses: [],
  contactMethods: [],
  cities: [],
  states: [],
  countries: [],
  stateLicenses: [],
  assignmentPreferences: [],
  travelPreferences: [],
  vriReadiness: [],
  insuranceStatuses: [],
  availabilityDays: [],
  availabilityBlocks: [],
  rateType: "either",
  minRate: "",
  maxRate: "",
};

const CLIENT_SORT_OPTIONS = [
  ["organization", "Organization"],
  ["contact", "Primary contact"],
  ["email", "Email"],
  ["city", "City"],
  ["state", "State / province"],
  ["country", "Country"],
  ["industry", "Industry"],
  ["status", "Account status"],
  ["service", "Default service"],
  ["delivery", "Default delivery"],
];

const INTERPRETER_SORT_OPTIONS = [
  ["first_name", "First name"],
  ["last_name", "Last name"],
  ["email", "Email"],
  ["city", "City"],
  ["state", "State"],
  ["country", "Country"],
  ["credentials", "Credentials"],
  ["modalities", "Modalities"],
  ["settings", "Settings"],
  ["experience", "Experience"],
  ["assignment", "Assignment preference"],
  ["rate", "Rate"],
];

function safeText(value) {
  return value == null ? "" : String(value).trim();
}

function normalize(value) {
  return safeText(value).toLowerCase();
}

function displayValue(value) {
  return safeText(value) || "—";
}

function getLocation(record) {
  const cityState = [safeText(record.city), safeText(record.state)].filter(Boolean).join(", ");
  return cityState || safeText(record.current_location) || safeText(record.country);
}

function getAddress(record) {
  return [
    record.address_line_1,
    record.address_line_2,
    record.city,
    record.state,
    record.postal_code,
    record.country,
    record.current_location,
  ].map(safeText).filter(Boolean).join(" ");
}

function getInsuranceStatus(interpreter) {
  return safeText(interpreter.professional_liability_insurance || interpreter.insurance_status);
}

function getRate(interpreter, rateType = "either") {
  const onsite = parseRate(interpreter.onsite_rate);
  const vri = parseRate(interpreter.vri_rate);
  if (rateType === "onsite") return onsite;
  if (rateType === "vri") return vri;
  return onsite ?? vri;
}

function matchesText(value, filter) {
  return !safeText(filter) || normalize(value).includes(normalize(filter));
}

function matchesAnySelection(value, selected) {
  if (!selected.length) return true;
  const text = normalize(value);
  return selected.some((item) => {
    const option = normalize(item);
    return option === "other" ? text.includes("other") : text === option;
  });
}

function matchesAllSelections(value, selected) {
  if (!selected.length) return true;
  const text = normalize(value);
  return selected.every((item) => {
    const option = normalize(item);
    return option === "other" ? text.includes("other") : text.includes(option);
  });
}

function uniqueSorted(values) {
  const byNormalizedValue = new Map();
  values.map(safeText).filter(Boolean).forEach((value) => {
    const key = normalize(value);
    if (!byNormalizedValue.has(key)) byNormalizedValue.set(key, value);
  });
  return [...byNormalizedValue.values()].sort((a, b) => a.localeCompare(b));
}

function optionsWithSaved(preferred, savedValues) {
  const ordered = [];
  const seen = new Set();
  [...preferred, ...savedValues].map(safeText).filter(Boolean).forEach((value) => {
    const key = normalize(value);
    if (!seen.has(key)) {
      seen.add(key);
      ordered.push(value);
    }
  });
  return ordered;
}

function toggleSelection(setter, group, value) {
  setter((current) => ({
    ...current,
    [group]: current[group].includes(value)
      ? current[group].filter((item) => item !== value)
      : [...current[group], value],
  }));
}

function availableOnDay(interpreter, field) {
  const value = normalize(interpreter[field]);
  return Boolean(value) && value !== "unavailable";
}

function matchesAvailability(interpreter, selectedDays, selectedBlocks) {
  const relevantDays = selectedDays.length
    ? AVAILABILITY_DAYS.filter(([day]) => selectedDays.includes(day))
    : AVAILABILITY_DAYS;

  if (selectedDays.length && !relevantDays.every(([, field]) => availableOnDay(interpreter, field))) {
    return false;
  }
  if (!selectedBlocks.length) return true;

  const availabilityText = relevantDays
    .map(([, field]) => safeText(interpreter[field]))
    .join(" ")
    .toLowerCase();
  return selectedBlocks.every((block) => availabilityText.includes(normalize(block)));
}

function SortControl({ value, direction, options, setValue, setDirection }) {
  return (
    <label className="block text-xs font-black uppercase tracking-[.1em] text-slate-500">
      Sort by
      <span className="mt-2 flex gap-2">
        <select value={value} onChange={(event) => setValue(event.target.value)} className={cx(INPUT, "min-w-0 flex-1 normal-case tracking-normal")}>
          {options.map(([option, label]) => <option key={option} value={option}>{label}</option>)}
        </select>
        <button type="button" onClick={() => setDirection((current) => current === "asc" ? "desc" : "asc")} className="flex w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#721100] transition hover:border-[#dd7d00]/50" aria-label="Reverse sort direction">
          {direction === "asc" ? <ArrowDownAZ size={19} /> : <ArrowUpAZ size={19} />}
        </button>
      </span>
    </label>
  );
}

function ViewToggle({ mode, setMode }) {
  return (
    <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
      <button type="button" onClick={() => setMode("list")} className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition", mode === "list" ? "bg-[#721100] text-white" : "text-slate-600 hover:bg-slate-50")}><List size={16} /> List</button>
      <button type="button" onClick={() => setMode("cards")} className={cx("inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition", mode === "cards" ? "bg-[#721100] text-white" : "text-slate-600 hover:bg-slate-50")}><LayoutGrid size={16} /> Cards</button>
    </div>
  );
}

function OptionGroup({ label, options, values, onToggle, format = (value) => value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[.11em] text-[#dd7d00]">{label}</p>
      <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
        {options.length ? options.map((option) => (
          <label key={option} className="flex cursor-pointer items-start gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={values.includes(option)} onChange={() => onToggle(option)} className="mt-0.5 h-4 w-4 rounded accent-[#721100]" />
            <span>{format(option)}</span>
          </label>
        )) : <p className="text-xs leading-5 text-slate-400">No values are saved yet.</p>}
      </div>
    </div>
  );
}

function TextFilter({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">
      {label}
      <input className={cx(INPUT, "mt-2 normal-case tracking-normal")} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function FilterSection({ title, text, children }) {
  return (
    <section className="mt-5 border-t border-slate-100 pt-5 first:mt-0 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <p className="text-xs font-black uppercase tracking-[.12em] text-[#721100]">{title}</p>
        {text && <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>}
      </div>
      {children}
    </section>
  );
}

function SearchBar({ value, setValue, placeholder }) {
  return (
    <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-[#dd7d00] focus-within:ring-4 focus-within:ring-[#dd7d00]/10">
      <Search size={18} className="text-[#dd7d00]" />
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400" />
    </label>
  );
}

function DirectoryTabs({ active, setActive, clients, interpreters }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => setActive("clients")} className={cx("flex items-center justify-between rounded-[1.4rem] border p-4 text-left transition", active === "clients" ? "border-[#dd7d00] bg-[#fff8ec] shadow-lg" : "border-slate-200 bg-white hover:border-[#dd7d00]/40")}>
        <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Building2 size={18} /></span><span><span className="block font-black text-slate-950">Clients</span><span className="block text-xs text-slate-500">Organizations and contacts</span></span></span>
        <span className="text-2xl font-black text-[#721100]">{clients}</span>
      </button>
      <button type="button" onClick={() => setActive("interpreters")} className={cx("flex items-center justify-between rounded-[1.4rem] border p-4 text-left transition", active === "interpreters" ? "border-[#dd7d00] bg-[#fff8ec] shadow-lg" : "border-slate-200 bg-white hover:border-[#dd7d00]/40")}>
        <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Users size={18} /></span><span><span className="block font-black text-slate-950">Interpreters</span><span className="block text-xs text-slate-500">Roster and onboarding</span></span></span>
        <span className="text-2xl font-black text-[#721100]">{interpreters}</span>
      </button>
    </div>
  );
}

function PersonCard({ icon: Icon, title, subtitle, status, lines, onClick }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#dd7d00]/40 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={18} /></span>
        <span className="min-w-0 flex-1"><span className="block truncate font-black text-slate-950">{title}</span><span className="mt-1 block truncate text-xs text-slate-500">{subtitle}</span></span>
        <Badge value={status || "active"} />
      </div>
      <div className="mt-4 space-y-1 text-xs leading-5 text-slate-600">{lines.filter(Boolean).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>
    </button>
  );
}

function ClientTable({ clients, openClient }) {
  const headings = ["Organization", "Primary Contact", "Email", "Phone", "Preferred Contact", "Location", "Industry", "Default Service", "Delivery", "Status", "Actions"];
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#721100]/5"><tr>{headings.map((heading) => <th key={heading} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{heading}</th>)}</tr></thead>
          <tbody>{clients.map((client) => (
            <tr key={client.id} className="align-top transition hover:bg-[#fffaf2]">
              {[client.organization_name, client.primary_contact_name, client.email || client.billing_email, client.phone || client.billing_phone, client.preferred_contact_method, getLocation(client), client.industry, client.default_service_type, client.default_delivery_mode].map((value, index) => <td key={index} className="max-w-72 border-b border-slate-100 px-4 py-4 font-semibold text-slate-700"><span className="whitespace-normal">{displayValue(value)}</span></td>)}
              <td className="border-b border-slate-100 px-4 py-4"><Badge value={client.account_status || "active"} /></td>
              <td className="border-b border-slate-100 px-4 py-4"><button type="button" onClick={() => openClient(client)} className="rounded-xl bg-[#721100] px-3 py-2 text-xs font-black text-white">Open</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function InterpreterTable({ interpreters, onboarding, openInterpreter }) {
  const headings = ["First Name", "Last Name", "Email", "Phone", "Preferred Contact", "Location", "Credentials", "Modalities", "Settings", "Experience", "Assignment Preference", "On-site Rate", "VRI Rate", "Status", "Actions"];
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#721100]/5"><tr>{headings.map((heading) => <th key={heading} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{heading}</th>)}</tr></thead>
          <tbody>{interpreters.map((interpreter) => {
            const pipeline = onboarding.get(interpreter.id);
            return (
              <tr key={interpreter.id} className="align-top transition hover:bg-[#fffaf2]">
                {[interpreter.first_name, interpreter.last_name, interpreter.email, interpreter.phone, interpreter.preferred_contact_method, getLocation(interpreter), interpreter.credentials, interpreter.modalities, interpreter.areas_of_experience, interpreter.years_experience, interpreter.assignment_type_preference, interpreter.onsite_rate, interpreter.vri_rate].map((value, index) => <td key={index} className="max-w-72 border-b border-slate-100 px-4 py-4 font-semibold text-slate-700"><span className="whitespace-normal">{displayValue(value)}</span></td>)}
                <td className="border-b border-slate-100 px-4 py-4"><div className="space-y-2"><Badge value={interpreter.roster_status || "pending_profile"} />{pipeline && <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-[.08em] text-slate-400">{pretty(pipeline.stage)}</p>}</div></td>
                <td className="border-b border-slate-100 px-4 py-4"><button type="button" onClick={() => openInterpreter(interpreter)} className="rounded-xl bg-[#721100] px-3 py-2 text-xs font-black text-white">Open</button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPeopleV2({ workspace, v2, actions }) {
  const clients = workspace.admin?.clients || [];
  const interpreters = (workspace.admin?.interpreters || []).filter((item) => item.roster_status !== "removed");
  const onboarding = useMemo(() => new Map((v2?.onboarding || []).map((item) => [item.interpreter_id, item])), [v2?.onboarding]);

  const clientOptions = useMemo(() => ({
    industries: uniqueSorted(clients.map((item) => item.industry)),
    statuses: optionsWithSaved(CLIENT_STATUS_OPTIONS, clients.map((item) => item.account_status || "active")),
    contactMethods: optionsWithSaved(CONTACT_OPTIONS, clients.map((item) => item.preferred_contact_method)),
    services: optionsWithSaved(CLIENT_SERVICE_OPTIONS, clients.map((item) => item.default_service_type)),
    deliveryModes: optionsWithSaved(CLIENT_DELIVERY_OPTIONS, clients.map((item) => item.default_delivery_mode)),
    cities: uniqueSorted(clients.map((item) => item.city)),
    states: uniqueSorted(clients.map((item) => item.state)),
    countries: uniqueSorted(clients.map((item) => item.country)),
  }), [clients]);

  const interpreterOptions = useMemo(() => ({
    statuses: optionsWithSaved(INTERPRETER_STATUS_OPTIONS, interpreters.map((item) => item.roster_status || "pending_profile")),
    contactMethods: optionsWithSaved(CONTACT_OPTIONS, interpreters.map((item) => item.preferred_contact_method)),
    cities: uniqueSorted(interpreters.map((item) => item.city)),
    states: uniqueSorted(interpreters.map((item) => item.state)),
    countries: uniqueSorted(interpreters.map((item) => item.country)),
    stateLicenses: optionsWithSaved(STATE_LICENSE_OPTIONS, interpreters.map((item) => item.state_license)),
    assignmentPreferences: optionsWithSaved(ASSIGNMENT_PREFERENCE_OPTIONS, interpreters.map((item) => item.assignment_type_preference)),
    travelPreferences: optionsWithSaved(TRAVEL_PREFERENCE_OPTIONS, interpreters.map((item) => item.willing_to_travel)),
    vriReadiness: optionsWithSaved(VRI_READINESS_OPTIONS, interpreters.map((item) => item.technical_readiness_confirmed)),
    insuranceStatuses: optionsWithSaved(INSURANCE_OPTIONS, interpreters.map(getInsuranceStatus)),
  }), [interpreters]);

  const [directory, setDirectory] = useState("interpreters");
  const [clientView, setClientView] = useState("list");
  const [interpreterView, setInterpreterView] = useState("list");
  const [clientQuery, setClientQuery] = useState("");
  const [interpreterQuery, setInterpreterQuery] = useState("");
  const [clientFilters, setClientFilters] = useState(EMPTY_CLIENT_FILTERS);
  const [interpreterFilters, setInterpreterFilters] = useState(EMPTY_INTERPRETER_FILTERS);
  const [clientSort, setClientSort] = useState("organization");
  const [clientDirection, setClientDirection] = useState("asc");
  const [interpreterSort, setInterpreterSort] = useState("last_name");
  const [interpreterDirection, setInterpreterDirection] = useState("asc");

  const filteredClients = useMemo(() => {
    const global = normalize(clientQuery);
    return clients
      .filter((client) => {
        const haystack = [
          client.organization_name,
          client.primary_contact_name,
          client.email,
          client.phone,
          client.preferred_contact_method,
          client.billing_email,
          client.billing_phone,
          getAddress(client),
          client.industry,
          client.account_status,
          client.default_service_type,
          client.default_delivery_mode,
          client.communication_preferences,
          client.billing_notes,
        ].map(safeText).join(" ").toLowerCase();
        return (
          (!global || haystack.includes(global)) &&
          matchesText(client.organization_name, clientFilters.organization) &&
          matchesText(client.primary_contact_name, clientFilters.contact) &&
          matchesText(client.email, clientFilters.email) &&
          matchesText(client.phone, clientFilters.phone) &&
          matchesText(client.billing_email, clientFilters.billingEmail) &&
          matchesText(client.billing_phone, clientFilters.billingPhone) &&
          matchesText(getAddress(client), clientFilters.address) &&
          matchesText(client.postal_code, clientFilters.postalCode) &&
          matchesText([client.communication_preferences, client.billing_notes].map(safeText).join(" "), clientFilters.notes) &&
          matchesAnySelection(client.industry, clientFilters.industries) &&
          matchesAnySelection(client.account_status || "active", clientFilters.statuses) &&
          matchesAnySelection(client.preferred_contact_method, clientFilters.contactMethods) &&
          matchesAnySelection(client.default_service_type, clientFilters.services) &&
          matchesAnySelection(client.default_delivery_mode, clientFilters.deliveryModes) &&
          matchesAnySelection(client.city, clientFilters.cities) &&
          matchesAnySelection(client.state, clientFilters.states) &&
          matchesAnySelection(client.country, clientFilters.countries)
        );
      })
      .sort((a, b) => {
        const values = {
          organization: [a.organization_name, b.organization_name],
          contact: [a.primary_contact_name, b.primary_contact_name],
          email: [a.email || a.billing_email, b.email || b.billing_email],
          city: [a.city, b.city],
          state: [a.state, b.state],
          country: [a.country, b.country],
          industry: [a.industry, b.industry],
          status: [a.account_status || "active", b.account_status || "active"],
          service: [a.default_service_type, b.default_service_type],
          delivery: [a.default_delivery_mode, b.default_delivery_mode],
        }[clientSort] || [a.organization_name, b.organization_name];
        const result = safeText(values[0]).localeCompare(safeText(values[1]));
        return clientDirection === "asc" ? result : -result;
      });
  }, [clients, clientQuery, clientFilters, clientSort, clientDirection]);

  const filteredInterpreters = useMemo(() => {
    const global = normalize(interpreterQuery);
    const min = interpreterFilters.minRate === "" ? null : Number(interpreterFilters.minRate);
    const max = interpreterFilters.maxRate === "" ? null : Number(interpreterFilters.maxRate);
    return interpreters
      .filter((interpreter) => {
        const rate = getRate(interpreter, interpreterFilters.rateType);
        const availability = AVAILABILITY_DAYS.map(([, field]) => interpreter[field]).join(" ");
        const haystack = [
          interpreter.first_name,
          interpreter.last_name,
          interpreter.email,
          interpreter.phone,
          interpreter.preferred_contact_method,
          getAddress(interpreter),
          interpreter.credentials,
          interpreter.state_license,
          interpreter.state_license_details,
          interpreter.modalities,
          interpreter.areas_of_experience,
          interpreter.years_experience,
          interpreter.assignment_type_preference,
          interpreter.willing_to_travel,
          interpreter.travel_radius,
          interpreter.technical_readiness_confirmed,
          getInsuranceStatus(interpreter),
          availability,
          interpreter.roster_status,
          interpreter.onsite_rate,
          interpreter.vri_rate,
        ].map(safeText).join(" ").toLowerCase();
        return (
          (!global || haystack.includes(global)) &&
          matchesText(interpreter.first_name, interpreterFilters.firstName) &&
          matchesText(interpreter.last_name, interpreterFilters.lastName) &&
          matchesText(interpreter.email, interpreterFilters.email) &&
          matchesText(interpreter.phone, interpreterFilters.phone) &&
          matchesText(getAddress(interpreter), interpreterFilters.address) &&
          matchesText(interpreter.postal_code, interpreterFilters.postalCode) &&
          matchesText(interpreter.travel_radius, interpreterFilters.travelRadius) &&
          matchesAllSelections(interpreter.credentials, interpreterFilters.credentials) &&
          matchesAllSelections(interpreter.modalities, interpreterFilters.modalities) &&
          matchesAllSelections(interpreter.areas_of_experience, interpreterFilters.settings) &&
          matchesAnySelection(interpreter.years_experience, interpreterFilters.experience) &&
          matchesAnySelection(interpreter.roster_status || "pending_profile", interpreterFilters.statuses) &&
          matchesAnySelection(interpreter.preferred_contact_method, interpreterFilters.contactMethods) &&
          matchesAnySelection(interpreter.city, interpreterFilters.cities) &&
          matchesAnySelection(interpreter.state, interpreterFilters.states) &&
          matchesAnySelection(interpreter.country, interpreterFilters.countries) &&
          matchesAnySelection(interpreter.state_license, interpreterFilters.stateLicenses) &&
          matchesAnySelection(interpreter.assignment_type_preference, interpreterFilters.assignmentPreferences) &&
          matchesAnySelection(interpreter.willing_to_travel, interpreterFilters.travelPreferences) &&
          matchesAnySelection(interpreter.technical_readiness_confirmed, interpreterFilters.vriReadiness) &&
          matchesAnySelection(getInsuranceStatus(interpreter), interpreterFilters.insuranceStatuses) &&
          matchesAvailability(interpreter, interpreterFilters.availabilityDays, interpreterFilters.availabilityBlocks) &&
          (min == null || (rate != null && rate >= min)) &&
          (max == null || (rate != null && rate <= max))
        );
      })
      .sort((a, b) => {
        const values = {
          first_name: [a.first_name, b.first_name],
          last_name: [a.last_name, b.last_name],
          email: [a.email, b.email],
          city: [a.city, b.city],
          state: [a.state, b.state],
          country: [a.country, b.country],
          credentials: [a.credentials, b.credentials],
          modalities: [a.modalities, b.modalities],
          settings: [a.areas_of_experience, b.areas_of_experience],
          experience: [EXPERIENCE_OPTIONS.indexOf(safeText(a.years_experience)), EXPERIENCE_OPTIONS.indexOf(safeText(b.years_experience))],
          assignment: [a.assignment_type_preference, b.assignment_type_preference],
          rate: [getRate(a, interpreterFilters.rateType) ?? Number.POSITIVE_INFINITY, getRate(b, interpreterFilters.rateType) ?? Number.POSITIVE_INFINITY],
        }[interpreterSort] || [a.last_name, b.last_name];
        const result = typeof values[0] === "number" && typeof values[1] === "number" ? values[0] - values[1] : safeText(values[0]).localeCompare(safeText(values[1]));
        return interpreterDirection === "asc" ? result : -result;
      });
  }, [interpreters, interpreterQuery, interpreterFilters, interpreterSort, interpreterDirection]);

  function setClientText(field, value) {
    setClientFilters((current) => ({ ...current, [field]: value }));
  }

  function setInterpreterText(field, value) {
    setInterpreterFilters((current) => ({ ...current, [field]: value }));
  }

  function clearClients() {
    setClientQuery("");
    setClientFilters(EMPTY_CLIENT_FILTERS);
    setClientSort("organization");
    setClientDirection("asc");
  }

  function clearInterpreters() {
    setInterpreterQuery("");
    setInterpreterFilters(EMPTY_INTERPRETER_FILTERS);
    setInterpreterSort("last_name");
    setInterpreterDirection("asc");
  }

  return (
    <div className="space-y-6">
      <Hero eyebrow="People" title="Clients, interpreters, and applicants in one directory." text="Search, filter, sort, and open any profile to review documents, work history, onboarding, compliance, and communication records." actions={<ActionButton tone="gold" onClick={actions.openInvite}>Invite user</ActionButton>} />

      <DirectoryTabs active={directory} setActive={setDirectory} clients={clients.length} interpreters={interpreters.length} />

      {directory === "clients" ? (
        <>
          <Card>
            <SectionHeader eyebrow="Client filters" title="Filter using the same fields clients complete." text="Every filter below maps directly to a saved client profile field. Multiple choices within one category are treated as either/or." />
            <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center">
              <SearchBar value={clientQuery} setValue={setClientQuery} placeholder="Search every saved client profile field" />
              <ViewToggle mode={clientView} setMode={setClientView} />
            </div>

            <FilterSection title="Organization & contact">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextFilter label="Organization" value={clientFilters.organization} onChange={(value) => setClientText("organization", value)} />
                <TextFilter label="Primary contact" value={clientFilters.contact} onChange={(value) => setClientText("contact", value)} />
                <TextFilter label="Account email" value={clientFilters.email} onChange={(value) => setClientText("email", value)} />
                <TextFilter label="Phone" value={clientFilters.phone} onChange={(value) => setClientText("phone", value)} />
                <TextFilter label="Billing email" value={clientFilters.billingEmail} onChange={(value) => setClientText("billingEmail", value)} />
                <TextFilter label="Billing phone" value={clientFilters.billingPhone} onChange={(value) => setClientText("billingPhone", value)} />
                <TextFilter label="Address" value={clientFilters.address} onChange={(value) => setClientText("address", value)} placeholder="Street, city, state, or country" />
                <TextFilter label="Postal code" value={clientFilters.postalCode} onChange={(value) => setClientText("postalCode", value)} />
              </div>
            </FilterSection>

            <FilterSection title="Profile selections" text="These choices use the exact values saved by the client setup and profile forms.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OptionGroup label="Industry" options={clientOptions.industries} values={clientFilters.industries} onToggle={(value) => toggleSelection(setClientFilters, "industries", value)} />
                <OptionGroup label="Account status" options={clientOptions.statuses} values={clientFilters.statuses} onToggle={(value) => toggleSelection(setClientFilters, "statuses", value)} format={pretty} />
                <OptionGroup label="Preferred contact" options={clientOptions.contactMethods} values={clientFilters.contactMethods} onToggle={(value) => toggleSelection(setClientFilters, "contactMethods", value)} />
                <OptionGroup label="Default service" options={clientOptions.services} values={clientFilters.services} onToggle={(value) => toggleSelection(setClientFilters, "services", value)} />
                <OptionGroup label="Default delivery" options={clientOptions.deliveryModes} values={clientFilters.deliveryModes} onToggle={(value) => toggleSelection(setClientFilters, "deliveryModes", value)} />
                <OptionGroup label="City" options={clientOptions.cities} values={clientFilters.cities} onToggle={(value) => toggleSelection(setClientFilters, "cities", value)} />
                <OptionGroup label="State / province" options={clientOptions.states} values={clientFilters.states} onToggle={(value) => toggleSelection(setClientFilters, "states", value)} />
                <OptionGroup label="Country" options={clientOptions.countries} values={clientFilters.countries} onToggle={(value) => toggleSelection(setClientFilters, "countries", value)} />
              </div>
            </FilterSection>

            <FilterSection title="Notes & sorting">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextFilter label="Communication or billing notes" value={clientFilters.notes} onChange={(value) => setClientText("notes", value)} placeholder="Search saved preferences and notes" />
                <div className="xl:col-span-2" />
                <SortControl value={clientSort} direction={clientDirection} options={CLIENT_SORT_OPTIONS} setValue={setClientSort} setDirection={setClientDirection} />
              </div>
            </FilterSection>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-500"><SlidersHorizontal size={16} /> Showing {filteredClients.length} of {clients.length} clients</p>
              <ActionButton tone="soft" icon={X} onClick={clearClients}>Clear filters</ActionButton>
            </div>
          </Card>
          {filteredClients.length ? clientView === "list" ? <ClientTable clients={filteredClients} openClient={actions.openClient} /> : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredClients.map((client) => <PersonCard key={client.id} icon={Building2} title={client.organization_name || client.email} subtitle={client.primary_contact_name || client.email} status={client.account_status} lines={[[getLocation(client), client.industry].filter(Boolean).join(" · "), client.email, client.phone && `${client.preferred_contact_method || "Contact"}: ${client.phone}`, client.default_service_type && `${client.default_service_type} · ${client.default_delivery_mode || "Delivery not set"}`]} onClick={() => actions.openClient(client)} />)}
            </div>
          ) : <EmptyState icon={Building2} title="No clients match these filters" text="Clear one or more filters to see additional client accounts." action={<ActionButton tone="soft" onClick={clearClients}>Clear filters</ActionButton>} />}
        </>
      ) : (
        <>
          <Card>
            <SectionHeader eyebrow="Interpreter filters" title="Filter using the same fields interpreters complete." text="The roster filters now cover contact, location, credentials, assignment fit, compliance, availability, and rates from the interpreter forms." />
            <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center">
              <SearchBar value={interpreterQuery} setValue={setInterpreterQuery} placeholder="Search every saved interpreter profile field" />
              <ViewToggle mode={interpreterView} setMode={setInterpreterView} />
            </div>

            <FilterSection title="Contact & location">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TextFilter label="First name" value={interpreterFilters.firstName} onChange={(value) => setInterpreterText("firstName", value)} />
                <TextFilter label="Last name" value={interpreterFilters.lastName} onChange={(value) => setInterpreterText("lastName", value)} />
                <TextFilter label="Email" value={interpreterFilters.email} onChange={(value) => setInterpreterText("email", value)} />
                <TextFilter label="Phone" value={interpreterFilters.phone} onChange={(value) => setInterpreterText("phone", value)} />
                <TextFilter label="Address" value={interpreterFilters.address} onChange={(value) => setInterpreterText("address", value)} placeholder="Street, city, state, or country" />
                <TextFilter label="Postal code" value={interpreterFilters.postalCode} onChange={(value) => setInterpreterText("postalCode", value)} />
                <TextFilter label="Travel radius" value={interpreterFilters.travelRadius} onChange={(value) => setInterpreterText("travelRadius", value)} />
                <SortControl value={interpreterSort} direction={interpreterDirection} options={INTERPRETER_SORT_OPTIONS} setValue={setInterpreterSort} setDirection={setInterpreterDirection} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OptionGroup label="Preferred contact" options={interpreterOptions.contactMethods} values={interpreterFilters.contactMethods} onToggle={(value) => toggleSelection(setInterpreterFilters, "contactMethods", value)} />
                <OptionGroup label="City" options={interpreterOptions.cities} values={interpreterFilters.cities} onToggle={(value) => toggleSelection(setInterpreterFilters, "cities", value)} />
                <OptionGroup label="State" options={interpreterOptions.states} values={interpreterFilters.states} onToggle={(value) => toggleSelection(setInterpreterFilters, "states", value)} />
                <OptionGroup label="Country" options={interpreterOptions.countries} values={interpreterFilters.countries} onToggle={(value) => toggleSelection(setInterpreterFilters, "countries", value)} />
              </div>
            </FilterSection>

            <FilterSection title="Credentials & experience" text="Selecting multiple credentials, modalities, or settings requires an interpreter to match all selected items.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OptionGroup label="Credentials" options={CREDENTIAL_OPTIONS} values={interpreterFilters.credentials} onToggle={(value) => toggleSelection(setInterpreterFilters, "credentials", value)} />
                <OptionGroup label="Modalities" options={MODALITY_OPTIONS} values={interpreterFilters.modalities} onToggle={(value) => toggleSelection(setInterpreterFilters, "modalities", value)} />
                <OptionGroup label="Settings / areas of experience" options={SETTING_OPTIONS} values={interpreterFilters.settings} onToggle={(value) => toggleSelection(setInterpreterFilters, "settings", value)} />
                <OptionGroup label="Years of experience" options={EXPERIENCE_OPTIONS} values={interpreterFilters.experience} onToggle={(value) => toggleSelection(setInterpreterFilters, "experience", value)} />
              </div>
            </FilterSection>

            <FilterSection title="Assignment fit & compliance">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OptionGroup label="State license status" options={interpreterOptions.stateLicenses} values={interpreterFilters.stateLicenses} onToggle={(value) => toggleSelection(setInterpreterFilters, "stateLicenses", value)} />
                <OptionGroup label="Assignment preference" options={interpreterOptions.assignmentPreferences} values={interpreterFilters.assignmentPreferences} onToggle={(value) => toggleSelection(setInterpreterFilters, "assignmentPreferences", value)} />
                <OptionGroup label="Willing to travel" options={interpreterOptions.travelPreferences} values={interpreterFilters.travelPreferences} onToggle={(value) => toggleSelection(setInterpreterFilters, "travelPreferences", value)} />
                <OptionGroup label="VRI readiness" options={interpreterOptions.vriReadiness} values={interpreterFilters.vriReadiness} onToggle={(value) => toggleSelection(setInterpreterFilters, "vriReadiness", value)} />
                <OptionGroup label="Professional liability insurance" options={interpreterOptions.insuranceStatuses} values={interpreterFilters.insuranceStatuses} onToggle={(value) => toggleSelection(setInterpreterFilters, "insuranceStatuses", value)} />
                <OptionGroup label="Roster status" options={interpreterOptions.statuses} values={interpreterFilters.statuses} onToggle={(value) => toggleSelection(setInterpreterFilters, "statuses", value)} format={pretty} />
              </div>
            </FilterSection>

            <FilterSection title="Availability & rates" text="Days require availability on every selected day; selected time blocks must appear within those days.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <OptionGroup label="Available days" options={AVAILABILITY_DAYS.map(([day]) => day)} values={interpreterFilters.availabilityDays} onToggle={(value) => toggleSelection(setInterpreterFilters, "availabilityDays", value)} />
                <OptionGroup label="Availability blocks" options={AVAILABILITY_BLOCKS} values={interpreterFilters.availabilityBlocks} onToggle={(value) => toggleSelection(setInterpreterFilters, "availabilityBlocks", value)} />
                <label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Rate type<select className={cx(INPUT, "mt-2 normal-case tracking-normal")} value={interpreterFilters.rateType} onChange={(event) => setInterpreterFilters({ ...interpreterFilters, rateType: event.target.value })}><option value="either">Either rate</option><option value="onsite">On-site rate</option><option value="vri">VRI rate</option></select></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Minimum rate<input type="number" min="0" className={cx(INPUT, "mt-2 normal-case tracking-normal")} value={interpreterFilters.minRate} onChange={(event) => setInterpreterFilters({ ...interpreterFilters, minRate: event.target.value })} /></label>
                  <label className="text-xs font-black uppercase tracking-[.1em] text-slate-500">Maximum rate<input type="number" min="0" className={cx(INPUT, "mt-2 normal-case tracking-normal")} value={interpreterFilters.maxRate} onChange={(event) => setInterpreterFilters({ ...interpreterFilters, maxRate: event.target.value })} /></label>
                </div>
              </div>
            </FilterSection>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-500"><SlidersHorizontal size={16} /> Showing {filteredInterpreters.length} of {interpreters.length} interpreters</p>
              <ActionButton tone="soft" icon={X} onClick={clearInterpreters}>Clear filters</ActionButton>
            </div>
          </Card>
          {filteredInterpreters.length ? interpreterView === "list" ? <InterpreterTable interpreters={filteredInterpreters} onboarding={onboarding} openInterpreter={actions.openInterpreter} /> : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredInterpreters.map((interpreter) => {
                const pipeline = onboarding.get(interpreter.id);
                return <PersonCard key={interpreter.id} icon={Users} title={`${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email} subtitle={getLocation(interpreter) || interpreter.email} status={interpreter.roster_status} lines={[interpreter.email, interpreter.phone && `${interpreter.preferred_contact_method || "Contact"}: ${interpreter.phone}`, interpreter.credentials && `Credentials: ${interpreter.credentials}`, interpreter.modalities && `Modalities: ${interpreter.modalities}`, interpreter.years_experience && `Experience: ${interpreter.years_experience}`, interpreter.assignment_type_preference && `Assignment preference: ${interpreter.assignment_type_preference}`, pipeline && `Onboarding: ${pretty(pipeline.stage)}`]} onClick={() => actions.openInterpreter(interpreter)} />;
              })}
            </div>
          ) : <EmptyState icon={Users} title="No interpreters match these filters" text="Clear one or more filters to see additional roster profiles." action={<ActionButton tone="soft" onClick={clearInterpreters}>Clear filters</ActionButton>} />}
        </>
      )}
    </div>
  );
}
