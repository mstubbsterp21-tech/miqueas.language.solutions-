# Interpreter Portal MVP

Branch: `feature/login-portal-mvp`

This branch moves the login concept from a static prototype into a real React/Clerk/Supabase implementation scaffold.

## Routes added

```text
/login
/portal
/admin/interpreters
/login.html -> redirects to /login
```

## What is included

- Clerk-powered login page at `/login`
- Protected interpreter portal route at `/portal`
- Admin interpreter roster shell at `/admin/interpreters`
- Interpreter profile form
- Availability windows
- Rate fields
- Private document upload UI
- Uploaded document checklist/history
- Supabase client helper
- Environment variable helper
- Setup-required fallback screen if keys are missing
- Supabase SQL setup file

## Environment variables

Add these in Vercel and in local `.env.local` when testing:

```text
VITE_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=replace_me
VITE_ADMIN_EMAILS=m.stubbs@miqueaslanguagesolutions.com
```

## Supabase setup

Run this SQL file in Supabase SQL Editor:

```text
supabase/interpreter-portal-schema.sql
```

It creates:

- `interpreters` table
- `interpreter_documents` table
- private `interpreter-documents` storage bucket
- RLS enabled on the tables
- commented policy examples for Clerk/Supabase JWT integration

## Critical security note

This branch is not fully production-ready until Clerk and Supabase authorization are finalized.

The safest production path is one of these:

1. Configure Clerk JWT templates for Supabase so Supabase RLS can identify the Clerk user through `auth.jwt() ->> 'sub'`.
2. Move profile/document reads and writes behind Vercel serverless API routes using the Supabase service role key on the server only.

Do not expose a Supabase service role key in the browser.

## Recommended Clerk settings

- Use invite-only access for interpreters.
- Disable or restrict public signups.
- Add MLS admin emails to `VITE_ADMIN_EMAILS`.
- Set redirect after sign-in to `/portal`.

## Recommended Supabase settings

- Keep `interpreter-documents` private.
- Do not store consumer, client assignment, medical, legal, educational, or interpreting-session details in this portal unless a more complete security/privacy plan is in place.
- Treat W-9s and credential files as sensitive documents.

## Local testing

```bash
npm install
npm run dev
```

Then visit:

```text
http://localhost:5173/login
http://localhost:5173/portal
http://localhost:5173/admin/interpreters
```

Without environment variables, the portal routes will show the setup-required notice instead of crashing.
