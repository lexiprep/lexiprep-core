# @lexiprep/core

Reusable, framework-agnostic pipeline that turns an **EPUB into a frequency-sorted
word list** — the language-processing engine behind [lexiprep](https://github.com/ORG/lexiprep),
usable on its own in any Node/TypeScript project.

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
  fromChapter: 0,           // optional chapter range (EPUB has no fixed pages)
  toChapter: 5,
});

console.log(analysis.metadata.title, analysis.totalTokens);
for (const { word, count } of analysis.frequencies.slice(0, 20)) {
  console.log(count, word);
}
```

### API

| Export | Purpose |
|---|---|
| `readEpub(input)` | Parse an EPUB (2/3) into `{ metadata, chapters[] }`, chapters in reading order with clean text. |
| `analyzeBook(book, options?)` | Frequency report with chapter-range, stopword and min-length filters. |
| `countWords(text, options?)` | Frequency count for a raw string. |
| `tokenize(text)` / `normalizeWord(raw)` | Locale-agnostic word tokenization (EN now, accents/ES ready). |
| `htmlToText(html)` | Strip XHTML to clean text. |
| `ENGLISH_STOPWORDS` | Default English function-word set. |

Full behavior and design notes: see the lexiprep specs.

## CLI

```bash
pnpm analyze book.epub --top 30
# options: --from C --to C --min-length N --keep-stopwords --json
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
