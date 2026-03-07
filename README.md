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
