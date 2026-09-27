# VitTrade — React Frontend

Enterprise crypto trading frontend: React 18 + TypeScript (strict) + Vite + Tailwind 4 + Radix/shadcn UI, three platform shells (Phone `/` · Tablet `/t` · Web `/w`).

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Type-check, then production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc --noEmit` over app + node configs |
| `npm run lint` / `lint:fix` | ESLint (flat config) |
| `npm run format` / `format:check` | Prettier over `src/**/*.{ts,tsx,css}` |
| `npm run test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Coverage report |

## Environment

Copy `.env.example` → `.env.local` and set values. Never read `import.meta.env` in feature code — import `env` from `src/shared/config/env.ts` (single source of truth).

## Project structure

```
src/
  main.tsx                  # browser entry
  app/                      # bootstrap, providers, shells and route composition
  features/<domain>/        # domain API, model, UI, pages and route modules
  shared/                   # reusable UI, hooks, API infrastructure and utilities
  test/                     # setup, test utilities, factories and development mocks
  dev/                      # development-only demos, legacy screens, MSW handlers and fixtures
  styles/                   # global CSS and design tokens
scripts/                    # codemods & maintenance scripts
guidelines/                 # product & design guidelines (Vietnamese)
```

`src/app/pages` contains shell composition adapters and the integration boundary.
Business logic belongs in `src/features/<domain>`; reusable UI and primitives
live in `src/shared/ui`. Development-only legacy screens remain under `src/dev`.
See [ARCHITECTURE.md](ARCHITECTURE.md) for ownership rules and the generated page
inventory. This project currently covers frontend development; real backend
integration and production certification are future integration work.

## Engineering standards

- **TypeScript strict** — `npm run typecheck` gates the build; zero errors.
- **Route-level code splitting** — every page is `React.lazy`; vendor code split into `vendor-*` chunks.
- **Lint & format** — ESLint errors and the zero-warning budget gate CI; Prettier and `.editorconfig` keep formatting consistent.
- **CI** — `.github/workflows/ci.yml` checks type safety, lint, formatting, unit/integration tests and coverage, Playwright accessibility smoke, security and contract policies, architecture boundaries, production artifacts and bundle budgets.
- **Error containment** — router-level `errorElement` + `ErrorBoundary` at the app shell; `Suspense` fallback while chunks load.

## Testing notes

- Tests live next to features (`__tests__/`) and under `src/test/` (infra + trading domain suites).
- `renderWithProviders` / `renderWithRouter` come from `@/test/test-utils`; navigation-mocked variant: `@/test/test-utils-navigation`.
