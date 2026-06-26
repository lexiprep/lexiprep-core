import { describe, expect, it } from "vitest";
import { lemmatize } from "../src/lemmatize/english.js";
import { countWords, analyzeBook } from "../src/analyze/wordCount.js";
import type { EpubBook } from "../src/epub/types.js";

describe("lemmatize", () => {
  it("reduces regular noun plurals and verb/adjective inflections", () => {
    expect(lemmatize("dogs")).toBe("dog");
    expect(lemmatize("running")).toBe("run");
    expect(lemmatize("happiest")).toBe("happy");
  });

  it("handles common irregulars", () => {
    expect(lemmatize("men")).toBe("man");
    expect(lemmatize("went")).toBe("go");
    expect(lemmatize("better")).toBe("good");
  });

  it("leaves base forms unchanged", () => {
    expect(lemmatize("man")).toBe("man");
    expect(lemmatize("ubiquitous")).toBe("ubiquitous");
  });
});

describe("lemmatize option in counting", () => {
  it("attaches a lemma to each entry only when asked", () => {
    expect(countWords("cats cats dog")[0]).toEqual({ word: "cats", count: 2 });
    expect(countWords("cats cats dog", { lemmatize: true })[0]).toEqual({
      word: "cats",
      count: 2,
      lemma: "cat",
    });
  });

  it("analyzeBook attaches lemmas when lemmatize is set", () => {
    const book: EpubBook = {
      metadata: { title: "T", author: "A", language: "en" },
      chapters: [{ id: "c0", href: "c0.xhtml", order: 0, text: "wolves ran" }],
    };
    const byWord = Object.fromEntries(
      analyzeBook(book, { lemmatize: true }).frequencies.map((f) => [f.word, f.lemma]),
    );
    expect(byWord["wolves"]).toBe("wolf");
    expect(byWord["ran"]).toBe("run");
  });
});
