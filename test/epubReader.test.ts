import { describe, expect, it } from "vitest";
import { readEpub } from "../src/epub/reader.js";
import { analyzeBook } from "../src/analyze/wordCount.js";
import { makeEpub } from "./fixtures/makeEpub.js";

describe("readEpub", () => {
  it("reads metadata and chapters in spine order", async () => {
    const epub = await makeEpub({
      title: "The Test",
      author: "Jane Doe",
      language: "en",
      chapters: [
        { file: "ch1.xhtml", title: "Chapter One", body: "<p>Hello world.</p>" },
        { file: "ch2.xhtml", title: "Chapter Two", body: "<p>Goodbye world.</p>" },
      ],
    });

    const book = await readEpub(epub);

    expect(book.metadata).toMatchObject({
      title: "The Test",
      author: "Jane Doe",
      language: "en",
    });
    expect(book.sections.map((c) => c.order)).toEqual([0, 1]);
    expect(book.sections[0]?.text).toContain("Hello world");
    expect(book.sections[1]?.text).toContain("Goodbye world");
  });

  it("strips markup, scripts and styles from chapter text", async () => {
    const epub = await makeEpub({
      chapters: [
        {
          file: "ch1.xhtml",
          title: "C1",
          body: `<style>.x{color:red}</style>
                 <p>Visible <strong>text</strong> here.</p>
                 <script>var hidden = 'nope';</script>`,
        },
      ],
    });

    const book = await readEpub(epub);
    const text = book.sections[0]?.text ?? "";
    expect(text).toContain("Visible text here.");
    expect(text).not.toContain("color");
    expect(text).not.toContain("hidden");
    expect(text).not.toContain("nope");
  });

  it("resolves chapter titles from an EPUB2 NCX", async () => {
    const epub = await makeEpub({
      useNav: false,
      chapters: [{ file: "ch1.xhtml", title: "The Beginning", body: "<p>x</p>" }],
    });
    const book = await readEpub(epub);
    expect(book.sections[0]?.title).toBe("The Beginning");
  });

  it("resolves chapter titles from an EPUB3 nav document", async () => {
    const epub = await makeEpub({
      useNav: true,
      chapters: [{ file: "ch1.xhtml", title: "The Beginning", body: "<p>x</p>" }],
    });
    const book = await readEpub(epub);
    expect(book.sections[0]?.title).toBe("The Beginning");
  });

  it("feeds the analyze pipeline end-to-end", async () => {
    const epub = await makeEpub({
      chapters: [
        { file: "ch1.xhtml", title: "C1", body: "<p>The fox runs. The fox jumps.</p>" },
        { file: "ch2.xhtml", title: "C2", body: "<p>A dog barks at the fox.</p>" },
      ],
    });

    const book = await readEpub(epub);
    const analysis = analyzeBook(book, { excludeStopwords: true });

    const counts = Object.fromEntries(
      analysis.frequencies.map((f) => [f.word, f.count]),
    );
    expect(counts.fox).toBe(3);
    expect(counts.runs).toBe(1);
    expect(counts.dog).toBe(1);
    // stopwords removed
    expect(counts.the).toBeUndefined();
    expect(counts.a).toBeUndefined();
    expect(counts.at).toBeUndefined();
  });

  it("rejects a non-EPUB input", async () => {
    await expect(readEpub(Buffer.from("not a zip"))).rejects.toThrow();
  });
});
