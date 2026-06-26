/**
 * Format-neutral book model shared by every reader (EPUB, PDF, ...).
 *
 * A {@link Book} is metadata plus an ordered list of {@link Section}s. A section
 * is whatever unit the source format reads in reading order: an EPUB content
 * document (a "chapter") or a single PDF page. Downstream analysis (range
 * filtering, frequency counting) operates on sections and is format-agnostic.
 */

/** Raw bytes of a book file, as accepted by the readers. */
export type BookInput = Buffer | Uint8Array | ArrayBuffer;

/** Bibliographic metadata, as far as the source format declares it. */
export interface BookMetadata {
  title?: string;
  author?: string;
  /** BCP-47 / ISO language code as declared by the book (e.g. "en", "es"). */
  language?: string;
  /** Unique identifier (ISBN, UUID, ...) when the format provides one. */
  identifier?: string;
}

/**
 * One unit of content in reading order — an EPUB content document or a PDF page.
 *
 * EPUB is reflowable and has no fixed physical pages, so a section there is a
 * single spine item (the publisher's own content-document boundary). For PDF a
 * section is one page. Range filtering is expressed over these units.
 */
export interface Section {
  /** Zero-based position in reading order. */
  order: number;
  /** Clean plain text; block elements are separated by blank lines. */
  text: string;
  /** Section title, when available (EPUB ToC; usually absent for PDF pages). */
  title?: string;
  /** Source id: EPUB manifest id, or a PDF page id like "page-12". */
  id?: string;
  /** Content-document href relative to the EPUB root (EPUB only). */
  href?: string;
}

export interface Book {
  metadata: BookMetadata;
  /** Content units in reading order (EPUB content documents, or PDF pages). */
  sections: Section[];
}
