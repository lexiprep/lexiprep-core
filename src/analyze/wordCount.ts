import { tokenize, tokenizeWithContext } from "../text/tokenize.js";
import { splitSentences } from "../text/sentences.js";
import { ENGLISH_STOPWORDS } from "../stopwords/english.js";
import { lemmatize } from "../lemmatize/english.js";
import type { EpubBook, EpubMetadata } from "../epub/types.js";

/**
 * Capitalization-based proper-noun classification for a surface form:
 *  - `confirmed` — capitalized in ≥2 mid-sentence occurrences (≥90%): a name.
 *  - `likely`    — capitalized in exactly one mid-sentence occurrence: probably a name.
 * Mid-sentence = not sentence-initial and not ALL-CAPS (those carry no signal).
 */
export type ProperNounClass = "confirmed" | "likely";

export interface WordFrequency {
  /** Normalized surface form (counts are still per surface form). */
  word: string;
  count: number;
  /** Base form, when {@link CountOptions.lemmatize} is set (e.g. "men" → "man"). */
  lemma?: string;
  /** Proper-noun class, when {@link CountOptions.detectProperNouns} is set. */
  properNoun?: ProperNounClass;
  /** First-occurrence sentence, when {@link CountOptions.captureExamples} is set. */
  example?: string;
}

export interface CountOptions {
  /** Drop words shorter than this many characters (after normalization). Default 1. */
  minLength?: number;
  /** Filter out basic function words. Default false. */
  excludeStopwords?: boolean;
  /** Stopword set to apply when {@link excludeStopwords} is set. Defaults to English. */
  stopwords?: ReadonlySet<string>;
  /** Attach a base-form `lemma` to each entry (English). Default false. */
  lemmatize?: boolean;
  /** Classify each surface form as a proper noun via mid-sentence capitalization. Default false. */
  detectProperNouns?: boolean;
  /** Attach the first-occurrence sentence as a context example to each entry. Default false. */
  captureExamples?: boolean;
}

/** Mid-sentence casing tallies for one surface form (sentence-initial/ALL-CAPS excluded). */
interface CaseStats {
  title: number;
  lower: number;
}

export interface ChapterRange {
  /**
   * Inclusive chapter index range in spine (reading) order, 0-based. EPUB has no
   * fixed pages, so "page" filtering is expressed over content documents — see
   * docs/specs. Omit either bound to run to the start/end.
   */
  fromChapter?: number;
  toChapter?: number;
}

export interface BookAnalysis {
  metadata: EpubMetadata;
  /** Total number of content documents in the book. */
  chapterCount: number;
  /** The inclusive chapter range that was actually analyzed. */
  analyzedRange: { fromChapter: number; toChapter: number };
  /** Total word tokens in range, before stopword/length filtering. */
  totalTokens: number;
  /** Distinct words after filtering. */
  uniqueWords: number;
  /** Word frequencies, descending by count then alphabetical. */
  frequencies: WordFrequency[];
}

/** Count word frequencies in a block of text, sorted most-frequent first. */
export function countWords(text: string, options: CountOptions = {}): WordFrequency[] {
  const { counts, properStats } = tally(text, options);
  const examples = options.captureExamples ? captureExamples(text) : undefined;
  return tallyToFrequencies(counts, options.lemmatize, properStats, examples);
}

/**
 * Analyze an EPUB into a frequency report, optionally restricted to a chapter
 * range. This is the primary entry point for the "ebook -> word list" feature.
 */
export function analyzeBook(
  book: EpubBook,
  options: CountOptions & ChapterRange = {},
): BookAnalysis {
  const last = Math.max(0, book.chapters.length - 1);
  const from = clamp(options.fromChapter ?? 0, 0, last);
  const to = clamp(options.toChapter ?? last, from, last);

  const text = book.chapters
    .slice(from, to + 1)
    .map((chapter) => chapter.text)
    .join("\n\n");

  const { counts, totalTokens, properStats } = tally(text, options);
  const examples = options.captureExamples ? captureExamples(text) : undefined;
  const frequencies = tallyToFrequencies(counts, options.lemmatize, properStats, examples);

  return {
    metadata: book.metadata,
    chapterCount: book.chapters.length,
    analyzedRange: { fromChapter: from, toChapter: to },
    totalTokens,
    uniqueWords: frequencies.length,
    frequencies,
  };
}

// --- internals ---------------------------------------------------------------

function tally(
  text: string,
  options: CountOptions,
): { counts: Map<string, number>; totalTokens: number; properStats?: Map<string, CaseStats> } {
  const minLength = options.minLength ?? 1;
  const stopwords = options.excludeStopwords
    ? options.stopwords ?? ENGLISH_STOPWORDS
    : null;

  const counts = new Map<string, number>();
  const properStats = options.detectProperNouns ? new Map<string, CaseStats>() : undefined;
  let totalTokens = 0;

  for (const tok of tokenizeWithContext(text)) {
    totalTokens++;
    // Accumulate casing evidence over ALL tokens (names aren't stopwords, but the
    // signal is independent of the frequency filters).
    if (properStats && !tok.sentenceInitial) {
      const letters = tok.raw.replace(/[^\p{L}]/gu, "");
      const allCaps = letters.length > 1 && letters === letters.toUpperCase();
      if (!allCaps) {
        const s = properStats.get(tok.word) ?? { title: 0, lower: 0 };
        if (isUpperFirst(tok.raw)) s.title++;
        else s.lower++;
        properStats.set(tok.word, s);
      }
    }
    if (tok.word.length < minLength) continue;
    if (stopwords?.has(tok.word)) continue;
    counts.set(tok.word, (counts.get(tok.word) ?? 0) + 1);
  }

  return { counts, totalTokens, properStats };
}

function tallyToFrequencies(
  counts: Map<string, number>,
  withLemma = false,
  properStats?: Map<string, CaseStats>,
  examples?: Map<string, string>,
): WordFrequency[] {
  return [...counts]
    .map(([word, count]) => {
      const entry: WordFrequency = { word, count };
      if (withLemma) entry.lemma = lemmatize(word);
      const cls = properStats && classifyProper(properStats.get(word));
      if (cls) entry.properNoun = cls;
      const ex = examples?.get(word);
      if (ex) entry.example = ex;
      return entry;
    })
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

/**
 * One context sentence per surface form — its first occurrence. Every counted word
 * comes from the text, so each gets a snippet (a context match is always available).
 * If the first-occurrence sentence is very short (<4 words), it's padded with the
 * neighbouring sentences so the snippet carries real context (spec 03).
 */
function captureExamples(text: string): Map<string, string> {
  const examples = new Map<string, string>();
  const sentences = splitSentences(text);
  for (let i = 0; i < sentences.length; i++) {
    const words = tokenize(sentences[i]!);
    if (words.length === 0) continue;
    let snippet: string | undefined;
    for (const word of words) {
      if (examples.has(word)) continue;
      if (snippet === undefined) {
        snippet =
          words.length < 4
            ? [sentences[i - 1], sentences[i]!, sentences[i + 1]]
                .filter((s): s is string => Boolean(s))
                .join(" ")
            : sentences[i]!;
      }
      examples.set(word, snippet);
    }
  }
  return examples;
}

/** True when the surface form's first (letter) character is uppercase. */
function isUpperFirst(raw: string): boolean {
  const c = raw.charAt(0);
  return c !== c.toLowerCase() && c === c.toUpperCase();
}

/** Classify a surface form from its mid-sentence casing tallies. */
function classifyProper(stats?: CaseStats): ProperNounClass | undefined {
  if (!stats) return undefined;
  const n = stats.title + stats.lower;
  if (n >= 2 && stats.title / n >= 0.9) return "confirmed";
  if (n === 1 && stats.title === 1) return "likely";
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
