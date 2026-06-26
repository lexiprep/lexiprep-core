/**
 * Deprecated EPUB-specific type names, kept as aliases of the format-neutral
 * model in {@link module:../types}. New code should import {@link Book},
 * {@link Section} and {@link BookMetadata} directly.
 */
import type { Book, Section, BookMetadata } from "../types.js";

/** @deprecated Use {@link BookMetadata}. */
export type EpubMetadata = BookMetadata;

/** @deprecated Use {@link Section}. */
export type EpubChapter = Section;

/** @deprecated Use {@link Book}. */
export type EpubBook = Book;
