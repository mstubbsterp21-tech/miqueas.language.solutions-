# Interpreter Login Portal Prototype

Branch: `feature/login-portal-mvp`

This branch adds a review-only interpreter login prototype at:

```text
/login.html
```

## What this prototype does

- Adds a branded interpreter login page.
- Demonstrates a simple sign-in flow using demo credentials.
- Shows an interpreter dashboard concept after login.
- Includes MVP sections for onboarding status, documents, availability, and rates.
- Keeps the current production React app untouched.

## Demo credentials

```text
Email: interpreter@miqueaslanguagesolutions.com
Password: MLSdemo2026!
```

## Important security note

This is not production authentication. The login state is stored in browser `localStorage`, and the credentials are hardcoded for demonstration only.

Before merging this into a production release, MLS should replace the demo flow with a managed auth provider such as Clerk, Supabase Auth, Auth0, or another secure provider. Production implementation should include:

- Invite-only user access
- Password reset handled by the auth provider
- Protected routes
- Role-based access controls
- Secure file storage rules
- Audit-friendly handling of uploaded documents
- No consumer, assignment, medical, legal, educational, or confidential interpreting details stored without a proper privacy/security plan

## Recommended next step

Review the page design and portal layout first. If the flow feels right, the next branch should connect real authentication and secure document/profile storage.
