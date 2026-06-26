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

## Status

Implemented: EPUB reader, tokenizer, frequency analysis, `analyze` CLI, 23 tests.
Next (per app roadmap): lemmatization to group conjugations under a base form.
