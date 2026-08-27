# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 15 (App Router) app — the "Israel Air & Ambulance" Hebrew/RTL
dispatch system — backed by Supabase (Postgres + Auth + RLS). There is no separate
backend service; API route handlers under `src/app/api/**` talk to Supabase.
Standard scripts live in `package.json` (`dev`, `build`, `start`, `lint`); the DB schema
is `supabase/schema.sql`.

### Local Supabase (required for the app to do anything)

The app needs a Supabase instance for auth + DB. In cloud, run a **local** Supabase stack
via the Supabase CLI + Docker instead of a hosted project:

- Docker and the `supabase` CLI are preinstalled in the VM snapshot, but the Docker
  daemon is not auto-started. Start it once per session (it needs `fuse-overlayfs`):
  `sudo dockerd` (run it in a background/tmux session; `/etc/docker/daemon.json` is
  already configured for `fuse-overlayfs` + `containerd-snapshotter: false`).
- Start the stack from the repo root: `sudo supabase start` (first boot pulls images).
  Reset/re-apply the schema with `sudo supabase db reset`.
- Local API URL is `http://127.0.0.1:54321`; keys are shown by `sudo supabase status`
  (new `sb_publishable_...` / `sb_secret_...` format — these work as the anon/service-role
  keys for this app).

Non-obvious gotchas:
- The schema is applied as a migration at `supabase/migrations/00000000000000_init_schema.sql`
  (a copy of `supabase/schema.sql`). The migration copy contains a fix: three
  `language sql` functions (`is_approved_user`, `is_admin`, `is_dispatcher_or_admin`) had a
  bare `exists (...)` body, which is invalid Postgres; the migration uses `select exists (...)`.
  The original `supabase/schema.sql` still has the bug (it targets hosted Supabase's SQL editor).
- `supabase/config.toml` sets `api.auto_expose_new_tables = true`. Without it, the new CLI
  default does NOT grant Data API privileges to `anon`/`authenticated`/`service_role`, and
  every table read/write fails with `permission denied for table ...`. The schema relies on
  Supabase's legacy auto-grant behavior.

### Environment variables

Copy `.env.example` to `.env.local` (gitignored). For local Supabase set:
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>`,
`SUPABASE_SERVICE_ROLE_KEY=<secret key>`, plus `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`,
and `NATIONAL_ID_ENCRYPTION_KEY` (any 32+ byte base64 string; needed whenever a call/user with a
national ID is saved). Webhook/maps vars can stay empty — those integrations are skipped when unset.

### Bootstrapping an admin (login is phone+password → `PHONE@phone.local`)

New users default to `pending` and cannot access anything. To create the first admin, create
an auth user with the service-role key (`supabase.auth.admin.createUser`) and upsert a row into
`public.app_users` with `role='admin', status='approved'`. Run any such script from inside the
repo so `@supabase/supabase-js` resolves from `node_modules`. Then log in at `/login`.

### Run / verify

- Dev server: `npm run dev` (http://localhost:3000). Lint: `npm run lint`. Build: `npm run build`.
- End-to-end smoke test: log in as admin → `/calls/new` → create a call → it appears on `/dashboard`.
