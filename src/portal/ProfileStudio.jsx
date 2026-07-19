import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck, BriefcaseBusiness, Building2, Camera, ChevronDown, ChevronUp,
  CircleDollarSign, Eye, EyeOff, Globe2, GripVertical, Image, Link2, MapPin,
  Palette, Pencil, Plus, Save, Settings2, ShieldCheck, Sparkles, Trash2,
  Upload, UserRound, X,
} from "lucide-react";
import { displayRequestSetting, requestDefaultsFromClient } from "../requestFormConfig";
import { Badge, Field, INPUT, cx, pretty } from "./ui";

const THEMES = [
  ["MLS", "#721100", "#24130e", "#dd7d00"],
  ["Ocean", "#164e63", "#082f49", "#06b6d4"],
  ["Forest", "#166534", "#052e16", "#84cc16"],
  ["Royal", "#4338ca", "#1e1b4b", "#a78bfa"],
  ["Rose", "#9f1239", "#4c0519", "#fb7185"],
  ["Slate", "#334155", "#0f172a", "#94a3b8"],
];

const DEFAULTS = {
  display_name: "",
  headline: "",
  bio: "",
  location_label: "",
  website_url: "",
  theme_primary: "#721100",
  theme_secondary: "#24130e",
  theme_accent: "#dd7d00",
  background_style: "soft",
  card_style: "rounded",
  section_layout: [],
  section_visibility: {},
  social_links: [],
};

const hasValue = (value) => value !== null && value !== undefined && value !== "" && value !== false;

function nameFor(profileType, profile, custom) {
  if (custom?.display_name) return custom.display_name;
  if (profileType === "client") return profile?.organization_name || profile?.primary_contact_name || profile?.email || "Client";
  return `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Interpreter";
}

function fallbackHeadline(profileType, profile) {
  if (profileType === "client") return [profile?.industry, profile?.default_service_type].filter(Boolean).join(" · ") || "MLS client";
  return [profile?.credentials, profile?.years_experience].filter(Boolean).join(" · ") || "ASL–English interpreter";
}

function fallbackLocation(profile) {
  return profile?.current_location || [profile?.city, profile?.state].filter(Boolean).join(", ") || profile?.country || "";
}

function backgroundFor(theme) {
  if (theme.background_style === "gradient") return `linear-gradient(145deg, ${theme.theme_primary}24, ${theme.theme_accent}20 45%, ${theme.theme_secondary}14 100%)`;
  if (theme.background_style === "dark") return `linear-gradient(145deg, ${theme.theme_secondary}, ${theme.theme_primary} 72%, ${theme.theme_secondary})`;
  if (theme.background_style === "clean") return "#ffffff";
  return `linear-gradient(145deg, #ffffff 0%, ${theme.theme_accent}10 52%, ${theme.theme_primary}0d 100%)`;
}

function cardClasses(cardStyle) {
  if (cardStyle === "flat") return "rounded-xl shadow-none";
  if (cardStyle === "glass") return "rounded-[1.75rem] shadow-lg backdrop-blur-xl";
  return "rounded-[1.75rem] shadow-lg";
}

function surfaceFor(theme, dark) {
  if (dark) return { backgroundColor: "rgba(255,255,255,.075)", borderColor: `${theme.theme_accent}42` };
  if (theme.card_style === "glass") return { backgroundColor: "rgba(255,255,255,.66)", borderColor: `${theme.theme_primary}1f` };
  if (theme.card_style === "flat") return { backgroundColor: `${theme.theme_accent}0c`, borderColor: `${theme.theme_primary}1a` };
  return { backgroundColor: "rgba(255,255,255,.92)", borderColor: `${theme.theme_primary}18` };
}

function InfoItem({ label, value, theme, dark }) {
  return (
    <div
      className={cx("border p-4", theme.card_style === "flat" ? "rounded-lg" : "rounded-2xl")}
      style={{
        backgroundColor: dark ? "rgba(255,255,255,.07)" : `${theme.theme_accent}0d`,
        borderColor: dark ? "rgba(255,255,255,.12)" : `${theme.theme_primary}18`,
      }}
    >
      <p className="text-xs font-bold" style={{ color: dark ? theme.theme_accent : theme.theme_primary }}>{label}</p>
      <p className={cx("mt-1 whitespace-pre-wrap text-sm leading-6", dark ? "text-white/80" : "text-slate-700")}>{String(value)}</p>
    </div>
  );
}

function SectionCard({ section, theme, dark }) {
  const Icon = section.icon;
  const items = section.items.filter(([, value]) => hasValue(value));
  if (!items.length) return null;
  return (
    <section className={cx("border p-5", cardClasses(theme.card_style))} style={surfaceFor(theme, dark)}>
      <div className="flex items-center gap-3">
        <span
          className={cx("flex h-10 w-10 items-center justify-center", theme.card_style === "flat" ? "rounded-lg" : "rounded-2xl")}
          style={{ backgroundColor: dark ? "rgba(255,255,255,.10)" : `${theme.theme_accent}18`, color: dark ? theme.theme_accent : theme.theme_primary }}
        >
          <Icon size={18} />
        </span>
        <h2 className={cx("flex-1 text-lg font-black", dark ? "text-white" : "text-slate-950")}>{section.label}</h2>
        {section.privateSection && (
          <span className={cx("rounded-full px-2.5 py-1 text-[10px] font-black", dark ? "bg-white/10 text-white/65" : "bg-slate-100 text-slate-500")}>Private</span>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => <InfoItem key={label} label={label} value={value} theme={theme} dark={dark} />)}
      </div>
    </section>
  );
}

function sectionsFor(profileType, profile) {
  if (profileType === "client") {
    const defaults = requestDefaultsFromClient(profile);
    return [
      { key: "about", label: "About", icon: Building2, items: [["Industry", profile.industry], ["Primary contact", profile.primary_contact_name]] },
      { key: "contact", label: "Contact", icon: UserRound, items: [["Email", profile.email], ["Phone", profile.phone], ["Preferred contact", profile.preferred_contact_method]] },
      { key: "services", label: "Request defaults", icon: BriefcaseBusiness, items: [["Default service", defaults.serviceNeeded], ["Default setting", displayRequestSetting(defaults)], ["Communication styles", defaults.communicationStyles.join(", ")], ["Hearing languages", defaults.hearingParticipantsLanguages], ["Additional considerations", defaults.additionalConsiderations.join(", ")], ["CDI / additional support", defaults.cdiOrAdditionalSupportNeeded], ["Communication & access notes", defaults.communicationNotes]] },
      { key: "billing", label: "Billing", icon: CircleDollarSign, privateSection: true, items: [["Billing email", profile.billing_email], ["Billing phone", profile.billing_phone], ["Billing notes", profile.billing_notes], ["Billing address", [profile.address_line_1, profile.address_line_2, profile.city, profile.state, profile.postal_code].filter(Boolean).join(", ")]] },
    ];
  }
  return [
    { key: "about", label: "About", icon: UserRound, items: [["Experience", profile.years_experience], ["Preferred contact", profile.preferred_contact_method]] },
    { key: "credentials", label: "Credentials", icon: BadgeCheck, items: [["Credentials", profile.credentials], ["State license", profile.state_license], ["License details", profile.state_license_details], ["Screening", profile.screening_status ? pretty(profile.screening_status) : ""]] },
    { key: "practice", label: "Practice areas", icon: Sparkles, items: [["Modalities", profile.modalities], ["Settings", profile.areas_of_experience], ["Assignment preference", profile.assignment_type_preference], ["Education / ITP", profile.education_itp]] },
    { key: "logistics", label: "Availability and travel", icon: MapPin, items: [["Travel willingness", profile.willing_to_travel], ["Travel radius", profile.travel_radius], ["Time zone", profile.availability_timezone]] },
    { key: "rates", label: "Rates", icon: CircleDollarSign, privateSection: true, items: [["On-site rate", profile.onsite_rate], ["VRI rate", profile.vri_rate], ["Rate acknowledgment", profile.comfortable_with_rates]] },
    { key: "compliance", label: "Compliance", icon: ShieldCheck, privateSection: true, items: [["Professional liability insurance", profile.professional_liability_insurance], ["Insurance status", profile.insurance_status ? pretty(profile.insurance_status) : ""], ["W-9 status", profile.w9_status ? pretty(profile.w9_status) : ""], ["Technical readiness", profile.technical_readiness_confirmed]] },
  ];
}

function EditorPanel({ children, theme }) {
  const dark = theme.background_style === "dark";
  return <div className={cx("border p-4 sm:p-5", cardClasses(theme.card_style))} style={surfaceFor(theme, dark)}>{children}</div>;
}

function ProfileEditor({ draft, setDraft, sections, move, toggle, save, cancel, saving, uploadMedia, removeMedia, customization }) {
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const dark = draft.background_style === "dark";
  const addLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    setDraft((current) => ({ ...current, social_links: [...(current.social_links || []), newLink].slice(0, 8) }));
    setNewLink({ label: "", url: "" });
  };

  return (
    <div className={cx("overflow-hidden border", cardClasses(draft.card_style))} style={surfaceFor(draft, dark)}>
      <div className="flex items-center justify-between border-b px-5 py-4 text-white" style={{ background: `linear-gradient(120deg, ${draft.theme_secondary}, ${draft.theme_primary})`, borderColor: `${draft.theme_accent}42` }}>
        <h2 className="text-xl font-black">Customize profile</h2>
        <button type="button" onClick={cancel} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><X size={18} /></button>
      </div>

      <div className="grid gap-5 p-3 sm:p-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-5">
          <EditorPanel theme={draft}>
            <div className={cx("grid gap-4 sm:grid-cols-2", dark && "[&_label]:text-white/80")}>
              <Field name="Display name"><input className={INPUT} value={draft.display_name || ""} onChange={(event) => setDraft({ ...draft, display_name: event.target.value })} maxLength={120} /></Field>
              <Field name="Headline"><input className={INPUT} value={draft.headline || ""} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} maxLength={160} /></Field>
              <Field name="Location"><input className={INPUT} value={draft.location_label || ""} onChange={(event) => setDraft({ ...draft, location_label: event.target.value })} /></Field>
              <Field name="Website"><input className={INPUT} type="url" placeholder="https://" value={draft.website_url || ""} onChange={(event) => setDraft({ ...draft, website_url: event.target.value })} /></Field>
            </div>
            <div className={cx("mt-4", dark && "[&_label]:text-white/80")}><Field name="Bio"><textarea className={cx(INPUT, "min-h-28")} value={draft.bio || ""} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} maxLength={2000} /></Field></div>
          </EditorPanel>

          <EditorPanel theme={draft}>
            <div className="flex items-center gap-3"><Palette size={18} style={{ color: draft.theme_accent }} /><h3 className={cx("font-black", dark ? "text-white" : "text-slate-950")}>Appearance</h3></div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {THEMES.map(([name, primary, secondary, accent]) => (
                <button key={name} type="button" onClick={() => setDraft({ ...draft, theme_primary: primary, theme_secondary: secondary, theme_accent: accent })} className={cx("border p-2 text-center text-[10px] font-black", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl", dark ? "border-white/15 bg-white/10 text-white/80" : "border-slate-200 bg-white text-slate-600")}>
                  <span className="mx-auto flex h-8 overflow-hidden rounded-xl"><span className="flex-1" style={{ backgroundColor: primary }} /><span className="flex-1" style={{ backgroundColor: secondary }} /><span className="flex-1" style={{ backgroundColor: accent }} /></span>
                  <span className="mt-1 block">{name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[["Primary", "theme_primary"], ["Secondary", "theme_secondary"], ["Accent", "theme_accent"]].map(([label, key]) => (
                <label key={key} className={cx("p-3 text-xs font-black", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl", dark ? "bg-white/10 text-white/80" : "bg-white text-slate-600")}>
                  <span>{label}</span><span className="mt-2 flex items-center gap-2"><input type="color" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="h-10 w-12 rounded-lg border-0 bg-transparent" /><input className={cx(INPUT, "min-w-0 px-2 py-2 text-xs")} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></span>
                </label>
              ))}
            </div>
            <div className={cx("mt-4 grid gap-3 sm:grid-cols-2", dark && "[&_label]:text-white/80")}>
              <Field name="Background"><select className={INPUT} value={draft.background_style} onChange={(event) => setDraft({ ...draft, background_style: event.target.value })}><option value="soft">Soft</option><option value="clean">Clean</option><option value="gradient">Gradient</option><option value="dark">Dark</option></select></Field>
              <Field name="Cards"><select className={INPUT} value={draft.card_style} onChange={(event) => setDraft({ ...draft, card_style: event.target.value })}><option value="rounded">Rounded</option><option value="glass">Glass</option><option value="flat">Flat</option></select></Field>
            </div>
          </EditorPanel>

          <EditorPanel theme={draft}>
            <h3 className={cx("font-black", dark ? "text-white" : "text-slate-950")}>Links</h3>
            <div className="mt-3 space-y-2">{(draft.social_links || []).map((link, index) => <div key={`${link.label}-${index}`} className={cx("flex items-center gap-2 p-3", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl")} style={{ backgroundColor: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.82)" }}><Link2 size={15} style={{ color: draft.theme_accent }} /><div className="min-w-0 flex-1"><p className={cx("truncate text-sm font-black", dark ? "text-white" : "text-slate-900")}>{link.label}</p><p className={cx("truncate text-xs", dark ? "text-white/50" : "text-slate-400")}>{link.url}</p></div><button type="button" onClick={() => setDraft({ ...draft, social_links: draft.social_links.filter((_, itemIndex) => itemIndex !== index) })} className="text-rose-500"><Trash2 size={16} /></button></div>)}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[.6fr_1fr_auto]"><input className={INPUT} placeholder="Label" value={newLink.label} onChange={(event) => setNewLink({ ...newLink, label: event.target.value })} /><input className={INPUT} placeholder="https://" value={newLink.url} onChange={(event) => setNewLink({ ...newLink, url: event.target.value })} /><button type="button" onClick={addLink} className="flex items-center justify-center rounded-2xl px-4 text-white" style={{ backgroundColor: draft.theme_primary }}><Plus size={17} /></button></div>
          </EditorPanel>
        </div>

        <div className="space-y-5">
          <EditorPanel theme={draft}>
            <h3 className={cx("font-black", dark ? "text-white" : "text-slate-950")}>Photos</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={cx("cursor-pointer border border-dashed p-5 text-center", draft.card_style === "flat" ? "rounded-lg" : "rounded-[1.5rem]", dark ? "border-white/25 bg-white/5 text-white" : "border-slate-300 bg-white/65 text-slate-900")}><Camera className="mx-auto" style={{ color: draft.theme_accent }} size={22} /><p className="mt-2 text-sm font-black">Profile photo</p><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && uploadMedia("avatar", event.target.files[0])} /></label>
              <label className={cx("cursor-pointer border border-dashed p-5 text-center", draft.card_style === "flat" ? "rounded-lg" : "rounded-[1.5rem]", dark ? "border-white/25 bg-white/5 text-white" : "border-slate-300 bg-white/65 text-slate-900")}><Image className="mx-auto" style={{ color: draft.theme_accent }} size={22} /><p className="mt-2 text-sm font-black">Banner</p><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && uploadMedia("banner", event.target.files[0])} /></label>
            </div>
            {(customization?.avatar_path || customization?.banner_path) && <div className="mt-3 flex flex-wrap gap-2">{customization?.avatar_path && <button type="button" onClick={() => removeMedia("avatar")} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700">Remove photo</button>}{customization?.banner_path && <button type="button" onClick={() => removeMedia("banner")} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700">Remove banner</button>}</div>}
          </EditorPanel>

          <EditorPanel theme={draft}>
            <div className="flex items-center gap-3"><GripVertical size={18} style={{ color: draft.theme_accent }} /><h3 className={cx("font-black", dark ? "text-white" : "text-slate-950")}>Sections</h3></div>
            <div className="mt-4 space-y-2">
              {sections.map((section, index) => {
                const visible = draft.section_visibility?.[section.key] !== false;
                return <div key={section.key} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); move(Number(event.dataTransfer.getData("text/plain")), index); }} className={cx("flex items-center gap-2 border p-3", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl")} style={{ backgroundColor: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.82)", borderColor: dark ? "rgba(255,255,255,.14)" : `${draft.theme_primary}18` }}><GripVertical size={16} className="cursor-grab opacity-40" /><span className={cx("min-w-0 flex-1 text-sm font-black", dark ? "text-white/85" : "text-slate-800")}>{section.label}</span><button type="button" onClick={() => toggle(section.key)} className={dark ? "text-white/60" : "text-slate-500"}>{visible ? <Eye size={16} /> : <EyeOff size={16} />}</button><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="disabled:opacity-25"><ChevronUp size={16} /></button><button type="button" disabled={index === sections.length - 1} onClick={() => move(index, index + 1)} className="disabled:opacity-25"><ChevronDown size={16} /></button></div>;
              })}
            </div>
          </EditorPanel>

          <div className={cx("mls-mobile-sticky-actions sticky flex gap-3 border p-3 backdrop-blur-xl", cardClasses(draft.card_style))} style={surfaceFor(draft, dark)}>
            <button type="button" onClick={cancel} className={cx("flex flex-1 items-center justify-center border px-4 py-3 text-sm font-black", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl", dark ? "border-white/15 text-white/80" : "border-slate-200 text-slate-700")}>Cancel</button>
            <button type="button" onClick={save} disabled={saving} className={cx("flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white disabled:opacity-50", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl")} style={{ backgroundColor: draft.theme_primary }}><Save size={16} /> Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileStudio({ profileType, profile = {}, customization, actions, editable = true, ownerId }) {
  const avatarInput = useRef(null);
  const bannerInput = useRef(null);
  const [mediaBusy, setMediaBusy] = useState("");
  const baseSections = useMemo(() => sectionsFor(profileType, profile), [profileType, profile]);
  const defaultOrder = useMemo(() => baseSections.map((section) => section.key), [baseSections]);
  const merged = useMemo(() => ({
    ...DEFAULTS,
    display_name: nameFor(profileType, profile, customization),
    headline: customization?.headline || fallbackHeadline(profileType, profile),
    location_label: customization?.location_label || fallbackLocation(profile),
    ...customization,
    section_layout: customization?.section_layout?.length ? customization.section_layout : defaultOrder,
    section_visibility: customization?.section_visibility || {},
    social_links: customization?.social_links || [],
  }), [customization, defaultOrder, profile, profileType]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(merged);

  useEffect(() => setDraft(merged), [merged]);

  const orderedSections = useMemo(() => {
    const map = new Map(baseSections.map((section) => [section.key, section]));
    const ordered = (draft.section_layout || defaultOrder).map((key) => map.get(key)).filter(Boolean);
    baseSections.forEach((section) => { if (!ordered.some((item) => item.key === section.key)) ordered.push(section); });
    return ordered;
  }, [baseSections, defaultOrder, draft.section_layout]);

  const move = (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    const next = orderedSections.map((section) => section.key);
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setDraft((current) => ({ ...current, section_layout: next }));
  };

  const toggle = (key) => setDraft((current) => ({ ...current, section_visibility: { ...(current.section_visibility || {}), [key]: current.section_visibility?.[key] === false } }));
  const save = async () => {
    await actions.saveProfileCustomization({ profileType, ownerId: ownerId || profile.id || null, customization: draft });
    setEditing(false);
  };
  const uploadMedia = async (mediaType, file) => {
    if (!file) return;
    setMediaBusy(mediaType);
    try { await actions.uploadProfileMedia({ profileType, ownerId: ownerId || profile.id || null, mediaType, file }); }
    finally { setMediaBusy(""); }
  };
  const removeMedia = (mediaType) => actions.removeProfileMedia({ profileType, ownerId: ownerId || profile.id || null, mediaType });

  const background = backgroundFor(draft);
  const dark = draft.background_style === "dark";
  const shownSections = orderedSections.filter((section) => draft.section_visibility?.[section.key] !== false && section.items.some(([, value]) => hasValue(value)));
  const initials = nameFor(profileType, profile, draft).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
  const profileSurface = surfaceFor(draft, dark);

  return (
    <div className={cx("relative overflow-hidden border p-3 sm:p-5 lg:p-6", draft.card_style === "flat" ? "rounded-2xl" : "rounded-[2.4rem]")} style={{ background, borderColor: dark ? `${draft.theme_accent}42` : `${draft.theme_primary}1f`, boxShadow: dark ? `0 28px 80px ${draft.theme_secondary}66` : `0 28px 80px ${draft.theme_primary}16` }}>
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 8% 8%, ${draft.theme_accent}24, transparent 28%), radial-gradient(circle at 92% 2%, ${draft.theme_primary}20, transparent 30%)` }} />
      <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { uploadMedia("avatar", event.target.files?.[0]); event.target.value = ""; }} />
      <input ref={bannerInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { uploadMedia("banner", event.target.files?.[0]); event.target.value = ""; }} />

      <div className="relative space-y-5">
        <div className={cx("overflow-hidden border", draft.card_style === "flat" ? "rounded-xl" : "rounded-[2rem]")} style={{ ...profileSurface, boxShadow: draft.card_style === "flat" ? "none" : `0 20px 50px ${draft.theme_secondary}20` }}>
          <div className="relative h-44 sm:h-56" style={{ background: customization?.banner_url ? undefined : `linear-gradient(120deg, ${draft.theme_secondary}, ${draft.theme_primary} 55%, ${draft.theme_accent})` }}>
            {customization?.banner_url && <img src={customization.banner_url} alt="Profile banner" className="h-full w-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />
            {editable && <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2 sm:right-4 sm:top-4"><button type="button" onClick={() => bannerInput.current?.click()} disabled={mediaBusy === "banner"} className={cx("inline-flex min-h-10 items-center gap-2 bg-white/90 px-3 py-2 text-xs font-black shadow-lg backdrop-blur disabled:opacity-50", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl")} style={{ color: draft.theme_secondary }}><Upload size={15} /><span className="hidden sm:inline">{mediaBusy === "banner" ? "Uploading…" : "Change banner"}</span></button><button type="button" onClick={() => setEditing((value) => !value)} className={cx("inline-flex min-h-10 items-center gap-2 bg-white/90 px-3 py-2 text-xs font-black shadow-lg backdrop-blur", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl")} style={{ color: draft.theme_secondary }}><Palette size={15} /><span className="hidden sm:inline">Customize</span></button></div>}
          </div>

          <div className="relative px-5 pb-6 sm:px-7">
            <div className="-mt-16 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <button type="button" disabled={!editable || Boolean(mediaBusy)} onClick={() => editable && avatarInput.current?.click()} className={cx("group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden border-[6px] text-3xl font-black shadow-xl disabled:cursor-default", draft.card_style === "flat" ? "rounded-xl" : "rounded-[2rem]")} style={{ color: draft.theme_primary, backgroundColor: dark ? draft.theme_secondary : "#ffffff", borderColor: dark ? `${draft.theme_accent}66` : "#ffffff" }} aria-label={customization?.avatar_url ? "Change profile photo" : "Add profile photo"}>
                  {customization?.avatar_url ? <img src={customization.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : <span style={{ backgroundColor: dark ? "rgba(255,255,255,.08)" : `${draft.theme_primary}14` }} className="flex h-full w-full items-center justify-center">{initials}</span>}
                  {editable && <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-xl bg-black/70 px-2 py-1.5 text-[10px] font-black text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><Camera size={13} />{mediaBusy === "avatar" ? "Uploading…" : customization?.avatar_url ? "Change photo" : "Add photo"}</span>}
                </button>
                <div className="min-w-0 pb-1"><h1 className={cx("break-words text-2xl font-black sm:text-3xl", dark ? "text-white" : "text-slate-950")}>{nameFor(profileType, profile, draft)}</h1><p className={cx("mt-2 text-sm font-semibold", dark ? "text-white/70" : "text-slate-600")}>{draft.headline || fallbackHeadline(profileType, profile)}</p></div>
              </div>
              {editable && <button type="button" onClick={actions.openProfile} className={cx("inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-white shadow-lg", draft.card_style === "flat" ? "rounded-lg" : "rounded-2xl")} style={{ backgroundColor: draft.theme_primary }}><Pencil size={16} /> Edit details</button>}
            </div>

            <div className={cx("mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold", dark ? "text-white/70" : "text-slate-600")}>{draft.location_label && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{draft.location_label}</span>}{draft.website_url && <a href={draft.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Globe2 size={15} />Website</a>}{(draft.social_links || []).map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Link2 size={15} />{link.label}</a>)}</div>
            {draft.bio && <p className={cx("mt-5 max-w-4xl whitespace-pre-wrap text-sm leading-7", dark ? "text-white/80" : "text-slate-700")}>{draft.bio}</p>}
            <div className="mt-5"><Badge value={profileType === "client" ? profile.account_status || "active" : profile.roster_status || "pending_profile"} /></div>
          </div>
        </div>

        {editing && <ProfileEditor draft={draft} setDraft={setDraft} sections={orderedSections} move={move} toggle={toggle} save={save} cancel={() => { setDraft(merged); setEditing(false); }} saving={false} uploadMedia={uploadMedia} removeMedia={removeMedia} customization={customization} />}

        <div className="grid gap-5 xl:grid-cols-2">{shownSections.map((section) => <SectionCard key={section.key} section={section} theme={draft} dark={dark} />)}</div>

        {!shownSections.length && <div className={cx("border p-8 text-center", cardClasses(draft.card_style))} style={surfaceFor(draft, dark)}><Settings2 className="mx-auto" style={{ color: dark ? "rgba(255,255,255,.35)" : `${draft.theme_primary}55` }} /><p className={cx("mt-3 font-black", dark ? "text-white" : "text-slate-800")}>No profile details</p></div>}
      </div>
    </div>
  );
}
