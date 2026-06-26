export { readEpub } from "./epub/reader.js";
export { readPdf } from "./pdf/reader.js";

export type { Book, Section, BookMetadata, BookInput } from "./types.js";

/** @deprecated EPUB-specific aliases of the neutral model; use Book/Section/BookMetadata. */
export type { EpubBook, EpubChapter, EpubMetadata } from "./epub/types.js";
/** @deprecated Use {@link BookInput}. */
export type { EpubInput } from "./epub/reader.js";

export { tokenize, normalizeWord, tokenizeWithContext } from "./text/tokenize.js";
export type { TokenContext } from "./text/tokenize.js";
export { htmlToText, normalizeWhitespace } from "./text/html.js";
export { cleanText } from "./text/clean.js";
export { splitSentences } from "./text/sentences.js";

export { countWords, analyzeBook } from "./analyze/wordCount.js";
export type {
  WordFrequency,
  ProperNounClass,
  CountOptions,
  SectionRange,
  BookAnalysis,
} from "./analyze/wordCount.js";

export { ENGLISH_STOPWORDS } from "./stopwords/english.js";

export { lemmatize } from "./lemmatize/english.js";
