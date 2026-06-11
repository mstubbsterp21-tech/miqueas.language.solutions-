import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function RequirePortalAuth({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <section className="px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-[#d1c6bc] bg-white p-8 text-center shadow-lg">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dd7d00]">Interpreter portal</p>
            <h1 className="mt-3 text-3xl font-black text-[#464747]">Sign in required</h1>
            <p className="mt-4 text-sm leading-7 text-[#666]">
              Use your approved MLS interpreter account to access the portal.
            </p>
            <Link to="/login" className="mt-7 inline-flex rounded-full bg-[#721100] px-6 py-3 text-sm font-bold text-white shadow-sm">
              Go to Login
            </Link>
          </div>
        </section>
      </SignedOut>
    </>
  );
}
