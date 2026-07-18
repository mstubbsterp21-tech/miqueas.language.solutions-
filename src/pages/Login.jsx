import { ClerkLoaded, ClerkLoading, SignIn, SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link, Navigate } from "react-router-dom";
import { Building2, LoaderCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import PortalSetupNotice from "../components/PortalSetupNotice";
import { isClerkConfigured } from "../lib/env";

export default function Login({ palette }) {
  if (!isClerkConfigured) return <PortalSetupNotice palette={palette} />;

  const isDarkMode = palette.white !== "#ffffff";
  const pageBackground = isDarkMode
    ? "radial-gradient(circle at 12% 18%, rgba(221,125,0,0.16), transparent 30%), radial-gradient(circle at 88% 12%, rgba(114,17,0,0.24), transparent 28%), linear-gradient(180deg, #15100e 0%, #211714 100%)"
    : "radial-gradient(circle at 12% 18%, rgba(114,17,0,0.14), transparent 30%), radial-gradient(circle at 88% 12%, rgba(221,125,0,0.17), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f7f3ef 100%)";
  const bodyTextColor = isDarkMode ? "#d8c8bc" : "#555";
  const panel = isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.82)";
  const loginCardBackground = isDarkMode ? "#1b1411" : "#ffffff";
  const clerkTextColor = isDarkMode ? "#e6d8cd" : "#464747";
  const clerkSecondaryTextColor = isDarkMode ? "#bfaea2" : "#666666";
  const clerkInputBackground = isDarkMode ? "#251a16" : "#ffffff";
  const clerkBorderColor = isDarkMode ? "rgba(221,125,0,0.24)" : "#d1c6bc";

  const portalTypes = [
    { icon: Building2, title: "Client workspace", text: "Request interpreters, upload documents, and track confirmation and payment status." },
    { icon: Users, title: "Interpreter workspace", text: "Complete onboarding, manage credentials, and respond to MLS document requests." },
    { icon: ShieldCheck, title: "Admin workspace", text: "Manage clients, interpreters, assignments, documents, and operational status." },
  ];

  return (
    <>
      <ClerkLoaded>
        <SignedIn><Navigate to="/portal" replace /></SignedIn>
      </ClerkLoaded>

      <section className="relative w-full max-w-full overflow-hidden px-4 py-10 sm:px-5 sm:py-14 md:px-8 md:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: pageBackground }} />
        <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(390px,450px)] lg:items-center">
          <div className="min-w-0 max-w-full">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] sm:px-4 sm:text-xs sm:tracking-[0.16em]" style={{ borderColor: palette.border, color: palette.gold, backgroundColor: panel }}>
              <Sparkles size={15} /> MLS secure portal
            </div>
            <h1 className="mt-5 max-w-3xl break-words text-[clamp(2.25rem,11vw,3.75rem)] font-black leading-[1.02] tracking-[-0.045em]" style={{ color: palette.charcoal }}>
              One login. Every MLS workspace.
            </h1>
            <p className="mt-5 max-w-2xl break-words text-base leading-7 sm:mt-6 sm:text-lg sm:leading-8" style={{ color: bodyTextColor }}>
              Sign in through your secure MLS invitation to access the workspace connected to your account.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {portalTypes.map(({ icon: Icon, title, text }) => (
                <div key={title} className="min-w-0 max-w-full rounded-3xl border p-4 shadow-sm backdrop-blur sm:p-5" style={{ borderColor: palette.border, backgroundColor: panel }}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: palette.burgundy }}><Icon size={18} /></span>
                  <h2 className="mt-4 break-words text-sm font-black" style={{ color: palette.charcoal }}>{title}</h2>
                  <p className="mt-2 break-words text-xs leading-5" style={{ color: bodyTextColor }}>{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contact" className="rounded-full border px-5 py-3 text-sm font-bold shadow-sm" style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white }}>Need access help?</Link>
              <Link to="/join-our-team" className="rounded-full px-5 py-3 text-sm font-bold text-white shadow-sm" style={{ backgroundColor: palette.burgundy }}>Apply as an interpreter</Link>
            </div>
          </div>

          <div className="min-w-0 w-full max-w-full overflow-hidden rounded-[1.5rem] border p-3 shadow-2xl sm:rounded-[2rem] sm:p-4 md:p-6" style={{ borderColor: palette.border, backgroundColor: loginCardBackground }}>
            <ClerkLoading>
              <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[1.5rem] border px-6 text-center" style={{ borderColor: clerkBorderColor, backgroundColor: panel }}>
                <LoaderCircle className="animate-spin" size={34} style={{ color: palette.gold }} />
                <p className="mt-5 text-lg font-black" style={{ color: palette.charcoal }}>Loading secure login</p>
                <p className="mt-2 max-w-sm text-sm leading-6" style={{ color: bodyTextColor }}>
                  This usually takes only a few seconds. If it does not load, refresh the page or disable strict tracking protection for this preview.
                </p>
              </div>
            </ClerkLoading>

            <ClerkLoaded>
              <SignedOut>
                <div className="min-w-0 max-w-full rounded-[1.25rem] border p-3 text-center sm:rounded-[1.5rem] sm:p-4" style={{ borderColor: clerkBorderColor, backgroundColor: panel }}>
                  <p className="break-words text-sm font-bold" style={{ color: palette.charcoal }}>Best option for Safari and Apple devices</p>
                  <p className="mt-2 text-xs leading-5" style={{ color: bodyTextColor }}>Use the secure redirect login if the embedded form is blocked by browser privacy settings.</p>
                  <SignInButton mode="redirect" forceRedirectUrl="/portal" fallbackRedirectUrl="/portal">
                    <button type="button" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-black leading-5 text-white shadow-sm transition hover:-translate-y-0.5" style={{ backgroundColor: palette.burgundy }}>Continue to secure login</button>
                  </SignInButton>
                </div>
                <div className="my-5 flex min-w-0 items-center gap-2 text-center text-[10px] font-bold uppercase tracking-[0.09em] sm:gap-3 sm:text-xs sm:tracking-[0.12em]" style={{ color: clerkSecondaryTextColor }}><span className="h-px min-w-3 flex-1" style={{ backgroundColor: clerkBorderColor }} /><span className="shrink-0">Or sign in below</span><span className="h-px min-w-3 flex-1" style={{ backgroundColor: clerkBorderColor }} /></div>
                <div className="mls-login-clerk flex min-h-[420px] min-w-0 w-full max-w-full justify-center overflow-hidden">
                  <SignIn
                    routing="hash"
                    signUpUrl="/login"
                    fallbackRedirectUrl="/portal"
                    forceRedirectUrl="/portal"
                    signUpFallbackRedirectUrl="/portal"
                    signUpForceRedirectUrl="/portal"
                    appearance={{
                      variables: { colorPrimary: palette.burgundy, colorBackground: loginCardBackground, colorInputBackground: clerkInputBackground, colorInputText: clerkTextColor, colorText: clerkTextColor, colorTextSecondary: clerkSecondaryTextColor, borderRadius: "1rem" },
                      elements: {
                        rootBox: "w-full min-w-0 max-w-full",
                        cardBox: "w-full min-w-0 max-w-full shadow-none",
                        card: "w-full min-w-0 max-w-full px-3 py-5 shadow-none sm:px-6",
                        headerTitle: "break-words text-xl leading-tight sm:text-2xl",
                        headerSubtitle: "break-words text-sm leading-6",
                        formFieldLabel: "break-words text-sm",
                        formFieldInput: "w-full min-w-0 border text-base",
                        formButtonPrimary: "min-h-12 w-full whitespace-normal px-4 text-sm leading-5",
                        footerAction: "flex-wrap justify-center gap-x-1 text-center",
                        footerActionText: "break-words",
                        footerActionLink: "break-words",
                      },
                      layout: { logoPlacement: "none" },
                    }}
                  />
                </div>
              </SignedOut>
            </ClerkLoaded>
          </div>
        </div>
      </section>
    </>
  );
}
