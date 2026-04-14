import ResourcesClients from "./ResourcesClients";
import ResourcesInterpreters from "./ResourcesInterpreters";
import { useState } from "react";

export default function Resources({ palette }) {
  const [activeTab, setActiveTab] = useState("clients");

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <div
        className="overflow-hidden rounded-[2rem] border shadow-sm"
        style={{
          borderColor: palette.border,
          background: `linear-gradient(180deg, ${palette.softGray} 0%, ${palette.white} 100%)`,
        }}
      >
        <div className="border-b px-6 py-10 md:px-10 md:py-12" style={{ borderColor: palette.border }}>
          <div
            className="mb-4 inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              backgroundColor: `${palette.gold}14`,
              color: palette.gold,
            }}
          >
            Resources & Guidance
          </div>

          <h1
            className="max-w-3xl text-3xl font-bold tracking-tight md:text-5xl"
            style={{ color: palette.charcoal }}
          >
            Practical guidance for clearer, more effective communication
          </h1>

          <p
            className="mt-4 max-w-2xl text-base leading-7 md:text-lg"
            style={{ color: palette.body }}
          >
            Whether you are booking services or providing them, understanding language access
            helps create smoother, more effective interactions for everyone involved.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border p-1.5 shadow-sm" style={{ borderColor: palette.border, backgroundColor: palette.white }}>
            <button
              type="button"
              onClick={() => setActiveTab("clients")}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
              style={{
                backgroundColor: activeTab === "clients" ? palette.burgundy : "transparent",
                color: activeTab === "clients" ? palette.white : palette.charcoal,
              }}
            >
              Clients
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("interpreters")}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold transition"
              style={{
                backgroundColor: activeTab === "interpreters" ? palette.burgundy : "transparent",
                color: activeTab === "interpreters" ? palette.white : palette.charcoal,
              }}
            >
              Interpreters
            </button>
          </div>
        </div>

        <div className="px-6 py-8 md:px-10 md:py-10">
          {activeTab === "clients" ? (
            <ResourcesClients palette={palette} />
          ) : (
            <ResourcesInterpreters palette={palette} />
          )}
        </div>
      </div>
    </div>
  );
}