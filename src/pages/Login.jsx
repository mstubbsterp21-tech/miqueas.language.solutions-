import { SignIn, SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link, Navigate } from "react-router-dom";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isClerkConfigured } from "../lib/env";

export default function Login({ palette }) {
  if (!isClerkConfigured) {
    return <PortalSetupNotice palette={palette} />;
  }

  const isDarkMode = palette.white !== "#ffffff";
  const pageBackground = isDarkMode
    ? "radial-gradient(circle at 12% 18%, rgba(221,125,0,0.16), transparent 30%), radial-gradient(circle at 88% 12%, rgba(114,17,0,0.24), transparent 28%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 12% 18%, rgba(114,17,0,0.14), transparent 30%), radial-gradient(circle at 88% 12%, rgba(221,125,0,0.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";
  const bodyTextColor = isDarkMode ? "#d8c8bc" : "#555";
  const noteBackground = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)";
  const loginCardBackground = isDarkMode ? "#1b1411" : "#ffffff";
  const clerkTextColor = isDarkMode ? "#e6d8cd" : "#464747";
  const clerkSecondaryTextColor = isDarkMode ? "#bfaea2" : "#666666";
  const clerkInputBackground = isDarkMode ? "#251a16" : "#ffffff";
  const clerkBorderColor = isDarkMode ? "rgba(221,125,0,0.24)" : "#d1c6bc";

  return (
    <>
      <SignedIn>
        <Navigate to="/portal" replace />
      </SignedIn>
      <SignedOut>
        <section className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
          <div className="absolute inset-0 -z-10" style={{ background: pageBackground }} />
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.gold }}>Interpreter portal</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.03] tracking-tight md:text-6xl" style={{ color: palette.charcoal }}>
                Interpreter Login
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: bodyTextColor }}>
                Sign in to update your MLS profile, upload onboarding documents, review your admin-managed rates, and keep your assignment-matching details current.
              </p>
              <div className="mt-7 rounded-[1.5rem] border p-5 text-sm leading-7 shadow-sm backdrop-blur" style={{ borderColor: palette.border, color: bodyTextColor, backgroundColor: noteBackground }}>
                <strong style={{ color: palette.charcoal }}>Access note:</strong> Portal accounts are for approved MLS interpreters only. New interpreters should apply through Join Our Team first.
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

            <div className="w-full rounded-[2rem] border p-4 shadow-lg md:p-6" style={{ borderColor: palette.border, backgroundColor: loginCardBackground }}>
              <div className="rounded-[1.5rem] border p-4 text-center" style={{ borderColor: clerkBorderColor, backgroundColor: noteBackground }}>
                <p className="text-sm font-bold" style={{ color: palette.charcoal }}>Having trouble on Safari, iPhone, iPad, or Mac?</p>
                <p className="mt-2 text-xs leading-5" style={{ color: bodyTextColor }}>
                  Use the secure redirect login. It works better with Apple browser privacy settings.
                </p>
                <SignInButton mode="redirect" forceRedirectUrl="/portal" fallbackRedirectUrl="/portal">
                  <button type="button" className="mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5" style={{ backgroundColor: palette.burgundy }}>
                    Continue to Secure Login
                  </button>
                </SignInButton>
              </div>

              <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: clerkSecondaryTextColor }}>
                <span className="h-px flex-1" style={{ backgroundColor: clerkBorderColor }} />
                Or sign in below
                <span className="h-px flex-1" style={{ backgroundColor: clerkBorderColor }} />
              </div>

              <div className="flex min-h-[420px] w-full justify-center overflow-visible">
                <SignIn
                  routing="hash"
                  signUpUrl="/login"
                  fallbackRedirectUrl="/portal"
                  forceRedirectUrl="/portal"
                  signUpFallbackRedirectUrl="/portal"
                  signUpForceRedirectUrl="/portal"
                  appearance={{
                    variables: {
                      colorPrimary: palette.burgundy,
                      colorBackground: loginCardBackground,
                      colorInputBackground: clerkInputBackground,
                      colorInputText: clerkTextColor,
                      colorText: clerkTextColor,
                      colorTextSecondary: clerkSecondaryTextColor,
                      borderRadius: "1rem",
                    },
                    elements: {
                      rootBox: "w-full",
                      cardBox: "w-full shadow-none",
                      card: "shadow-none",
                      formFieldInput: "border",
                    },
                    layout: {
                      logoPlacement: "none",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </SignedOut>
    </>
  );
}
