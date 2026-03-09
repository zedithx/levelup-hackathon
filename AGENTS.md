# Project Rules

- Never hardcode secrets (API keys, tokens, passwords, private URLs) in app code.
- Put secrets only in local environment files such as `.env` or `.env.local`.
- Never commit secret values to git.
- Keep required env variable names in `.env.example` with placeholder values only.
- When adding a feature that needs a new secret, explicitly tell the user which key(s) to add to `.env`.
- Before making code changes, review `bugs.md` and `lint.md` for known issues and standard fixes.
- Before finalizing work, run `npm run lint` and `npm run build`.
- If new lint or bug patterns appear, document them in `lint.md` or `bugs.md` respectively.
