# Yoga with Chang

Private 1-on-1 yoga booking for one instructor. Guests sign in with a Guest ID and PIN, request a session, and the instructor confirms it. The public calendar shows open times; the admin area manages bookings.

## Stack

Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, next-intl, Supabase.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`; the app redirects to `/vi` or `/en` based on locale.

```bash
npm run lint
npm run build
```

## Environment variables

Create `.env.local` in the project root. Names only; never commit this file.

| Name | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `ADMIN_PASSWORD` | yes for admin | Server-side admin password; use a new value, not the old hardcoded one |
| `ADMIN_USERNAME` | no | Admin username; defaults to `admin` |
| `ADMIN_SESSION_SECRET` | no | Separate signing secret for admin sessions; falls back to `ADMIN_PASSWORD` |
| `GUEST_SESSION_SECRET` | no | Guest session signing secret; falls back to `ADMIN_SESSION_SECRET` then `ADMIN_PASSWORD` |
| `SUPABASE_SERVICE_ROLE_KEY` | recommended before RLS | Server-only key for trusted reads/writes |
| `CALENDAR_FEED_TOKEN` | no | Secret token that enables private names/IDs in `/api/calendar/feed`; without it the feed is PII-free |
| `NEXT_PUBLIC_CONTACT_LINK` | owner input | Zalo / WhatsApp / Messenger link used by contact and first-session request forms |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical site URL for metadata; defaults to the production URL |

## Security notes

- Admin and guest sessions are signed HttpOnly cookies; credentials are verified on the server.
- The public calendar and feed never include guest names, guest IDs, or booking IDs unless a valid `CALENDAR_FEED_TOKEN` is supplied.
- Supabase RLS policies must still be reviewed and locked down before treating the anon key as non-privileged. See the owner follow-up notes.
