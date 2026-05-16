# Backend Agent Guide

## Scope
- Work only inside `backend` unless user asks otherwise.
- Backend is planned as FastAPI for CarbonTrackAI APIs.
- Current code exposes FastAPI app under `app/main.py`.

## Commands
- Activate Windows venv: `.\venv\Scripts\Activate.ps1`
- Install dependencies: `pip install -r requirements.txt`
- Run module entrypoint: `python -m app`
- Preferred dev server: `uvicorn app.main:app --reload`

## Current State
- `requirements.txt` contains FastAPI, SQLAlchemy, auth, and test dependencies.
- `.env.example` contains safe placeholder environment variables.
- `app/main.py` exposes module-level `app` for `uvicorn app.main:app --reload`.
- SQLite is the default development database; MySQL is supported by setting `DATABASE_URL`.

## Project Structure
- API routes should live in `app/routers`.
- Request and response models should live in `app/schemas`.
- Business logic should live in `app/services`.
- Database connection/session code should live in `app/database.py`.
- Configuration should live in `app/config.py` when environment settings are added.

## API Rules
- Prefix application endpoints with `/api`.
- Keep `/health` available for health checks.
- Use Pydantic models for request and response shapes.
- Keep endpoint functions small; move domain logic into services.
- Return explicit errors with appropriate HTTP status codes.

## Security Rules
- Never commit real secrets or `.env` values.
- Keep `.env.example` limited to safe placeholder variables.
- Do not hardcode credentials, tokens, database URLs, or API keys.
- Auth should be implemented with a deliberate JWT or session design, not temporary hardcoded users.

## Quality Rules
- Update `requirements.txt` whenever adding Python dependencies.
- Verify backend imports or starts before finishing backend changes.
- Add tests when endpoint behavior or calculations become non-trivial.
- Keep virtualenv and generated cache files out of source changes.
