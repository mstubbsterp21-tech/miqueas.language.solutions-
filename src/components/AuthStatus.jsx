import { SignedIn, SignOutButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

export default function AuthStatus({ palette }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        to="/login"
        className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5"
        style={{ backgroundColor: palette.burgundy }}
      >
        Interpreter Login
      </Link>

      <SignedIn>
        <Link
          to="/portal"
          className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5"
          style={{ backgroundColor: palette.gold }}
        >
          Portal
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
          <UserButton
            afterSignOutUrl="/login"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
                userButtonTrigger: "h-10 w-10 focus:shadow-none",
              },
            }}
          />
        </div>
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
