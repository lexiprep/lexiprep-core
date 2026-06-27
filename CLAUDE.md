# @lexiprep/core — project guide

Reusable, standalone open-source library: EPUB → clean text → word tokens →
frequency list. This is the language-processing engine; the **app lives in a
separate repo** (`lexiprep`) and depends on this package.

## How to work in this repo

- **Valeriu is the lead developer and directs the work.** Do exactly the task asked —
  no more. Do not write unrequested code or widen scope; propose and get an explicit
  go-ahead first. When in doubt, ask rather than build.

## What this repo is (and is not)

- A **pure TypeScript library** with zero server/DB dependencies. **No Docker, no
  services** — it must always be runnable locally with just Node + pnpm.
- Framework-agnostic and portable (`jszip`-based, so it could run in a browser).
- It is **not** the application. No HTTP, persistence, auth, or UI here — those belong
  in the `lexiprep` app repo.

## Conventions

- TypeScript, ESM, `NodeNext`, strict. Relative imports use `.js` extensions.
- Keep the public surface in `src/index.ts`; everything is unit-tested (`vitest`).
- **MIT licensed** to stay maximally reusable. Keep dependencies minimal and vetted.
- Default branch `develop`. Never commit ebooks (`*.epub` is gitignored — often
  copyrighted).

## Commands

```bash
pnpm install
pnpm test        # vitest
pnpm typecheck
pnpm build       # tsc -> dist/
pnpm analyze <book.epub> [--top N --from C --to C --min-length N --keep-stopwords --json]
```

## Releasing — this is a published npm package

`@lexiprep/core` is published to **npm** (public). The `lexiprep` app does **not**
use a workspace link — it consumes the *published* package as a normal dependency
(`apps/server/package.json` → `@lexiprep/core`). So **changes here are invisible to
the app until they are published and the app's dependency is bumped.** Code-complete
is not done; shipping a new version is part of the task.

Release flow (tag-driven, no manual `npm publish`):

1. Bump `version` in `package.json` (semver) and commit.
2. `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. CI (`.github/workflows/release.yml`) runs the tests and publishes to npm via
   Trusted Publishing (OIDC, `npm publish --provenance` — no `NPM_TOKEN`). The git
   tag must match the `package.json` version.

**After every release, update the app** (practically, after each new core version):

- In `~/dev/lexiprep`, bump `@lexiprep/core` in `apps/server/package.json` to the new
  version, then `pnpm install` to refresh the lockfile.
- A core change isn't "delivered" until the app is pulling the new version.

## Status

Implemented: EPUB reader, tokenizer, frequency analysis, `analyze` CLI, 23 tests.
Next (per app roadmap): lemmatization to group conjugations under a base form.
