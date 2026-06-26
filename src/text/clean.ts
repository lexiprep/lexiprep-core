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

/** Remove pronunciation respellings (and any future pre-tokenization noise). */
export function cleanText(text: string): string {
  return text.replace(PRONUNCIATION_RESPELLING, "");
}
