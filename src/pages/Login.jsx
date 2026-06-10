import { SignIn } from "@clerk/clerk-react";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isClerkConfigured } from "../lib/env";

export default function Login({ palette }) {
  if (!isClerkConfigured) {
    return <PortalSetupNotice palette={palette} />;
  }

  return (
    <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 18%, rgba(114,17,0,0.14), transparent 30%), radial-gradient(circle at 88% 12%, rgba(221,125,0,0.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter portal</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
            Returning Interpreter?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555]">
            Sign in to update your MLS profile, upload onboarding documents, and keep your availability, rates, credentials, and service preferences current.
          </p>
          <div className="mt-7 rounded-[1.5rem] border bg-white/80 p-5 text-sm leading-7 shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.charcoal }}>
            <strong>Access note:</strong> Portal accounts are intended for invited or returning interpreters only. New interpreters should apply through Join Our Team first.
          </div>
        </div>
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/login"
            fallbackRedirectUrl="/portal"
            signUpFallbackRedirectUrl="/portal"
          />
        </div>
      </div>
    </section>
  );
}
