# Production Certification Revision Binding Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the architecture inventory from labeling a page `production` when its current page, route, contract, adapter, or test inputs differ from the source revision verified in staging.

**Architecture:** Keep the existing staging evidence format and bind its `commitSha` to the source inputs actually inspected by the inventory generator. Compare the evidence revision with the current Git tree for the certified page, its route sources, and referenced contract/adapter/tests; also reject worktree or index changes to those source inputs. Keep the staging evidence JSON outside this source-input comparison because it is produced after the source revision is tested.

**Tech Stack:** Node.js built-in `child_process`, TypeScript source parser, Vitest.

**Spec:** `docs/architecture/production-page-certifications.json`; `scripts/generate-architecture-inventory.mjs`.

## Global Constraints

- Production status requires contract, adapter, authorization test, integration test and HTTPS staging evidence.
- Staging evidence includes a 40-character commit SHA and verified route paths.
- Do not promote any current page without actual staging evidence.
- Do not stage, commit, reset or clean the pre-existing dirty worktree.

## Review Focus

- Evidence revision is absent from the local Git object database: reject certification.
- Page or route source differs from the staged revision: reject certification.
- Contract, adapter or test source changed after staging: reject certification.
- Only the post-run evidence JSON or certification manifest changed: still allow certification when all certified source inputs match the verified revision.
- Route is missing from staging evidence: preserve the current rejection.

---

### Task 1: Bind production status to certified source inputs

**Files:**

- Modify `scripts/generate-architecture-inventory.mjs`
- Modify `scripts/generate-architecture-inventory.test.mjs`
- Regenerate `docs/architecture/page-inventory.json`

**Interfaces:**

- `loadProductionCertifications(pagePaths, { root, routeRecords })` continues returning a Map of validated certifications and rejects evidence whose source revision is unavailable or differs from certified source inputs.
- `buildInventory()` supplies its parsed route records to certification validation.

- [x] Write a failing test where the certification fixture commits its source inputs, then changes the page source; `loadProductionCertifications` must reject the stale staging SHA.
- [x] Run `npm.cmd run test:run -- scripts/generate-architecture-inventory.test.mjs` and confirm the stale-revision test fails because the loader accepts it.
- [x] Add a source-revision validator using Git's `cat-file`, `diff`, and path-scoped `status` commands. Include the page, route source files, OpenAPI contract, adapter, authorization test and integration test; exclude the staging evidence JSON and manifest from source-dirty checks.
- [x] Re-run the focused generator tests and confirm unknown revisions, changed source inputs and dirty certified files are rejected while evidence/manifest-only updates remain valid.
- [x] Run `npm.cmd run architecture:inventory` and `npm.cmd run architecture:inventory:check`; confirm 0 pages are marked production without live certification evidence.
- [x] Run `npm.cmd run typecheck`, `npm.cmd run format:check`, `npm.cmd run architecture:check`, and `npm.cmd run contracts:check`.
