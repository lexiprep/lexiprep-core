/**
 * Split text into sentence-like snippets for context examples.
 *
 * A blank line (paragraph/stanza boundary) is a hard break; a single line break
 * *within* a block is soft. Verse and hard-wrapped prose let one sentence run across
 * several lines, so we join those lines with a space before splitting on
 * sentence-ending punctuation (`.`/`!`/`?`). That keeps commas, semicolons and line
 * wraps *inside* one phrase, so an example reads as a full sentence rather than the
 * fragment a line break happened to leave behind. Approximate by design — enough to
 * show a word in context, not a linguistic sentence tokenizer.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const block of text.split(/\n{2,}/)) {
    // Soft-join single line breaks within the block, then split into sentences.
    const joined = block.replace(/\s*\n\s*/g, " ").trim();
    if (!joined) continue;
    // Keep the terminator attached to the preceding sentence.
    for (const piece of joined.split(/(?<=[.!?])\s+/)) {
      const sentence = piece.trim();
      if (sentence) out.push(sentence);
    }
  }
  return out;
}
