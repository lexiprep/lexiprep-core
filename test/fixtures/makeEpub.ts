import JSZip from "jszip";

export interface FixtureChapter {
  /** File name inside OEBPS, e.g. "ch1.xhtml". */
  file: string;
  title: string;
  /** Inner HTML for the <body>. */
  body: string;
}

export interface FixtureOptions {
  title?: string;
  author?: string;
  language?: string;
  identifier?: string;
  chapters: FixtureChapter[];
  /** Emit an EPUB3 nav document instead of an EPUB2 NCX. Default false (NCX). */
  useNav?: boolean;
}

/** Build a minimal but valid EPUB in memory for tests. Returns a Node Buffer. */
export async function makeEpub(options: FixtureOptions): Promise<Buffer> {
  const {
    title = "Test Book",
    author = "Test Author",
    language = "en",
    identifier = "urn:uuid:test-0001",
    chapters,
    useNav = false,
  } = options;

  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  zip.file("META-INF/container.xml", CONTAINER);

  for (const ch of chapters) {
    zip.file(`OEBPS/${ch.file}`, chapterDoc(ch.title, ch.body));
  }

  const tocId = useNav ? "nav" : "ncx";
  const tocManifest = useNav
    ? `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`
    : `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`;

  if (useNav) {
    zip.file("OEBPS/nav.xhtml", navDoc(chapters));
  } else {
    zip.file("OEBPS/toc.ncx", ncxDoc(title, chapters));
  }

  const manifestItems = chapters
    .map(
      (ch, i) =>
        `<item id="ch${i}" href="${ch.file}" media-type="application/xhtml+xml"/>`,
    )
    .join("\n    ");
  const spineItems = chapters.map((_, i) => `<itemref idref="ch${i}"/>`).join("\n    ");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${author}</dc:creator>
    <dc:language>${language}</dc:language>
    <dc:identifier id="bookid">${identifier}</dc:identifier>
  </metadata>
  <manifest>
    ${tocManifest}
    ${manifestItems}
  </manifest>
  <spine toc="${useNav ? "" : "ncx"}">
    ${spineItems}
  </spine>
</package>`,
  );

  const data = await zip.generateAsync({ type: "nodebuffer" });
  return data;
}

const CONTAINER = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

function chapterDoc(title: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>${title}</title></head>
  <body>${body}</body>
</html>`;
}

function navDoc(chapters: FixtureChapter[]): string {
  const items = chapters
    .map((ch) => `<li><a href="${ch.file}">${ch.title}</a></li>`)
    .join("\n        ");
  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <body>
    <nav epub:type="toc">
      <ol>
        ${items}
      </ol>
    </nav>
  </body>
</html>`;
}

function ncxDoc(title: string, chapters: FixtureChapter[]): string {
  const points = chapters
    .map(
      (ch, i) =>
        `<navPoint id="np${i}" playOrder="${i + 1}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="${ch.file}"/>
    </navPoint>`,
    )
    .join("\n    ");
  return `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head/>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    ${points}
  </navMap>
</ncx>`;
}
