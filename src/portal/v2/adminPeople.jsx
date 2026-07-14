import { Building2, Users } from "lucide-react";
import { Badge, Card, EmptyState, Hero, SectionHeader } from "../ui";
import { ActionButton } from "./shared";

function PersonCard({ icon: Icon, title, subtitle, status, lines, onClick }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#dd7d00]/40 hover:shadow-xl">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#721100]/10 text-[#721100]"><Icon size={18} /></span>
        <span className="min-w-0 flex-1"><span className="block truncate font-black text-slate-950">{title}</span><span className="mt-1 block truncate text-xs text-slate-500">{subtitle}</span></span>
        <Badge value={status || "active"} />
      </div>
      <div className="mt-4 space-y-1 text-xs leading-5 text-slate-600">{lines.filter(Boolean).map((line) => <p key={line}>{line}</p>)}</div>
    </button>
  );
}

export default function AdminPeopleV2({ workspace, v2, actions }) {
  const clients = workspace.admin?.clients || [];
  const interpreters = (workspace.admin?.interpreters || []).filter((item) => item.roster_status !== "removed");
  const onboarding = new Map((v2?.onboarding || []).map((item) => [item.interpreter_id, item]));

  return (
    <div className="space-y-6">
      <Hero eyebrow="People" title="Clients, interpreters, and applicants in one directory." text="Open a person once to review their profile, documents, work history, onboarding, compliance, and communication record." actions={<ActionButton tone="gold" onClick={actions.openInvite}>Invite user</ActionButton>} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeader eyebrow="Accounts" title="Clients" text={`${clients.length} client profiles`} />
          <div className="mt-5 grid gap-3">
            {clients.map((client) => <PersonCard key={client.id} icon={Building2} title={client.organization_name || client.email} subtitle={client.primary_contact_name || client.email} status={client.account_status} lines={[[client.city, client.state].filter(Boolean).join(", "), client.industry, client.billing_email && `Billing: ${client.billing_email}`]} onClick={() => actions.openClient(client)} />)}
            {!clients.length && <EmptyState icon={Building2} title="No clients" text="Invite the first client to begin." />}
          </div>
        </Card>
        <Card>
          <SectionHeader eyebrow="Roster" title="Interpreters" text={`${interpreters.length} profiles`} />
          <div className="mt-5 grid gap-3">
            {interpreters.map((interpreter) => {
              const pipeline = onboarding.get(interpreter.id);
              return <PersonCard key={interpreter.id} icon={Users} title={`${interpreter.first_name || ""} ${interpreter.last_name || ""}`.trim() || interpreter.email} subtitle={interpreter.current_location || [interpreter.city, interpreter.state].filter(Boolean).join(", ") || interpreter.email} status={interpreter.roster_status} lines={[interpreter.credentials && `Credentials: ${interpreter.credentials}`, interpreter.modalities && `Modalities: ${interpreter.modalities}`, pipeline && `Onboarding: ${pipeline.stage.replaceAll("_", " ")}`]} onClick={() => actions.openInterpreter(interpreter)} />;
            })}
            {!interpreters.length && <EmptyState icon={Users} title="No interpreters" text="Invite the first interpreter to begin." />}
          </div>
        </Card>
      </div>
    </div>
  );
}
