import { SignedIn, SignedOut, SignOutButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function AuthStatus({ palette }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SignedOut>
        <Link
          to="/login"
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5"
          style={{ backgroundColor: palette.burgundy }}
        >
          Interpreter Login
        </Link>
      </SignedOut>

      <SignedIn>
        <Link
          to="/portal"
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5"
          style={{ backgroundColor: palette.burgundy }}
        >
          Portal
        </Link>
        <UserButton afterSignOutUrl="/login" />
      </SignedIn>
    </div>
  );
}

export function PortalSignOutButton() {
  return (
    <SignOutButton redirectUrl="/login">
      <button type="button" className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-[#721100] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        Sign out
      </button>
    </SignOutButton>
  );
}
