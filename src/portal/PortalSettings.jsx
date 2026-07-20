import { useState } from "react";
import {
  Bell,
  Building2,
  FileSignature,
  Landmark,
  LayoutPanelTop,
  MapPinned,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import GmailIntegrationCard from "./GmailIntegrationCard";
import LayoutCustomizer from "./LayoutCustomizer";
import PushNotificationButton from "./PushNotificationButton";
import TimeZoneSelect from "./TimeZoneSelect";
import { Badge, Card, Hero, InstallAppButton, SectionHeader } from "./ui";
import { getPortalTimeZone } from "./timezones";

function SettingsButton({ children, onClick }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#721100] px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">{children}</button>;
}

function SettingsCard({ icon: Icon, title, children }) {
  return <Card><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={21} /></span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><div className="mt-4">{children}</div></Card>;
}

export default function PortalSettings({ role, layout, saveLayout, timeZone, onTimeZoneChange, savingTimeZone = false, v2, onNavigate }) {
  const [customizing, setCustomizing] = useState(false);
  const integrations = new Map((v2?.integrations || []).map((item) => [item.integration_key, item]));
  const adminConnections = [
    ["found", Landmark, "Found Business Banking", "active"],
    ["boldsign", FileSignature, "BoldSign", "active"],
    ["google_drive", ShieldCheck, "Google Drive archive", integrations.get("google_drive")?.is_enabled ? "active" : "planned"],
  ];

  return <div className="space-y-6">
    <Hero title="Settings" />
    <div className="grid gap-5 xl:grid-cols-2">
      <SettingsCard icon={LayoutPanelTop} title="Customization">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-600">Home sections, widgets, navigation, and card layout.</p>
          <SettingsButton onClick={() => setCustomizing(true)}>Customize portal</SettingsButton>
        </div>
      </SettingsCard>

      <SettingsCard icon={MapPinned} title="Time & location">
        <label className="block text-sm font-black text-slate-700">
          Schedule time zone
          <TimeZoneSelect value={timeZone || getPortalTimeZone()} onChange={onTimeZoneChange} disabled={savingTimeZone} className="mt-2 w-full" />
        </label>
      </SettingsCard>

      <SettingsCard icon={Bell} title="Notifications & app">
        <div className="space-y-3">
          <PushNotificationButton variant="light" />
          <InstallAppButton variant="light" />
        </div>
      </SettingsCard>

      <SettingsCard icon={role === "client" ? Building2 : UserRound} title="Profile">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slate-600">Account details, contact information, and profile appearance.</p>
          <SettingsButton onClick={() => onNavigate?.("profile")}>Open profile</SettingsButton>
        </div>
      </SettingsCard>
    </div>

    {role === "admin" && <>
      <SectionHeader title="Agency connections" />
      <div className="grid gap-5 xl:grid-cols-2">
        <GmailIntegrationCard />
        {adminConnections.map(([key, Icon, name, status]) => <Card key={key}><div className="flex items-start justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={21} /></span><Badge value={status} /></div><h2 className="mt-5 text-xl font-black text-slate-950">{name}</h2></Card>)}
      </div>
    </>}

    <Card>
      <SectionHeader title="Privacy & security" />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {["Secure Clerk sign-in", "Role-based portal access", "Protected MLS records"].map((item) => <div key={item} className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">✓ {item}</div>)}
      </div>
    </Card>

    <LayoutCustomizer open={customizing} close={() => setCustomizing(false)} role={role} layout={layout} save={saveLayout} />
  </div>;
}
