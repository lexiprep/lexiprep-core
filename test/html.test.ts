import { describe, expect, it } from "vitest";
import { htmlToText, normalizeWhitespace } from "../src/text/html.js";

describe("normalizeWhitespace", () => {
  it("collapses runs of spaces and tabs to a single space", () => {
    expect(normalizeWhitespace("a   b\t\tc")).toBe("a b c");
  });

  it("normalizes CRLF and CR to LF", () => {
    expect(normalizeWhitespace("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("trims each line", () => {
    expect(normalizeWhitespace("  hello  \n  world  ")).toBe("hello\nworld");
  });

  it("caps three or more consecutive blank lines at one blank line", () => {
    expect(normalizeWhitespace("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims leading and trailing whitespace overall", () => {
    expect(normalizeWhitespace("\n\n  text  \n\n")).toBe("text");
  });
});

describe("htmlToText", () => {
  it("extracts text and preserves block boundaries as line breaks", () => {
    expect(htmlToText("<p>Hello world.</p><p>Goodbye world.</p>").split("\n")).toEqual([
      "Hello world.",
      "Goodbye world.",
    ]);
  });

  it("drops <script> content entirely", () => {
    const out = htmlToText("<p>Visible</p><script>var secret = 1;</script>");
    expect(out).toContain("Visible");
    expect(out).not.toContain("secret");
  });

  it("drops <style> and <noscript> content", () => {
    const out = htmlToText(
      "<style>.x{color:red}</style><p>Body</p><noscript>enable js</noscript>",
    );
    expect(out).toBe("Body");
  });

  it("keeps inline text together within a block", () => {
    expect(htmlToText("<p>a <em>well-known</em> phrase</p>")).toBe("a well-known phrase");
  });

  it("returns an empty string for markup with no text", () => {
    expect(htmlToText("<div></div>")).toBe("");
  });
});
