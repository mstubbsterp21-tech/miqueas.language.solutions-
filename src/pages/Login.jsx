import { SignedIn, SignedOut, SignIn, SignInButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isClerkConfigured } from "../lib/env";

export default function Login({ palette }) {
  if (!isClerkConfigured) {
    return <PortalSetupNotice palette={palette} />;
  }

  return (
    <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 12% 18%, rgba(114,17,0,0.14), transparent 30%), radial-gradient(circle at 88% 12%, rgba(221,125,0,0.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)" }} />
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter portal</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
            Interpreter Login
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#555]">
            Sign in to update your MLS profile, upload onboarding documents, review your admin-managed rates, and keep your assignment-matching details current.
          </p>
          <div className="mt-7 rounded-[1.5rem] border bg-white/80 p-5 text-sm leading-7 shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: palette.charcoal }}>
            <strong>Access note:</strong> Portal accounts are for approved MLS interpreters only. New interpreters should apply through Join Our Team first.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/join-our-team" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>
              Apply to Join MLS
            </Link>
            <Link to="/contact" className="rounded-full border px-5 py-3 text-sm font-bold shadow-sm" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}>
              Need Help?
            </Link>
          </div>
        </div>

        <div className="w-full rounded-[2rem] border bg-white p-4 shadow-lg md:p-6" style={{ borderColor: palette.border }}>
          <SignedOut>
            <div className="mb-4 rounded-2xl bg-[#721100]/5 p-4 text-sm leading-6" style={{ color: palette.charcoal }}>
              <strong>Having trouble?</strong> Use the secure login button below if the embedded form does not load.
            </div>
            <div className="mb-5">
              <SignInButton mode="redirect" fallbackRedirectUrl="/portal" signUpFallbackRedirectUrl="/portal">
                <button type="button" className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>
                  Open Secure Login
                </button>
              </SignInButton>
            </div>
            <div className="flex min-h-[420px] w-full justify-center overflow-visible">
              <SignIn
                routing="path"
                path="/login"
                fallbackRedirectUrl="/portal"
                signUpFallbackRedirectUrl="/portal"
                appearance={{
                  variables: {
                    colorPrimary: palette.burgundy,
                    colorText: palette.charcoal,
                    borderRadius: "1rem",
                  },
                  elements: {
                    rootBox: "w-full",
                    cardBox: "w-full",
                  },
                }}
              />
            </div>
          </SignedOut>

          <SignedIn>
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-black" style={{ color: palette.charcoal }}>You are signed in.</h2>
              <p className="mt-3 text-sm leading-6 text-[#666]">Go to your interpreter portal to manage your MLS profile and documents.</p>
              <Link to="/portal" className="mt-6 rounded-full px-6 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>
                Open Portal
              </Link>
            </div>
          </SignedIn>
        </div>
      </div>
    </section>
  );
}
