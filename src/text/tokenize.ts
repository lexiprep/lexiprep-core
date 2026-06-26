/**
 * Word tokenization for space-delimited languages (English now, Spanish later).
 *
 * A token is a run of letters (any script, so accented Spanish letters work)
 * that may contain internal apostrophes or hyphens — keeping "don't",
 * "O'Brien" and "co-operate" whole — but never leading/trailing punctuation or
 * digits. Curly apostrophes are unified with straight ones so "don't" and
 * "don't" count as the same word.
 */

// A letter, then any letters / combining marks / apostrophes / hyphens.
const WORD_RE = /\p{L}[\p{L}\p{M}'’\-]*/gu;

/**
 * Lowercase, unify curly apostrophes, drop a trailing possessive/contraction `'s`,
 * and strip edge apostrophes/hyphens. The `'s` clitic is not part of the word —
 * "Athena's" → "athena", "ship's" → "ship" — so possessives fold into their base.
 * (Contractions like "it's"/"that's" collapse to their stem too; almost all are
 * stopwords, so harmless.) Plural possessives ("dogs'") end in a bare apostrophe and
 * are handled by the edge strip.
 */
export function normalizeWord(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/'s$/, "")
    .replace(/^['-]+|['-]+$/g, "");
}

/** Split text into a flat list of normalized word tokens. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    const word = normalizeWord(match[0]);
    if (word.length > 0) out.push(word);
  }
  return out;
}

/** A token with the context needed for capitalization-based proper-noun detection. */
export interface TokenContext {
  /** Surface form exactly as it appeared, casing preserved. */
  raw: string;
  /** Normalized form (see {@link normalizeWord}). */
  word: string;
  /**
   * First word of a sentence — after `.`/`!`/`?` or a line break (block boundary,
   * preserved by `htmlToText`). Capitalization here carries no proper-noun signal,
   * since every sentence/line start is capitalized regardless.
   */
  sentenceInitial: boolean;
}

/** Like {@link tokenize} but yields each token's surface casing and sentence position. */
export function* tokenizeWithContext(text: string): Generator<TokenContext> {
  let lastEnd = 0;
  let sentenceInitial = true;
  for (const match of text.matchAll(WORD_RE)) {
    const gap = text.slice(lastEnd, match.index ?? 0);
    if (/[.!?\n]/.test(gap)) sentenceInitial = true;
    lastEnd = (match.index ?? 0) + match[0].length;
    const word = normalizeWord(match[0]);
    if (word.length === 0) continue;
    yield { raw: match[0], word, sentenceInitial };
    sentenceInitial = false;
  }
}
