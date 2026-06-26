import { parse } from "node-html-parser";

/**
 * Convert an XHTML/HTML content document into clean plain text.
 *
 * Block-level structure is preserved as line breaks so that downstream sentence
 * detection (for in-context examples) has something to work with, while scripts,
 * styles and markup are dropped.
 */
export function htmlToText(html: string): string {
  const root = parse(html, {
    // keep raw text of these elements out of the output entirely
    blockTextElements: { script: false, style: false, noscript: false, pre: true },
  });

  for (const node of root.querySelectorAll("script, style, noscript")) {
    node.remove();
  }

  // `structuredText` inserts newlines at block boundaries.
  return normalizeWhitespace(root.structuredText);
}

/** Collapse runs of spaces/tabs, trim each line, and cap consecutive blank lines. */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
