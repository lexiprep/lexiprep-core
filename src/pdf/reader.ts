import { extractText, getDocumentProxy, getMeta } from "unpdf";
import { normalizeWhitespace } from "../text/html.js";
import type { Book, BookInput, BookMetadata, Section } from "../types.js";

/**
 * Parse a PDF into a normalized {@link Book}: metadata plus one {@link Section}
 * per page, in page order, each reduced to clean plain text.
 *
 * Backed by `unpdf` (a serverless build of Mozilla's PDF.js), so it runs in
 * Node, edge runtimes and the browser. Text-based PDFs only — scanned/image
 * PDFs carry no extractable text and yield empty sections.
 */
export async function readPdf(input: BookInput): Promise<Book> {
  const pdf = await getDocumentProxy(toUint8Array(input));

  // mergePages: false -> one entry per page, preserving page boundaries so the
  // range filter downstream becomes a genuine page filter.
  const { text } = await extractText(pdf, { mergePages: false });
  const metadata = await readMetadata(pdf);

  const sections: Section[] = text.map((pageText, order) => ({
    order,
    id: `page-${order + 1}`,
    text: normalizeWhitespace(pageText),
  }));

  return { metadata, sections };
}

async function readMetadata(
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>,
): Promise<BookMetadata> {
  const { info } = await getMeta(pdf);
  return {
    title: str(info.Title),
    author: str(info.Author),
    language: str(info.Language),
    // PDFs carry no stable bibliographic identifier in their Info dictionary.
    identifier: undefined,
  };
}

function toUint8Array(input: BookInput): Uint8Array {
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  // pdf.js rejects a Node Buffer specifically, so re-wrap as a plain Uint8Array
  // view over the same bytes (honouring the source view's offset/length).
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
