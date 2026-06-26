#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { readEpub } from "./epub/reader.js";
import { analyzeBook } from "./analyze/wordCount.js";

const USAGE = `lexiprep analyze — word frequencies from an EPUB

Usage:
  lexiprep-analyze <book.epub> [options]

Options:
  --top <n>           Show the top N words (default 30; 0 = all)
  --from <chapter>    First chapter index, 0-based (default 0)
  --to <chapter>      Last chapter index, inclusive (default last)
  --min-length <n>    Drop words shorter than N characters (default 1)
  --keep-stopwords    Keep basic function words (the, a, on, ...) in the list
  --json              Emit the full analysis as JSON
  -h, --help          Show this help
`;

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      top: { type: "string", default: "30" },
      from: { type: "string" },
      to: { type: "string" },
      "min-length": { type: "string", default: "1" },
      "keep-stopwords": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help || positionals.length === 0) {
    process.stdout.write(USAGE);
    return;
  }

  const path = positionals[0]!;
  const book = await readEpub(await readFile(path));
  const analysis = analyzeBook(book, {
    fromChapter: intOpt(values.from),
    toChapter: intOpt(values.to),
    minLength: intOpt(values["min-length"]) ?? 1,
    excludeStopwords: !values["keep-stopwords"],
  });

  if (values.json) {
    process.stdout.write(JSON.stringify(analysis, null, 2) + "\n");
    return;
  }

  const top = intOpt(values.top) ?? 30;
  printReport(analysis, top, path);
}

function printReport(
  analysis: ReturnType<typeof analyzeBook>,
  top: number,
  path: string,
): void {
  const { metadata, chapterCount, analyzedRange, totalTokens, uniqueWords, frequencies } =
    analysis;

  const lines: string[] = [];
  lines.push("");
  lines.push(`  ${metadata.title ?? path}`);
  if (metadata.author) lines.push(`  by ${metadata.author}`);
  const lang = metadata.language ? `  ·  ${metadata.language}` : "";
  lines.push(
    `  ${chapterCount} chapters` +
      `  ·  analyzed ${analyzedRange.fromChapter}–${analyzedRange.toChapter}` +
      lang,
  );
  lines.push(
    `  ${totalTokens.toLocaleString()} tokens  ·  ` +
      `${uniqueWords.toLocaleString()} unique words shown`,
  );
  lines.push("");

  const shown = top > 0 ? frequencies.slice(0, top) : frequencies;
  const rankWidth = String(shown.length).length;
  const wordWidth = Math.min(
    28,
    shown.reduce((max, f) => Math.max(max, f.word.length), 0),
  );

  shown.forEach((f, i) => {
    const rank = String(i + 1).padStart(rankWidth, " ");
    const word = f.word.padEnd(wordWidth, " ");
    lines.push(`  ${rank}.  ${word}  ${f.count}`);
  });
  lines.push("");

  process.stdout.write(lines.join("\n"));
}

function intOpt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

main().catch((err: unknown) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
