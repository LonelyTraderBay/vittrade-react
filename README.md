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
| `npm run test:margin` | Margin-trading suite (own config/setup) |

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
  dev/                      # development-only MSW handlers and fixtures
  styles/                   # global CSS and design tokens
tests/margin-trading/       # margin suite (own vitest config)
scripts/                    # codemods & maintenance scripts
guidelines/                 # product & design guidelines (Vietnamese)
```

Legacy modules still under `src/app/pages` and `src/app/components` are being
migrated by domain slice. New business logic belongs in `src/features/<domain>`;
shared primitives belong in `src/shared`. See [ARCHITECTURE.md](ARCHITECTURE.md)
for ownership rules and the generated page inventory.

## Engineering standards

- **TypeScript strict** — `npm run typecheck` gates the build; zero errors.
- **Route-level code splitting** — every page is `React.lazy`; vendor code split into `vendor-*` chunks.
- **Lint & format** — ESLint errors and the migration warning budget gate CI; Prettier and `.editorconfig` keep formatting consistent.
- **CI** — `.github/workflows/ci.yml` checks type safety, lint, formatting, unit/coverage/margin tests, Playwright accessibility smoke, security and contract policies, architecture boundaries, production artifacts and bundle budgets.
- **Error containment** — router-level `errorElement` + `ErrorBoundary` at the app shell; `Suspense` fallback while chunks load.

## Testing notes

- Tests live next to features (`__tests__/`) and under `src/test/` (infra + trading domain suites).
- `renderWithProviders` / `renderWithRouter` come from `@/test/test-utils`; navigation-mocked variant: `@/test/test-utils-navigation`.
