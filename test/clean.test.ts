import { describe, expect, it } from "vitest";
import { cleanText } from "../src/text/clean.js";
import { countWords } from "../src/analyze/wordCount.js";

describe("cleanText", () => {
  it("strips parenthetical pronunciation respellings (acute stress mark)", () => {
    expect(cleanText("Achilles (a-kil´-eez): a warrior.")).toBe("Achilles : a warrior.");
    expect(cleanText("Acroneüs (ak-ro´-nee-us) was a noble.")).toBe(
      "Acroneüs  was a noble.",
    );
  });

  it("leaves ordinary parentheticals untouched", () => {
    const s = "He left (for good) and returned (much later).";
    expect(cleanText(s)).toBe(s);
  });

  it("leaves hyphenated compounds and text without the mark alone", () => {
    expect(cleanText("a well-known wine-dark sea")).toBe("a well-known wine-dark sea");
  });
});

describe("cleanText line-break de-hyphenation", () => {
  it("rejoins a word split across a line break", () => {
    expect(cleanText("geomet-\nric")).toBe("geometric");
    expect(cleanText("inde-\npendently checked")).toBe("independently checked");
  });

  it("rejoins across a soft hyphen (U+00AD)", () => {
    expect(cleanText("inde\u00AD\npendent")).toBe("independent");
  });

  it("does not merge across a paragraph break (blank line)", () => {
    expect(cleanText("well-\n\nknown")).toBe("well-\n\nknown");
  });

  it("does not merge a capitalized continuation (compound or running header)", () => {
    // genuine compound that broke at its own hyphen
    expect(cleanText("Springer-\nVerlag")).toBe("Springer-\nVerlag");
    // word fragment + page-header artifact on the next line
    expect(cleanText("holo-\nMay 2017")).toBe("holo-\nMay 2017");
  });

  it("leaves an inline hyphen (no line break) untouched", () => {
    expect(cleanText("well-known")).toBe("well-known");
  });

  it("ignores a double hyphen / dash at the break", () => {
    expect(cleanText("said--\nthen")).toBe("said--\nthen");
  });
});

describe("countWords with respellings", () => {
  it("does not surface respelling syllables as words", () => {
    const text =
      "Achilles (a-kil´-eez) fought Hector. Acastus (a-kas´-tus) ruled. Achilles fought again.";
    const words = countWords(text).map((w) => w.word);
    // junk syllables gone
    for (const junk of ["kil", "eez", "kas", "tus"]) {
      expect(words).not.toContain(junk);
    }
    // real words still counted
    expect(words).toContain("achilles");
    expect(words).toContain("fought");
  });
});

describe("countWords with line-break hyphenation", () => {
  it("counts the rejoined word, not the fragments", () => {
    const words = countWords(
      "The geomet-\nric proof was inde-\npendently checked.",
    ).map((w) => w.word);
    expect(words).toContain("geometric");
    expect(words).toContain("independently");
    for (const fragment of ["geomet", "ric", "inde", "pendently"]) {
      expect(words).not.toContain(fragment);
    }
  });
});
