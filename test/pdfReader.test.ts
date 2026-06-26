import { describe, expect, it } from "vitest";
import { readPdf } from "../src/pdf/reader.js";
import { analyzeBook } from "../src/analyze/wordCount.js";
import { makePdf } from "./fixtures/makePdf.js";

describe("readPdf", () => {
  it("reads metadata and one section per page", async () => {
    const pdf = await makePdf({
      title: "The Test PDF",
      author: "Jane Doe",
      pages: [["Hello world."], ["Goodbye world."]],
    });

    const book = await readPdf(pdf);

    expect(book.metadata).toMatchObject({ title: "The Test PDF", author: "Jane Doe" });
    expect(book.sections.map((s) => s.order)).toEqual([0, 1]);
    expect(book.sections.map((s) => s.id)).toEqual(["page-1", "page-2"]);
    expect(book.sections[0]?.text).toContain("Hello world");
    expect(book.sections[1]?.text).toContain("Goodbye world");
  });

  it("feeds the analyze pipeline, with page range = section range", async () => {
    const pdf = await makePdf({
      pages: [["The fox runs. The fox jumps."], ["A dog barks at the fox."]],
    });

    const book = await readPdf(pdf);

    const all = analyzeBook(book, { excludeStopwords: true });
    const counts = Object.fromEntries(all.frequencies.map((f) => [f.word, f.count]));
    expect(counts.fox).toBe(3);
    expect(counts.dog).toBe(1);
    expect(all.sectionCount).toBe(2);

    // Restrict to the first page only.
    const firstPage = analyzeBook(book, { excludeStopwords: true, from: 0, to: 0 });
    const fp = Object.fromEntries(firstPage.frequencies.map((f) => [f.word, f.count]));
    expect(fp.fox).toBe(2);
    expect(fp.dog).toBeUndefined();
    expect(firstPage.analyzedRange).toEqual({ from: 0, to: 0 });
  });

  it("rejects a non-PDF input", async () => {
    await expect(readPdf(Buffer.from("not a pdf"))).rejects.toThrow();
  });
});
