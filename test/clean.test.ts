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
})
