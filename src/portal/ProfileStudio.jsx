import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, BriefcaseBusiness, Building2, Camera, ChevronDown, ChevronUp,
  CircleDollarSign, Eye, EyeOff, Globe2, GripVertical, Link2, MapPin,
  Palette, Pencil, Plus, Save, Settings2, ShieldCheck, Sparkles, Trash2,
  Upload, UserRound, X,
} from "lucide-react";
import { Badge, Card, Field, INPUT, cx, pretty } from "./ui";

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

function nameFor(profileType, profile, custom) {
  if (custom?.display_name) return custom.display_name;
  if (profileType === "client") return profile?.organization_name || profile?.primary_contact_name || profile?.email || "Client profile";
  return `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.email || "Interpreter profile";
}

function fallbackHeadline(profileType, profile) {
  if (profileType === "client") return [profile?.industry, profile?.default_service_type].filter(Boolean).join(" · ") || "MLS client account";
  return [profile?.credentials, profile?.years_experience].filter(Boolean).join(" · ") || "ASL–English interpreter";
}

function fallbackLocation(profile) {
  return profile?.current_location || [profile?.city, profile?.state].filter(Boolean).join(", ") || profile?.country || "";
}

function Item({ label, value, privateValue = false }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/75 p-4 shadow-sm backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[.11em] text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-700">{value || "Not provided"}{privateValue ? <span className="ml-2 text-[9px] font-black uppercase text-slate-400">Private</span> : null}</p>
    </div>
  );
}

function SectionCard({ section, style, accent }) {
  const Icon = section.icon;
  return (
    <section className={cx("border border-black/5 bg-white/85 p-5 shadow-sm backdrop-blur", style)}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}1a`, color: accent }}><Icon size={18} /></span>
        <div><p className="text-[10px] font-black uppercase tracking-[.12em]" style={{ color: accent }}>{section.eyebrow}</p><h2 className="text-lg font-black text-slate-950">{section.label}</h2></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{section.items.map(([label, value, privateValue]) => <Item key={label} label={label} value={value} privateValue={privateValue} />)}</div>
    </section>
  );
}

function sectionsFor(profileType, profile) {
  if (profileType === "client") {
    return [
      { key: "about", label: "About", eyebrow: "Organization", icon: Building2, items: [["Organization", profile.organization_name], ["Industry", profile.industry], ["Primary contact", profile.primary_contact_name], ["Account status", pretty(profile.account_status || "active")]] },
      { key: "contact", label: "Contact", eyebrow: "Communication", icon: UserRound, items: [["Email", profile.email], ["Phone", profile.phone], ["Preferred contact", profile.preferred_contact_method], ["Location", fallbackLocation(profile)]] },
      { key: "services", label: "Service preferences", eyebrow: "Access planning", icon: BriefcaseBusiness, items: [["Default service", profile.default_service_type], ["Delivery mode", profile.default_delivery_mode], ["Communication preferences", profile.communication_preferences], ["Country", profile.country]] },
      { key: "billing", label: "Billing profile", eyebrow: "Private account details", icon: CircleDollarSign, items: [["Billing email", profile.billing_email, true], ["Billing phone", profile.billing_phone, true], ["Billing notes", profile.billing_notes, true], ["Billing address", [profile.address_line_1, profile.address_line_2, profile.city, profile.state, profile.postal_code].filter(Boolean).join(", "), true]] },
    ];
  }
  return [
    { key: "about", label: "About", eyebrow: "Interpreter profile", icon: UserRound, items: [["Name", `${profile.first_name || ""} ${profile.last_name || ""}`.trim()], ["Location", fallbackLocation(profile)], ["Experience", profile.years_experience], ["Preferred contact", profile.preferred_contact_method]] },
    { key: "credentials", label: "Credentials", eyebrow: "Qualifications", icon: BadgeCheck, items: [["Credentials", profile.credentials], ["State license", profile.state_license], ["License details", profile.state_license_details], ["Screening", pretty(profile.screening_status)]] },
    { key: "practice", label: "Practice areas", eyebrow: "Professional fit", icon: Sparkles, items: [["Modalities", profile.modalities], ["Settings", profile.areas_of_experience], ["Assignment preference", profile.assignment_type_preference], ["Education / ITP", profile.education_itp]] },
    { key: "logistics", label: "Availability and travel", eyebrow: "Assignment logistics", icon: MapPin, items: [["Travel willingness", profile.willing_to_travel], ["Travel radius", profile.travel_radius], ["Current location", profile.current_location], ["Time zone", profile.availability_timezone]] },
    { key: "rates", label: "Rates", eyebrow: "Private business details", icon: CircleDollarSign, items: [["On-site rate", profile.onsite_rate, true], ["VRI rate", profile.vri_rate, true], ["Rate acknowledgment", profile.comfortable_with_rates, true], ["Roster status", pretty(profile.roster_status), true]] },
    { key: "compliance", label: "Compliance", eyebrow: "Professional readiness", icon: ShieldCheck, items: [["Professional liability insurance", profile.professional_liability_insurance, true], ["Insurance status", pretty(profile.insurance_status), true], ["W-9 status", pretty(profile.w9_status), true], ["Technical readiness", profile.technical_readiness_confirmed, true]] },
  ];
}

function ProfileEditor({ draft, setDraft, sections, move, toggle, save, cancel, saving, uploadMedia, removeMedia, customization }) {
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const addLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    setDraft((current) => ({ ...current, social_links: [...(current.social_links || []), newLink].slice(0, 8) }));
    setNewLink({ label: "", url: "" });
  };

  return (
    <Card className="overflow-hidden p-0 md:p-0">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-white/50">Profile studio</p><h2 className="mt-1 text-xl font-black">Customize your profile</h2></div><button type="button" onClick={cancel} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><X size={18} /></button></div></div>
      <div className="grid gap-6 p-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="Display name"><input className={INPUT} value={draft.display_name || ""} onChange={(event) => setDraft({ ...draft, display_name: event.target.value })} maxLength={120} /></Field>
            <Field name="Headline"><input className={INPUT} value={draft.headline || ""} onChange={(event) => setDraft({ ...draft, headline: event.target.value })} maxLength={160} /></Field>
            <Field name="Location label"><input className={INPUT} value={draft.location_label || ""} onChange={(event) => setDraft({ ...draft, location_label: event.target.value })} /></Field>
            <Field name="Website"><input className={INPUT} type="url" placeholder="https://" value={draft.website_url || ""} onChange={(event) => setDraft({ ...draft, website_url: event.target.value })} /></Field>
          </div>
          <Field name="Bio"><textarea className={cx(INPUT, "min-h-32")} value={draft.bio || ""} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} maxLength={2000} /></Field>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3"><Palette size={18} className="text-[#721100]" /><div><p className="font-black text-slate-950">Theme</p><p className="text-xs text-slate-500">Choose a preset or fine-tune your colors.</p></div></div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{THEMES.map(([name, primary, secondary, accent]) => <button key={name} type="button" onClick={() => setDraft({ ...draft, theme_primary: primary, theme_secondary: secondary, theme_accent: accent })} className="rounded-2xl border border-slate-200 bg-white p-2 text-center text-[10px] font-black text-slate-600"><span className="mx-auto flex h-8 overflow-hidden rounded-xl"><span className="flex-1" style={{ backgroundColor: primary }} /><span className="flex-1" style={{ backgroundColor: secondary }} /><span className="flex-1" style={{ backgroundColor: accent }} /></span><span className="mt-1 block">{name}</span></button>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Primary", "theme_primary"], ["Secondary", "theme_secondary"], ["Accent", "theme_accent"]].map(([label, key]) => <label key={key} className="rounded-2xl bg-white p-3 text-xs font-black text-slate-600"><span>{label}</span><span className="mt-2 flex items-center gap-2"><input type="color" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} className="h-10 w-12 rounded-lg border-0 bg-transparent" /><input className={cx(INPUT, "min-w-0 px-2 py-2 text-xs")} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></span></label>)}</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2"><Field name="Background"><select className={INPUT} value={draft.background_style} onChange={(event) => setDraft({ ...draft, background_style: event.target.value })}><option value="soft">Soft</option><option value="clean">Clean</option><option value="gradient">Gradient</option><option value="dark">Dark</option></select></Field><Field name="Card style"><select className={INPUT} value={draft.card_style} onChange={(event) => setDraft({ ...draft, card_style: event.target.value })}><option value="rounded">Rounded</option><option value="glass">Glass</option><option value="flat">Flat</option></select></Field></div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="font-black text-slate-950">Profile links</p><div className="mt-4 space-y-2">{(draft.social_links || []).map((link, index) => <div key={`${link.label}-${index}`} className="flex items-center gap-2 rounded-2xl bg-white p-3"><Link2 size={15} className="text-slate-400" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{link.label}</p><p className="truncate text-xs text-slate-400">{link.url}</p></div><button type="button" onClick={() => setDraft({ ...draft, social_links: draft.social_links.filter((_, itemIndex) => itemIndex !== index) })} className="text-rose-600"><Trash2 size={16} /></button></div>)}</div><div className="mt-3 grid gap-2 sm:grid-cols-[.6fr_1fr_auto]"><input className={INPUT} placeholder="Label" value={newLink.label} onChange={(event) => setNewLink({ ...newLink, label: event.target.value })} /><input className={INPUT} placeholder="https://" value={newLink.url} onChange={(event) => setNewLink({ ...newLink, url: event.target.value })} /><button type="button" onClick={addLink} className="flex items-center justify-center rounded-2xl bg-slate-900 px-4 text-white"><Plus size={17} /></button></div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="group cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><Camera className="mx-auto text-[#721100]" size={22} /><p className="mt-2 text-sm font-black">Profile picture</p><p className="mt-1 text-xs text-slate-500">Square JPG, PNG, or WebP</p><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && uploadMedia("avatar", event.target.files[0])} /></label>
            <label className="group cursor-pointer rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><Upload className="mx-auto text-[#721100]" size={22} /><p className="mt-2 text-sm font-black">Banner image</p><p className="mt-1 text-xs text-slate-500">Wide image, up to 8 MB</p><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && uploadMedia("banner", event.target.files[0])} /></label>
          </div>
          {(customization?.avatar_path || customization?.banner_path) && <div className="flex flex-wrap gap-2">{customization?.avatar_path && <button type="button" onClick={() => removeMedia("avatar")} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700">Remove picture</button>}{customization?.banner_path && <button type="button" onClick={() => removeMedia("banner")} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-black text-rose-700">Remove banner</button>}</div>}

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3"><GripVertical size={18} className="text-[#721100]" /><div><p className="font-black text-slate-950">Arrange profile sections</p><p className="text-xs text-slate-500">Drag, move, or hide sections.</p></div></div>
            <div className="mt-4 space-y-2">{sections.map((section, index) => { const visible = draft.section_visibility?.[section.key] !== false; return <div key={section.key} draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); move(Number(event.dataTransfer.getData("text/plain")), index); }} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"><GripVertical size={16} className="cursor-grab text-slate-300" /><span className="min-w-0 flex-1 text-sm font-black text-slate-800">{section.label}</span><button type="button" onClick={() => toggle(section.key)} className="text-slate-500" aria-label={visible ? `Hide ${section.label}` : `Show ${section.label}`}>{visible ? <Eye size={16} /> : <EyeOff size={16} />}</button><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} className="text-slate-500 disabled:opacity-25"><ChevronUp size={16} /></button><button type="button" disabled={index === sections.length - 1} onClick={() => move(index, index + 1)} className="text-slate-500 disabled:opacity-25"><ChevronDown size={16} /></button></div>; })}</div>
          </div>

          <div className="sticky bottom-4 flex gap-3 rounded-[1.5rem] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur"><button type="button" onClick={cancel} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700">Cancel</button><button type="button" onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white disabled:opacity-50"><Save size={16} /> Save design</button></div>
        </div>
      </div>
    </Card>
  );
}

export default function ProfileStudio({ profileType, profile = {}, customization, actions, editable = true, ownerId, adminPersonal = false }) {
  const baseSections = useMemo(() => sectionsFor(profileType, profile), [profileType, profile]);
  const defaultOrder = baseSections.map((section) => section.key);
  const merged = useMemo(() => ({
    ...DEFAULTS,
    display_name: nameFor(profileType, profile, customization),
    headline: customization?.headline || fallbackHeadline(profileType, profile),
    location_label: customization?.location_label || fallbackLocation(profile),
    ...customization,
    section_layout: customization?.section_layout?.length ? customization.section_layout : defaultOrder,
    section_visibility: customization?.section_visibility || {},
    social_links: customization?.social_links || [],
  }), [customization, defaultOrder.join("|"), profile, profileType]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(merged);

  useEffect(() => setDraft(merged), [merged]);

  const orderedSections = useMemo(() => {
    const map = new Map(baseSections.map((section) => [section.key, section]));
    const ordered = (draft.section_layout || defaultOrder).map((key) => map.get(key)).filter(Boolean);
    baseSections.forEach((section) => { if (!ordered.some((item) => item.key === section.key)) ordered.push(section); });
    return ordered;
  }, [baseSections, defaultOrder.join("|"), draft.section_layout]);

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
  const uploadMedia = (mediaType, file) => actions.uploadProfileMedia({ profileType, ownerId: ownerId || profile.id || null, mediaType, file });
  const removeMedia = (mediaType) => actions.removeProfileMedia({ profileType, ownerId: ownerId || profile.id || null, mediaType });

  const background = draft.background_style === "gradient"
    ? `linear-gradient(145deg, ${draft.theme_primary}16, ${draft.theme_accent}22 45%, #ffffff 100%)`
    : draft.background_style === "dark" ? draft.theme_secondary : draft.background_style === "clean" ? "#ffffff" : "#f7f3ef";
  const dark = draft.background_style === "dark";
  const cardStyle = draft.card_style === "flat" ? "rounded-xl shadow-none" : draft.card_style === "glass" ? "rounded-[1.75rem] bg-white/65" : "rounded-[1.75rem]";
  const shownSections = orderedSections.filter((section) => draft.section_visibility?.[section.key] !== false);
  const initials = nameFor(profileType, profile, draft).split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-black/5 shadow-xl" style={{ background }}>
        <div className="relative h-44 sm:h-56" style={{ background: customization?.banner_url ? undefined : `linear-gradient(120deg, ${draft.theme_secondary}, ${draft.theme_primary} 55%, ${draft.theme_accent})` }}>
          {customization?.banner_url && <img src={customization.banner_url} alt="Profile banner" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
          {editable && <button type="button" onClick={() => setEditing((value) => !value)} className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-4 py-2.5 text-xs font-black text-slate-900 shadow-lg backdrop-blur"><Palette size={15} /> Customize profile</button>}
        </div>
        <div className="relative px-5 pb-6 sm:px-7">
          <div className="-mt-16 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border-[6px] border-white bg-white text-3xl font-black shadow-xl" style={{ color: draft.theme_primary }}>
                {customization?.avatar_url ? <img src={customization.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : <span style={{ backgroundColor: `${draft.theme_primary}14` }} className="flex h-full w-full items-center justify-center">{initials}</span>}
              </div>
              <div className="pb-1"><p className="text-[10px] font-black uppercase tracking-[.14em]" style={{ color: draft.theme_accent }}>{adminPersonal ? "Admin interpreter profile" : profileType === "client" ? "Client profile" : "Interpreter profile"}</p><h1 className={cx("mt-1 text-3xl font-black", dark ? "text-white" : "text-slate-950")}>{nameFor(profileType, profile, draft)}</h1><p className={cx("mt-2 text-sm font-semibold", dark ? "text-white/70" : "text-slate-600")}>{draft.headline || fallbackHeadline(profileType, profile)}</p></div>
            </div>
            {editable && <button type="button" onClick={actions.openProfile} className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white shadow-lg" style={{ backgroundColor: draft.theme_primary }}><Pencil size={16} /> Edit account details</button>}
          </div>
          <div className={cx("mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold", dark ? "text-white/70" : "text-slate-600")}>
            {draft.location_label && <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{draft.location_label}</span>}
            {draft.website_url && <a href={draft.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Globe2 size={15} />Website</a>}
            {(draft.social_links || []).map((link) => <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Link2 size={15} />{link.label}</a>)}
          </div>
          {draft.bio && <p className={cx("mt-5 max-w-4xl whitespace-pre-wrap text-sm leading-7", dark ? "text-white/80" : "text-slate-700")}>{draft.bio}</p>}
          <div className="mt-5 flex flex-wrap gap-2"><Badge value={profileType === "client" ? profile.account_status || "active" : profile.roster_status || "pending_profile"} />{profileType === "interpreter" && profile.credentials && <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: `${draft.theme_accent}22`, color: draft.theme_primary }}>{profile.credentials}</span>}</div>
        </div>
      </div>

      {editing && <ProfileEditor draft={draft} setDraft={setDraft} sections={orderedSections} move={move} toggle={toggle} save={save} cancel={() => { setDraft(merged); setEditing(false); }} saving={false} uploadMedia={uploadMedia} removeMedia={removeMedia} customization={customization} />}

      <div className="grid gap-5 xl:grid-cols-2">{shownSections.map((section) => <SectionCard key={section.key} section={section} style={cardStyle} accent={draft.theme_primary} />)}</div>

      {!shownSections.length && <Card><div className="py-8 text-center"><Settings2 className="mx-auto text-slate-300" /><p className="mt-3 font-black text-slate-800">All profile sections are hidden.</p><p className="mt-1 text-sm text-slate-500">Open Customize profile to show or rearrange sections.</p></div></Card>}
    </div>
  );
}
