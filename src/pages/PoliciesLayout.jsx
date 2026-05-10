import { NavLink, Outlet } from "react-router-dom";

const policyTabs = [
  {
    to: "/policies/clients",
    label: "Clients",
    description: "Booking, billing, cancellations, VRI, preparation, and assignment expectations.",
  },
  {
    to: "/policies/consumers",
    label: "Consumers",
    description: "Access preferences, feedback options, interpreter requests, and immediate concerns.",
  },
  {
    to: "/policies/interpreters",
    label: "Interpreters",
    description: "Roster expectations, screening, credentials, confidentiality, and assignment conduct.",
  },
];

export default function PoliciesLayout({ palette }) {
  const tabBase =
    "group rounded-[1.35rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <section className="brand-band overflow-hidden rounded-[2.25rem] px-6 py-10 text-white shadow-sm md:px-10 md:py-14">
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/85">
            MLS Policies
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Clear standards for better access.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/82 md:text-lg">
            These public-facing policy guides explain how Miqueas Language Solutions handles service requests,
            communication access, interpreter standards, confidentiality, feedback, and professional expectations.
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {policyTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `${tabBase} ${isActive ? "" : "hover:bg-black/[0.02]"}`}
            style={({ isActive }) => ({
              borderColor: isActive ? palette.burgundy : palette.border,
              backgroundColor: isActive ? palette.burgundy : palette.white,
              color: isActive ? palette.white : palette.charcoal,
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  className="mb-3 h-1.5 w-14 rounded-full transition"
                  style={{ backgroundColor: isActive ? palette.gold : palette.gold }}
                />
                <div className="text-lg font-bold">{tab.label}</div>
                <p className={isActive ? "mt-2 text-sm leading-6 text-white/75" : "mt-2 text-sm leading-6"} style={isActive ? {} : { color: palette.body }}>
                  {tab.description}
                </p>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="mt-8 section-shell p-5 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}
