/** Bibliographic metadata pulled from the EPUB's OPF `<metadata>` block. */
export interface EpubMetadata {
  title?: string;
  author?: string;
  /** BCP-47 / ISO language code as declared by the book (e.g. "en", "es"). */
  language?: string;
  /** The book's unique identifier (ISBN, UUID, ...) as declared in the OPF. */
  identifier?: string;
}

/**
 * One content document in reading order.
 *
 * EPUB is reflowable and has no fixed physical pages, so a "chapter" here is a
 * single spine item (the publisher's own content-document boundary). Page-range
 * filtering in lexiprep is expressed over these units. See docs/specs.
 */
export interface EpubChapter {
  /** Manifest id of the content document. */
  id: string;
  /** Href of the content document, relative to the EPUB root (zip path). */
  href: string;
  /** Zero-based position in the reading order (spine). */
  order: number;
  /** Chapter title resolved from the table of contents, when available. */
  title?: string;
  /** Clean plain text; block elements are separated by blank lines. */
  text: string;
}

export interface EpubBook {
  metadata: EpubMetadata;
  /** Content documents in spine (reading) order. */
  chapters: EpubChapter[];
}
