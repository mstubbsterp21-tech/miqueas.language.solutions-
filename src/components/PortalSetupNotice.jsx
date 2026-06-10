import { Link } from "react-router-dom";

export default function PortalSetupNotice({ palette }) {
  return (
    <section className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-3xl rounded-[2rem] border bg-white p-7 text-center shadow-lg md:p-10" style={{ borderColor: palette.border }}>
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Portal setup needed</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
          Interpreter login is wired, but auth keys are not configured yet.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#5f6368]">
          Add the Clerk and Supabase environment variables in Vercel to activate real sign-in, profile lookup, and private document uploads.
        </p>
        <div className="mt-7 rounded-2xl bg-[#202020] p-5 text-left text-sm leading-7 text-white/80">
          <code>VITE_CLERK_PUBLISHABLE_KEY</code><br />
          <code>VITE_SUPABASE_URL</code><br />
          <code>VITE_SUPABASE_ANON_KEY</code><br />
          <code>VITE_ADMIN_EMAILS</code>
        </div>
        <Link to="/interpreters" className="mt-7 inline-flex rounded-full px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: palette.gold }}>
          Back to Interpreter Information
        </Link>
      </div>
    </section>
  );
}
