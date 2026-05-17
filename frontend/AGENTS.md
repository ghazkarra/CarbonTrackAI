# Frontend Agent Guide

## Scope
- Work only inside `frontend` unless user asks otherwise.
- App is Vite + React + TypeScript for CarbonTrackAI.
- UI uses Tailwind CSS v4, shadcn/ui `radix-nova`, Radix primitives via `radix-ui`, and `lucide-react` icons.
- Routing uses `react-router-dom`.

## Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Add shadcn component: `npx shadcn@latest add <component>`

## Project Structure
- Pages live in `src/pages`.
- Dashboard nested pages live in `src/pages/dashboard`.
- Reusable layout lives in `src/components/layout`.
- Generated shadcn components live in `src/components/ui`.
- Dashboard-specific widgets live in `src/features/dashboard/components`.
- Mock dashboard data lives in `src/features/dashboard/data.ts` until API integration exists.
- Shared utilities live in `src/lib`.

## Routing Rules
- Define top-level routes in `src/App.tsx` with `Routes` and `Route`.
- Wrap app with `BrowserRouter` in `src/main.tsx`.
- Use `Link` and `NavLink` from `react-router-dom`; do not use raw anchors for internal navigation.
- Dashboard routes should be nested under `/dashboard` and render through `DashboardLayout` with `Outlet`.

## Styling Rules
- Prefer Tailwind utilities and shadcn components.
- Keep theme tokens in `src/index.css`.
- Primary color is green for carbon/sustainability branding.
- Use `cn()` from `src/lib/utils.ts` for conditional classes.
- Do not edit generated shadcn components unless required for a concrete bug or design-system need.
- Use the OpenCode `frontend-design` skill for landing pages, dashboard screens, auth pages, or any substantial UI redesign.
- Apply `frontend-design` creatively, but keep CarbonTrackAI constraints: green primary, shadcn/ui, React Router DOM, and pages in `src/pages`.

## Quality Rules
- Run `npm run build` after meaningful code changes.
- Run `npm run lint` when touching many files or changing patterns.
- Do not commit or depend on `dist` or `node_modules` contents.
- Keep frontend auth pages as UI placeholders until backend auth exists.
- Do not hardcode production API URLs; use env config when API integration starts.

## OpenCode MCP
- shadcn MCP config lives in `frontend/opencode.json`.
- Restart OpenCode from `frontend` when MCP tools do not appear.

## OpenCode Skills
- Project skill lives in `frontend/.opencode/skills/frontend-design/SKILL.md`.
- OpenCode discovers this skill when started from `frontend` or a child directory.
- `frontend/opencode.json` allows `frontend-design` under `permission.skill`.
