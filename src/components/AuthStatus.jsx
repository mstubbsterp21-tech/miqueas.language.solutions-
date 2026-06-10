import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function AuthStatus({ palette }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SignedOut>
        <SignInButton mode="modal" fallbackRedirectUrl="/portal" signUpFallbackRedirectUrl="/portal">
          <button
            type="button"
            className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5"
            style={{ backgroundColor: palette.burgundy }}
          >
            Interpreter Login
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <Link
          to="/portal"
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5"
          style={{ backgroundColor: palette.burgundy }}
        >
          Portal
        </Link>
        <UserButton afterSignOutUrl="/interpreters" />
      </SignedIn>
    </div>
  );
}

export function PortalSignOutButton() {
  return (
    <SignOutButton redirectUrl="/interpreters">
      <button type="button" className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-[#721100] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        Sign out
      </button>
    </SignOutButton>
  );
}
