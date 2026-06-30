/**
 * Text cleaning applied to extracted book text before tokenization.
 *
 * Pronunciation respellings: reference works (glossaries, "pronunciation keys")
 * spell out names phonetically in parentheses, syllable-hyphenated, with an acute
 * accent ´ (U+00B4) marking the stressed syllable — e.g. "Achilles (a-kil´-eez)",
 * "Acroneüs (ak-ro´-nee-us)". Tokenizing these yields nothing but junk syllables
 * ("kil", "eez", "tus", "nee"), none of them real words, which then pollute the
 * frequency list. Strip the whole parenthetical. The acute stress mark never
 * appears inside ordinary prose parentheticals, so the match is precise — and it
 * generalizes to any book using this common typographic convention.
 */
const PRONUNCIATION_RESPELLING = /\([^)]*´[^)]*\)/g;

/**
 * Line-break hyphenation: PDFs (and occasionally EPUBs) break a word at the
 * right margin with a hyphen — "geomet-\nric", "inde-\npendently". Extraction
 * keeps the hyphen and the newline, and since the tokenizer treats hyphens as
 * word boundaries the fragments would otherwise surface as two junk words
 * ("geomet" + "ric"). Rejoin them: a letter, a hyphen (ordinary U+002D or the
 * soft hyphen U+00AD), a single newline, then a *lowercase* letter — drop the
 * hyphen and the break, gluing the fragments back together.
 *
 * The lowercase continuation is the discriminator. A word resumed across a line
 * break continues in lowercase ("...pendently"); a *capitalized* continuation
 * instead marks a genuine hyphenated compound that happened to break at its own
 * hyphen ("Springer-\nVerlag", "Prentice-\nHall") or a running header dropped
 * mid-word ("holo-\nMay …") — neither should merge, and leaving the hyphen in
 * place lets the tokenizer split it the way it already does. (Measured on a real
 * technical PDF: 897 of 917 breaks were lowercase soft hyphens; all 20 uppercase
 * ones were compounds or page-header artifacts that must not be merged.)
 *
 * A single newline only: "well-\n\nknown" is a paragraph break, not a soft
 * hyphen, and is left intact.
 */
const LINE_BREAK_HYPHEN = /(\p{L})[-\u00AD]\n(\p{Ll})/gu;

/** Remove pronunciation respellings and rejoin line-break-hyphenated words. */
export function cleanText(text: string): string {
  return text
    .replace(PRONUNCIATION_RESPELLING, "")
    .replace(LINE_BREAK_HYPHEN, "$1$2");
}
