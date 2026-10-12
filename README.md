# VitTrade — React Frontend

Enterprise crypto trading frontend: React 18 + TypeScript (strict) + Vite + Tailwind 4 + Radix/shadcn UI, three platform shells (Phone `/` · Tablet `/t` · Web `/w`).

## Bắt đầu đóng góp

AI và người mới bắt đầu từ [AGENTS.md](AGENTS.md) và
[workflow phát triển](docs/ai/WORKFLOW.md): cách đọc ngữ cảnh, chọn skill,
kiểm chứng và bàn giao. [Hồ sơ dự án](docs/PROJECT_CONTEXT.md) ghi phạm vi khảo sát,
thành phần, bộ Universal 3.1, lệnh có căn cứ và giới hạn bằng chứng; hai file Universal
được giữ nguyên khi áp dụng. Khi tiếp tục chuẩn hóa frontend, dùng
[PLAN.md](docs/architecture/production-readiness/PLAN.md) để chọn công việc và
[TRACKING.json](docs/architecture/production-readiness/TRACKING.json) để xác minh
checkpoint, bằng chứng và phần còn thiếu. Plugin là công cụ hỗ trợ tùy môi trường;
tiêu chí nghiệm thu của repo áp dụng cho mọi người thực hiện.

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
| `npm run artifacts:cleanup` | Clean unused owned cache/output; required before task handoff |
| `npm run artifacts:cleanup -- --dry-run` | Preview automatic cleanup eligibility |

Build/test outputs live in `.artifacts/runs/<run-id>` with an owner manifest and
source hashes. `preview`, `production-mocks:check` and `bundle:check` use the most
recent successful production build matching the current source snapshot.
Existing `dist/coverage` and historical evidence are preserved. See the
[output and retention workflow](docs/ai/WORKFLOW.md#output-kiểm-thử-và-build)
for the approved cleanup policy. Test/build runners automatically clean disposable
output; finish every task with `npm run artifacts:cleanup`. Evidence, the latest
successful production build, active consumers, legacy output and worktrees remain
protected. Cleanup never sweeps shared dependencies or Temp.

## Environment

Copy `.env.example` → `.env.local` and set values. Never read `import.meta.env` in feature code — import `env` from `src/shared/config/env.ts` (single source of truth). Staging and production builds require `VITE_DATA_SOURCE=api`, an HTTPS API base URL and a WSS URL. The `.invalid` endpoints in the release examples are deliberate placeholders and are rejected at build time and startup; replace them only with endpoints supplied by the selected environment. CI uses reserved `.test` origins for build validation only and does not deploy them.

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
