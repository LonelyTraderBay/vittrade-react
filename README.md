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

Copy `.env.example` → `.env.local` and set values. Never read `import.meta.env` in feature code — import `env` from `src/app/config/env.ts` (single source of truth).

## Project structure

```
src/
  main.tsx                  # entry
  app/
    App.tsx                 # RouterProvider + global error handlers
    routes.ts               # router tree (3 shells) + RouteErrorBoundary
    routeConfig.ts          # per-feature route builders (all pages lazy)
    components/             # shared components (ui/ = design system primitives)
    pages/                  # screens grouped by feature
    contexts/ hooks/ services/ providers/
    config/ constants/ theme/ types/ utils/ data/
  test/                     # test infra: setup, test-utils, trading helpers
  styles/                   # global CSS + tokens
tests/margin-trading/       # margin suite (own vitest config)
scripts/                    # codemods & maintenance scripts
guidelines/                 # product & design guidelines (Vietnamese)
```

## Engineering standards

- **TypeScript strict** — `npm run typecheck` gates the build; zero errors.
- **Route-level code splitting** — every page is `React.lazy`; vendor code split into `vendor-*` chunks.
- **Lint & format** — ESLint (errors gate CI), Prettier, `.editorconfig`.
- **CI** — `.github/workflows/ci.yml`: typecheck → lint → test (both suites) → build.
- **Error containment** — router-level `errorElement` + `ErrorBoundary` at the app shell; `Suspense` fallback while chunks load.

## Testing notes

- Tests live next to features (`__tests__/`) and under `src/test/` (infra + trading domain suites).
- `renderWithProviders` / `renderWithRouter` come from `@/test/test-utils`; navigation-mocked variant: `@/test/test-utils-navigation`.
