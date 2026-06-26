import { describe, expect, it } from "vitest";
import { ENGLISH_STOPWORDS } from "../src/stopwords/english.js";
import { countWords } from "../src/analyze/wordCount.js";

describe("ENGLISH_STOPWORDS", () => {
  it("is a non-empty set", () => {
    expect(ENGLISH_STOPWORDS).toBeInstanceOf(Set);
    expect(ENGLISH_STOPWORDS.size).toBeGreaterThan(100);
  });

  it("contains common function words", () => {
    for (const w of ["the", "a", "an", "on", "this", "and", "of", "is", "to", "with"]) {
      expect(ENGLISH_STOPWORDS.has(w)).toBe(true);
    }
  });

  it("includes contraction fragments kept whole by the tokenizer", () => {
    expect(ENGLISH_STOPWORDS.has("n't")).toBe(true);
    expect(ENGLISH_STOPWORDS.has("'s")).toBe(true);
  });

  it("does NOT contain content words a learner would want", () => {
    for (const w of ["time", "people", "first", "cat", "ship", "ocean"]) {
      expect(ENGLISH_STOPWORDS.has(w)).toBe(false);
    }
  });

  it("is all lowercase (matches the tokenizer's normalized output)", () => {
    for (const w of ENGLISH_STOPWORDS) expect(w).toBe(w.toLowerCase());
  });

  it("drives countWords' stopword filtering", () => {
    const kept = countWords("the cat sat on the warm mat", { excludeStopwords: true }).map(
      (f) => f.word,
    );
    expect(kept).toEqual(["cat", "mat", "sat", "warm"]);
    expect(kept).not.toContain("the");
    expect(kept).not.toContain("on");
  });
});
