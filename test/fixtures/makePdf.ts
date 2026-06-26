import { PDFDocument, StandardFonts } from "pdf-lib";

export interface PdfFixtureOptions {
  title?: string;
  author?: string;
  /** One inner array of text lines per page, in page order. */
  pages: string[][];
}

/** Build a minimal text-based PDF in memory for tests. Returns a Node Buffer. */
export async function makePdf(options: PdfFixtureOptions): Promise<Buffer> {
  const { title = "Test PDF", author = "Test Author", pages } = options;

  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor(author);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const lines of pages) {
    const page = doc.addPage([400, 600]);
    let y = 550;
    for (const line of lines) {
      page.drawText(line, { x: 50, y, size: 14, font });
      y -= 24;
    }
  }

  return Buffer.from(await doc.save());
}
