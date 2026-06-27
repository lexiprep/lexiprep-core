import { describe, expect, it } from "vitest";
import { countWords, analyzeBook } from "../src/analyze/wordCount.js";
import type { Book } from "../src/types.js";

describe("countWords", () => {
  it("counts frequencies and sorts most-frequent first", () => {
    const result = countWords("the cat sat on the mat the cat");
    expect(result).toEqual([
      { word: "the", count: 3 },
      { word: "cat", count: 2 },
      { word: "mat", count: 1 },
      { word: "on", count: 1 },
      { word: "sat", count: 1 },
    ]);
  });

  it("breaks count ties alphabetically", () => {
    const result = countWords("banana apple cherry");
    expect(result.map((f) => f.word)).toEqual(["apple", "banana", "cherry"]);
  });

  it("excludes stopwords when asked", () => {
    const result = countWords("the cat sat on the mat", { excludeStopwords: true });
    expect(result.map((f) => f.word)).not.toContain("the");
    expect(result.map((f) => f.word)).not.toContain("on");
    expect(result.map((f) => f.word)).toEqual(["cat", "mat", "sat"]);
  });

  it("respects minLength", () => {
    const result = countWords("a ab abc abcd", { minLength: 3 });
    expect(result.map((f) => f.word)).toEqual(["abc", "abcd"]);
  });

  it("never counts single-character tokens", () => {
    const result = countWords("I a x cat cat o");
    expect(result).toEqual([{ word: "cat", count: 2 }]);
  });
});

describe("proper-noun detection", () => {
  const find = (text: string, word: string) =>
    countWords(text, { detectProperNouns: true }).find((f) => f.word === word);

  it("flags a name capitalized in ≥2 mid-sentence spots as confirmed", () => {
    const text = "I saw Zeus there. The mighty Zeus ruled. Everyone feared Zeus.";
    expect(find(text, "zeus")?.properNoun).toBe("confirmed");
  });

  it("flags a single mid-sentence capital as likely", () => {
    expect(find("He met Calypso once.", "calypso")?.properNoun).toBe("likely");
  });

  it("does not flag common words (lowercase mid-sentence)", () => {
    const text = "The hero met a villager. The villager waved at the hero.";
    expect(find(text, "villager")?.properNoun).toBeUndefined();
    expect(find(text, "hero")?.properNoun).toBeUndefined();
  });

  it("ignores sentence-initial capitals (no signal there)", () => {
    expect(find("Apollo spoke. Apollo left.", "apollo")?.properNoun).toBeUndefined();
  });

  it("folds possessive 's into the base name and still confirms it", () => {
    const text = "We praised Athena's wisdom, and Athena left, and great Athena smiled.";
    const a = find(text, "athena");
    expect(a?.count).toBe(3);
    expect(a?.properNoun).toBe("confirmed");
  });

  it("adds nothing when detection is off", () => {
    expect(countWords("Zeus ruled and Zeus left.").every((f) => f.properNoun === undefined)).toBe(
      true,
    );
  });
});

describe("context examples", () => {
  const find = (text: string, word: string) =>
    countWords(text, { captureExamples: true }).find((f) => f.word === word);

  it("attaches the first-occurrence sentence to every word", () => {
    const text = "The hero sailed home. The storm broke the mast.";
    expect(find(text, "sailed")?.example).toBe("The hero sailed home.");
    expect(find(text, "mast")?.example).toBe("The storm broke the mast.");
  });

  it("gives a context match to every counted word (the hard requirement)", () => {
    const text = "Odysseus met Calypso. Athena watched. Zeus, lord of all, decreed it.";
    const all = countWords(text, { captureExamples: true });
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((f) => typeof f.example === "string" && f.example.length > 0)).toBe(true);
  });

  it("pads a very short sentence with its neighbours", () => {
    const text = "The council gathered at dawn. Silence. Then the king finally spoke aloud.";
    // "silence" sits in a 1-word sentence → padded with prev + next.
    expect(find(text, "silence")?.example).toBe(
      "The council gathered at dawn. Silence. Then the king finally spoke aloud.",
    );
  });

  it("adds nothing when capture is off", () => {
    expect(countWords("A b c.").every((f) => f.example === undefined)).toBe(true);
  });
});

function book(sections: string[]): Book {
  return {
    metadata: { title: "T", author: "A", language: "en" },
    sections: sections.map((text, order) => ({
      id: `c${order}`,
      href: `c${order}.xhtml`,
      order,
      text,
    })),
  };
}

describe("analyzeBook", () => {
  it("aggregates across all chapters by default", () => {
    const analysis = analyzeBook(book(["cat cat", "dog cat dog"]));
    expect(analysis.totalTokens).toBe(5);
    expect(analysis.frequencies).toEqual([
      { word: "cat", count: 3 },
      { word: "dog", count: 2 },
    ]);
    expect(analysis.analyzedRange).toEqual({ from: 0, to: 1 });
  });

  it("restricts to a section range", () => {
    const analysis = analyzeBook(book(["alpha", "beta", "gamma"]), {
      from: 1,
      to: 2,
    });
    expect(analysis.frequencies.map((f) => f.word)).toEqual(["beta", "gamma"]);
    expect(analysis.analyzedRange).toEqual({ from: 1, to: 2 });
  });

  it("clamps an out-of-bounds range", () => {
    const analysis = analyzeBook(book(["alpha", "beta"]), {
      from: -5,
      to: 99,
    });
    expect(analysis.analyzedRange).toEqual({ from: 0, to: 1 });
    expect(analysis.uniqueWords).toBe(2);
  });

  it("reports total tokens before filtering but unique after", () => {
    const analysis = analyzeBook(book(["the the cat"]), { excludeStopwords: true });
    expect(analysis.totalTokens).toBe(3);
    expect(analysis.uniqueWords).toBe(1);
    expect(analysis.frequencies).toEqual([{ word: "cat", count: 1 }]);
  });
});
