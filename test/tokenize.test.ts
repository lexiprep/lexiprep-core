import { describe, expect, it } from "vitest";
import { tokenize, normalizeWord } from "../src/text/tokenize.js";

describe("normalizeWord", () => {
  it("lowercases", () => {
    expect(normalizeWord("Hello")).toBe("hello");
    expect(normalizeWord("WORLD")).toBe("world");
  });

  it("unifies curly and straight apostrophes", () => {
    expect(normalizeWord("don’t")).toBe("don't");
    expect(normalizeWord("don't")).toBe("don't");
  });

  it("strips leading/trailing apostrophes and hyphens", () => {
    expect(normalizeWord("'word'")).toBe("word");
    expect(normalizeWord("-word-")).toBe("word");
  });

  it("drops the possessive/contraction 's clitic", () => {
    expect(normalizeWord("Athena's")).toBe("athena");
    expect(normalizeWord("ship's")).toBe("ship");
    expect(normalizeWord("it’s")).toBe("it"); // contraction collapses to stem (stopword)
    expect(normalizeWord("dogs'")).toBe("dogs"); // plural possessive: bare trailing apostrophe
    expect(normalizeWord("boss")).toBe("boss"); // trailing "ss" is not the clitic
  });
});

describe("tokenize", () => {
  it("splits on whitespace and punctuation", () => {
    expect(tokenize("The quick, brown fox.")).toEqual(["the", "quick", "brown", "fox"]);
  });

  it("keeps contractions whole and case-folded (but drops a trailing 's)", () => {
    expect(tokenize("Don't, it’s O'Brien!")).toEqual(["don't", "it", "o'brien"]);
  });

  it("splits hyphenated words into their parts", () => {
    expect(tokenize("a well-known co-operate test")).toEqual([
      "well",
      "known",
      "co",
      "operate",
      "test",
    ]);
    // Translator compounds / epithets break into real, level-tagged words.
    expect(tokenize("the wine-dark sea, bright-eyed Athena")).toEqual([
      "the",
      "wine",
      "dark",
      "sea",
      "bright",
      "eyed",
      "athena",
    ]);
    // Multi-hyphen compounds split fully; an apostrophe inside a part is kept.
    expect(tokenize("ne'er-do-well son-in-law")).toEqual([
      "ne'er",
      "do",
      "well",
      "son",
      "in",
      "law",
    ]);
  });

  it("drops digits and standalone numbers", () => {
    expect(tokenize("I read 3 books in 2024")).toEqual(["read", "books", "in"]);
  });

  it("drops single-character tokens (a, I, stray letters)", () => {
    expect(tokenize("I have a dog")).toEqual(["have", "dog"]);
    // OCR/list debris: lone letters and split-off clitics are not words.
    expect(tokenize("x y go z")).toEqual(["go"]);
    expect(tokenize("a")).toEqual([]);
  });

  it("handles accented letters (Spanish-ready)", () => {
    expect(tokenize("el niño corrió rápido")).toEqual(["el", "niño", "corrió", "rápido"]);
  });

  it("returns an empty array for empty input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   \n  ")).toEqual([]);
  });
});
