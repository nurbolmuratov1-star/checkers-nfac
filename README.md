# Checkers Arena

Modern web platform prototype for playing checkers with Supabase auth.

## Project Structure

```txt
src/
  app/                 App composition and auth session routing
  features/
    auth/              Login, registration and auth styles
    dashboard/         Logged-in home/dashboard UI
  lib/                 External clients and shared integrations
  styles/              Global browser styles
```

## Environment

Create `.env.local` from `.env.example` and add your Supabase values:

```txt
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Authentication Setup

Email/password login uses Supabase Auth directly, so local profiles are synced after auth instead of being the source of truth for login.

For immediate login after signup, disable email confirmations in Supabase Auth, or users must confirm their email before `signInWithPassword` will succeed.

Google OAuth requires matching redirect URLs in Google Cloud and Supabase:

```txt
Google Cloud Authorized redirect URI:
https://rwepnwvuiopifaicmrgi.supabase.co/auth/v1/callback

Local app URLs to allow in Supabase Auth URL settings:
http://localhost:5173
http://localhost:5175
http://127.0.0.1:5173
http://127.0.0.1:5175
http://localhost:54321/auth/v1/callback
```

In Supabase Dashboard:

- Authentication -> Providers -> Google: enable Google and add the Google Client ID/Secret.
- Authentication -> URL Configuration: set Site URL to the deployed frontend URL, or the local dev URL while developing.
- Add local/deployed frontend URLs to Redirect URLs.

## Scripts

```bash
npm install
npm run dev
npm run build
```
