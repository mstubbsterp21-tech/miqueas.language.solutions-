import { useState } from "react";
import { Building2, CheckCircle2, HandHeart, Loader2, UserRound } from "lucide-react";

const choices = [
  {
    role: "client",
    label: "I’m a client",
    eyebrow: "Request interpreting services",
    description: "Set up your organization, billing contact, service preferences, and secure request workspace.",
    Icon: Building2,
  },
  {
    role: "interpreter",
    label: "I’m an interpreter",
    eyebrow: "Work with MLS",
    description: "Build your interpreter profile, credentials, assignment preferences, availability, and compliance record.",
    Icon: UserRound,
  },
];

export default function PortalRoleSelection({ user, saving, error, onSelect }) {
  const [selected, setSelected] = useState("");

  async function continueSetup() {
    if (!selected || saving) return;
    await onSelect(selected);
  }

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,rgba(221,125,0,.18),transparent_34%),linear-gradient(145deg,#f7f3ef_0%,#fff_48%,#f5ece7_100%)] px-5 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-[2.25rem] border border-white/70 bg-white/88 p-6 shadow-[0_28px_80px_rgba(36,19,14,.16)] backdrop-blur-xl sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#721100] text-white shadow-lg">
              <HandHeart size={23} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[#dd7d00]">MLS Portal</p>
              <p className="text-sm font-bold text-slate-500">Secure account setup</p>
            </div>
          </div>

          <div className="mt-9 max-w-3xl">
            <p className="text-sm font-bold text-slate-500">Welcome{user?.firstName ? `, ${user.firstName}` : ""}.</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">How will you use MLS Portal?</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Choose your account type once. MLS will open the correct profile wizard and workspace for you.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {choices.map(({ role, label, eyebrow, description, Icon }) => {
              const active = selected === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelected(role)}
                  aria-pressed={active}
                  className={`relative overflow-hidden rounded-[1.75rem] border p-6 text-left transition ${
                    active
                      ? "border-[#721100] bg-[#fff8f2] shadow-[0_18px_44px_rgba(114,17,0,.15)]"
                      : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#dd7d00]/50 hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-[#721100] text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Icon size={22} />
                    </span>
                    {active && <CheckCircle2 className="text-[#721100]" size={22} />}
                  </div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[.12em] text-[#dd7d00]">{eyebrow}</p>
                  <h2 className="mt-2 text-2xl font-black">{label}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
            <p className="max-w-xl text-xs leading-5 text-slate-500">
              Account types are protected server-side. Contact MLS Portal Support if your role ever needs to change.
            </p>
            <button
              type="button"
              disabled={!selected || saving}
              onClick={continueSetup}
              className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : null}
              Continue to profile setup
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
