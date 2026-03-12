# Backend (FastAPI + SQLAlchemy + Alembic)

## Setup

1. Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. Install backend dependencies:

   ```bash
   pip install -r backend/requirements.txt
   ```

3. Ensure `DATABASE_URL` exists in `.env` or `.env.local` (encode special characters, for example `@` as `%40`).
4. Optional production hardening flags:

   - `APP_ENV=production` disables FastAPI docs and the public `/api/health/db` probe by default.
   - `ENABLE_API_DOCS=true` re-enables `/docs`, `/redoc`, and `/openapi.json` if you explicitly want them.
   - `PUBLIC_DB_HEALTHCHECK_ENABLED=true` re-enables `GET /api/health/db` for public monitoring if needed.

## Run API

```bash
uvicorn backend.app.main:app --reload
```

The API is available at:

- `GET /` (root)
- `GET /api/health`
- `GET /api/health/db` (enabled by default in development; disabled by default in production)

## Alembic commands

Create migration:

```bash
alembic -c backend/alembic.ini revision --autogenerate -m "init"
```

Apply migrations:

```bash
alembic -c backend/alembic.ini upgrade head
```
