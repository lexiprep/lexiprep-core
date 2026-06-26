# @lexiprep/core

[![npm](https://img.shields.io/npm/v/@lexiprep/core.svg)](https://www.npmjs.com/package/@lexiprep/core)
[![license](https://img.shields.io/npm/l/@lexiprep/core.svg)](./LICENSE)

Reusable, framework-agnostic pipeline that turns an **EPUB or PDF into a
frequency-sorted word list** — the language-processing engine behind [lexiprep](https://github.com/lexiprep/lexiprep),
usable on its own in any Node/TypeScript project. Published on npm as
[`@lexiprep/core`](https://www.npmjs.com/package/@lexiprep/core).

Pure TypeScript, no server or database dependencies. Runs locally, in a worker, in
tests, or (via `jszip`) potentially in the browser.

## Install

```bash
pnpm add @lexiprep/core
```

## Usage

```ts
import { readFile } from "node:fs/promises";
import { readEpub, analyzeBook } from "@lexiprep/core";

const book = await readEpub(await readFile("book.epub"));

const analysis = analyzeBook(book, {
  excludeStopwords: true,   // drop the/a/on/this...
  from: 0,                  // optional section range (EPUB chapters / PDF pages)
  to: 5,
});

console.log(analysis.metadata.title, analysis.totalTokens);
for (const { word, count } of analysis.frequencies.slice(0, 20)) {
  console.log(count, word);
}
```

PDFs are a drop-in — `readPdf` returns the same `Book`, with each page as a section:

```ts
import { readPdf } from "@lexiprep/core";

const pdfBook = await readPdf(await readFile("book.pdf"));
```

### API

A `Book` is `{ metadata, sections[] }`. A *section* is one EPUB content document
or one PDF page, in reading order — so the section range is a chapter range for
EPUB and a page range for PDF.

| Export | Purpose |
|---|---|
| `readEpub(input)` | Parse an EPUB (2/3) into a `Book` — sections are content documents in reading order, with clean text. |
| `readPdf(input)` | Parse a PDF into a `Book` — one section per page, in page order, with clean text. Runs in Node and the browser. |
| `analyzeBook(book, options?)` | Frequency report over a `Book` (EPUB or PDF) with section-range (`from`/`to`), stopword and min-length filters. |
| `countWords(text, options?)` | Frequency count for a raw string. |
| `tokenize(text)` / `normalizeWord(raw)` | Locale-agnostic word tokenization (EN now, accents/ES ready). |
| `htmlToText(html)` | Strip XHTML to clean text. |
| `ENGLISH_STOPWORDS` | Default English function-word set. |

Full behavior and design notes: see the lexiprep specs.

## CLI

```bash
pnpm analyze book.epub --top 30      # or: pnpm analyze book.pdf
# options: --from N --to N --min-length N --keep-stopwords --json
```

## Develop

No Docker, no services — just Node + pnpm:

```bash
pnpm install
pnpm test          # vitest
pnpm typecheck
pnpm build         # emits dist/ (tsc)
```

## License

MIT — reusable in any project, open or closed.
