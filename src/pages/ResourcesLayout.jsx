import { NavLink, Outlet } from "react-router-dom";

export default function ResourcesLayout({ palette }) {
  const tabBase = "rounded-2xl px-5 py-3 text-sm font-semibold transition";

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold tracking-tight md:text-4xl"
          style={{ color: palette.charcoal }}
        >
          Resources & Guidance
        </h1>
        <p
          className="mt-3 max-w-3xl text-base leading-7 md:text-lg"
          style={{ color: palette.body }}
        >
          Whether you are booking services or providing them, clear communication
          starts with understanding what language access really looks like.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <NavLink
          to="/resources/clients"
          className={({ isActive }) =>
            `${tabBase} ${isActive ? "" : "border hover:bg-black/5"}`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? palette.burgundy : palette.white,
            color: isActive ? palette.white : palette.charcoal,
            borderColor: palette.border,
          })}
        >
          Clients
        </NavLink>

        <NavLink
          to="/resources/interpreters"
          className={({ isActive }) =>
            `${tabBase} ${isActive ? "" : "border hover:bg-black/5"}`
          }
          style={({ isActive }) => ({
            backgroundColor: isActive ? palette.burgundy : palette.white,
            color: isActive ? palette.white : palette.charcoal,
            borderColor: palette.border,
          })}
        >
          Interpreters
        </NavLink>
      </div>

      <div className="section-shell p-6 md:p-8">
        <Outlet />
      </div>
    </div>
  );
}