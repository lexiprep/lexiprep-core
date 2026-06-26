/**
 * Split text into sentence-like snippets for context examples.
 *
 * Breaks on line boundaries (block/verse structure is preserved by `htmlToText`)
 * and on sentence-ending punctuation followed by whitespace. This is approximate by
 * design — enough to show a word in context, not a linguistic sentence tokenizer.
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Keep the terminator attached to the preceding sentence.
    for (const piece of trimmed.split(/(?<=[.!?])\s+/)) {
      const sentence = piece.trim();
      if (sentence) out.push(sentence);
    }
  }
  return out;
}
