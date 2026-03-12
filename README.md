# LevelUp App Starter

Starter template with:

- Next.js (App Router + TypeScript)
- Tailwind CSS
- TanStack Query (global provider + sample query)
- FastAPI backend
- SQLAlchemy + Alembic migrations

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start dev server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## Backend setup

1. Create and activate a Python virtualenv:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install backend dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Add your `DATABASE_URL` in `.env` (password special chars like `@` must be URL-encoded as `%40`).

4. Start the API:

   ```bash
   uvicorn backend.app.main:app --reload
   ```

## Project structure

- `app/`: app router pages and API routes
- `components/providers/query-provider.tsx`: TanStack Query setup
- `components/examples/demo-health-card.tsx`: sample client query usage
- `tailwind.config.ts`: theme and content config
- `backend/app/`: FastAPI app code
- `backend/alembic/`: Alembic migration config

## Secrets policy

- Secrets must never be hardcoded in source files.
- Put secrets in `.env` / `.env.local`.
- Keep only placeholder variable names in `.env.example`.
- When a new integration needs credentials, add the variable name(s) to `.env.example` and then fill real values in `.env.local`.

## Bucket Upload Setup (Game Memories)

This project includes `/api/storage/upload`, which creates a signed upload URL, then the browser uploads selfie/dance/drawing/singing files directly to Supabase Storage. This avoids large file bodies passing through the Next.js server function (better for Vercel limits).

Add these to `.env.local`:

- `SUPABASE_STORAGE_URL` (your storage endpoint; your provided S3 URL works)
- `SUPABASE_STORAGE_SERVICE_KEY` (Supabase service role key)
- `SUPABASE_STORAGE_BUCKET` (bucket name for memories)
- `SUPABASE_STORAGE_PUBLIC_URL_BASE` (optional public URL base override)
- `UPLOAD_SESSION_SECRET` (a long random secret used to sign short-lived upload session cookies)

For direct playback in the frontend carousel, the bucket should be public.
The upload flow now requires a same-origin browser session cookie before the server will mint a signed upload URL, which helps reduce blind abuse of the service-role-backed signing endpoint.

## Migrations

Create a migration:

```bash
alembic -c backend/alembic.ini revision --autogenerate -m "init"
```

Apply migrations:

```bash
alembic -c backend/alembic.ini upgrade head
```

## Next step

When you share your Figma file key and node ID, we can implement the real UI on top of this scaffold.
