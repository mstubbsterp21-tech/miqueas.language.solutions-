import { RedirectToSignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

export default function RequirePortalAuth({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/portal" />
      </SignedOut>
    </>
  );
}
