import { describe, expect, it } from "vitest";
import { splitSentences } from "../src/text/sentences.js";

describe("splitSentences", () => {
  it("splits on sentence-ending punctuation and keeps the terminator", () => {
    expect(splitSentences("He ran. She walked! Did you?")).toEqual([
      "He ran.",
      "She walked!",
      "Did you?",
    ]);
  });

  it("soft-joins single line breaks within a block, hard-breaks on blank lines", () => {
    expect(splitSentences("Line one\nLine two\n\nLine three")).toEqual([
      "Line one Line two",
      "Line three",
    ]);
  });

  it("rejoins a sentence that wraps across verse line breaks", () => {
    expect(
      splitSentences("I saw great Orion,\nchasing the wild beasts\nacross the fields."),
    ).toEqual(["I saw great Orion, chasing the wild beasts across the fields."]);
  });

  it("combines line and punctuation splitting", () => {
    expect(splitSentences("First. Second.\nThird line here.")).toEqual([
      "First.",
      "Second.",
      "Third line here.",
    ]);
  });

  it("keeps a sentence without a terminator whole", () => {
    expect(splitSentences("no terminator here")).toEqual(["no terminator here"]);
  });

  it("trims whitespace and drops empty pieces", () => {
    expect(splitSentences("  spaced out.   \n\n  ")).toEqual(["spaced out."]);
  });

  it("returns an empty array for empty or whitespace-only input", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   \n\t  ")).toEqual([]);
  });

  it("does not split mid-sentence on punctuation not followed by whitespace", () => {
    // No space after the dot in "3.14" -> stays attached.
    expect(splitSentences("pi is 3.14 roughly")).toEqual(["pi is 3.14 roughly"]);
  });
});
