/**
 * Word tokenization for space-delimited languages (English now, Spanish later).
 *
 * A token is a run of letters (any script, so accented Spanish letters work)
 * that may contain internal apostrophes — keeping "don't" and "O'Brien" whole —
 * but never leading/trailing punctuation or digits. Curly apostrophes are
 * unified with straight ones so "don't" and "don't" count as the same word.
 *
 * Hyphens are word boundaries, not part of the word: "wine-dark" → "wine" +
 * "dark", "well-known" → "well" + "known". In books most hyphenated forms are
 * translator compounds ("rosy-fingered", "bright-eyed") or pronunciation
 * respellings — noise as whole tokens, while their parts are real, learnable,
 * level-tagged words. A few genuine compound lexemes ("son-in-law") lose their
 * unit, but their parts stay individually useful.
 *
 * Single-character tokens are dropped: "a"/"I" and stray letters left by OCR,
 * list bullets, or split contractions aren't words worth tracking. This is a
 * tokenizer-level rule, so every consumer (frequencies, examples, proper-noun
 * stats, the token count) sees it uniformly.
 *
 * Roman numerals are dropped too: chapter/section numbering ("II", "xiv",
 * "MMXXIV") is noise as vocabulary. We drop a token only when it parses as a
 * *valid* numeral, which is what keeps real words — "mid", "dim", "lid",
 * "mild", "civic" are built from Roman letters but don't parse, so they survive.
 * The lone genuine collision is "mix" (= MIX = 1009); it plus a few
 * abbreviations are allow-listed so they're never dropped.
 */

// A letter, then any letters / combining marks / apostrophes (hyphens split words).
const WORD_RE = /\p{L}[\p{L}\p{M}'’]*/gu;

// A whole, well-formed Roman numeral (1–3999), lowercase to match normalized tokens.
const ROMAN_RE = /^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/;
// Valid numerals that are also real English words / common abbreviations: keep them.
// "mix" (1009) is the only everyday word; cd/cv/mi/vi are abbreviations or rare.
const ROMAN_KEEP = new Set(["mix", "cd", "cv", "mi", "vi"]);

/** True for a token that is a stray Roman numeral (chapter/section number), not a word. */
function isRomanNumeral(word: string): boolean {
  return word.length > 0 && ROMAN_RE.test(word) && !ROMAN_KEEP.has(word);
}

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

/** Split text into a flat list of normalized word tokens (single chars dropped). */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    const word = normalizeWord(match[0]);
    if (word.length > 1 && !isRomanNumeral(word)) out.push(word);
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
    // Single-char tokens and Roman numerals aren't words, but they still occupy a
    // sentence position, so the following token is no longer sentence-initial (keeps
    // proper-noun capitalization evidence correct after a dropped "I"/"a"/"II").
    if (word.length <= 1 || isRomanNumeral(word)) {
      sentenceInitial = false;
      continue;
    }
    yield { raw: match[0], word, sentenceInitial };
    sentenceInitial = false;
  }
}
