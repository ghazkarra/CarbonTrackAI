# Backend Agent Guide

## Scope
- Work only inside `backend` unless user asks otherwise.
- Backend is planned as FastAPI for CarbonTrackAI APIs.
- Current code is early skeleton under `app`.

## Commands
- Activate Windows venv: `.\venv\Scripts\Activate.ps1`
- Install dependencies: `pip install -r requirements.txt`
- Run module entrypoint: `python -m app`
- Preferred future dev server, after exposing module-level `app`: `uvicorn app.__main__:app --reload`

## Current Caveats
- `requirements.txt` is currently empty.
- `.env.example` currently looks like package names, not environment variables.
- `app/__main__.py` defines `main()` but does not expose a module-level `app` object yet.
- Fix these before adding real endpoints or deployment instructions.

## Project Structure
- API routes should live in `app/routes`.
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
