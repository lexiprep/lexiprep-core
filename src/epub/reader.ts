import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { parse as parseHtml } from "node-html-parser";
import { htmlToText } from "../text/html.js";
import type { EpubBook, EpubChapter, EpubMetadata } from "./types.js";

const CONTAINER_PATH = "META-INF/container.xml";

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
});

export type EpubInput = Buffer | Uint8Array | ArrayBuffer;

/** fast-xml-parser produces untyped trees; this is our boundary type for them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlNode = Record<string, any>;

/**
 * Parse an EPUB (2 or 3) into a normalized {@link EpubBook}: metadata plus the
 * content documents in reading order, each reduced to clean plain text.
 *
 * DRM-protected books are not supported.
 */
export async function readEpub(input: EpubInput): Promise<EpubBook> {
  const zip = await JSZip.loadAsync(input);
  const readFile = makeFileReader(zip);

  const containerXml = await readFile(CONTAINER_PATH);
  if (containerXml === null) {
    throw new Error(`Invalid EPUB: missing ${CONTAINER_PATH}`);
  }
  const opfPath = findOpfPath(containerXml);
  const opfXml = await readFile(opfPath);
  if (opfXml === null) {
    throw new Error(`Invalid EPUB: OPF not found at ${opfPath}`);
  }

  const pkg = xml.parse(opfXml).package;
  if (!pkg) throw new Error("Invalid EPUB: OPF has no <package> root");

  const metadata = readMetadata(pkg.metadata ?? {});
  const manifest = readManifest(pkg.manifest ?? {}, opfPath);
  const spineIds = readSpine(pkg.spine ?? {});

  const titles = await resolveTitles(pkg, manifest, readFile);

  const chapters: EpubChapter[] = [];
  let order = 0;
  for (const id of spineIds) {
    const item = manifest.get(id);
    if (!item || !isContentDocument(item)) continue;

    const html = await readFile(item.href);
    if (html === null) continue;

    chapters.push({
      id,
      href: item.href,
      order: order++,
      title: titles.get(item.href),
      text: htmlToText(html),
    });
  }

  return { metadata, chapters };
}

// --- OPF / container ---------------------------------------------------------

function findOpfPath(containerXml: string): string {
  const container = xml.parse(containerXml).container;
  const rootfile = toArray(container?.rootfiles?.rootfile)[0];
  const fullPath = rootfile?.["@_full-path"];
  if (!fullPath || typeof fullPath !== "string") {
    throw new Error("Invalid EPUB: no rootfile full-path in container.xml");
  }
  return fullPath;
}

function readMetadata(meta: Record<string, unknown>): EpubMetadata {
  return {
    title: firstText(meta, ["dc:title", "title"]),
    author: firstText(meta, ["dc:creator", "creator"]),
    language: firstText(meta, ["dc:language", "language"]),
    identifier: firstText(meta, ["dc:identifier", "identifier"]),
  };
}

interface ManifestItem {
  id: string;
  /** Resolved zip path. */
  href: string;
  mediaType: string;
  properties: string;
}

function readManifest(
  manifestNode: XmlNode | undefined,
  opfPath: string,
): Map<string, ManifestItem> {
  const items = new Map<string, ManifestItem>();
  for (const raw of toArray<XmlNode>(manifestNode?.item)) {
    const id = raw["@_id"];
    const href = raw["@_href"];
    if (typeof id !== "string" || typeof href !== "string") continue;
    items.set(id, {
      id,
      href: resolveHref(opfPath, href),
      mediaType: String(raw["@_media-type"] ?? ""),
      properties: String(raw["@_properties"] ?? ""),
    });
  }
  return items;
}

function readSpine(spineNode: XmlNode | undefined): string[] {
  return toArray<XmlNode>(spineNode?.itemref)
    .map((ref) => ref["@_idref"])
    .filter((id): id is string => typeof id === "string");
}

function isContentDocument(item: ManifestItem): boolean {
  return (
    item.mediaType === "application/xhtml+xml" ||
    item.mediaType === "text/html" ||
    /\.x?html?$/i.test(item.href)
  );
}

// --- Table of contents (best-effort title resolution) ------------------------

async function resolveTitles(
  pkg: Record<string, unknown>,
  manifest: Map<string, ManifestItem>,
  readFile: (path: string) => Promise<string | null>,
): Promise<Map<string, string>> {
  try {
    // EPUB 3: manifest item with properties="nav".
    const navItem = [...manifest.values()].find((i) =>
      i.properties.split(/\s+/).includes("nav"),
    );
    if (navItem) {
      const navHtml = await readFile(navItem.href);
      if (navHtml) return titlesFromNav(navHtml, navItem.href);
    }

    // EPUB 2: NCX referenced by spine[toc] or by media-type.
    const spine = (pkg.spine ?? {}) as Record<string, unknown>;
    const ncxId = spine["@_toc"];
    const ncxItem =
      (typeof ncxId === "string" ? manifest.get(ncxId) : undefined) ??
      [...manifest.values()].find((i) => i.mediaType === "application/x-dtbncx+xml");
    if (ncxItem) {
      const ncxXml = await readFile(ncxItem.href);
      if (ncxXml) return titlesFromNcx(ncxXml, ncxItem.href);
    }
  } catch {
    // Titles are optional; never fail the read over a malformed ToC.
  }
  return new Map();
}

function titlesFromNav(navHtml: string, navHref: string): Map<string, string> {
  const titles = new Map<string, string>();
  const root = parseHtml(navHtml);
  const nav =
    root.querySelector('nav[epub\\:type="toc"]') ??
    root.querySelector("nav") ??
    root;
  for (const a of nav.querySelectorAll("a")) {
    const href = a.getAttribute("href");
    const text = a.text.trim();
    if (!href || !text) continue;
    const target = resolveHref(navHref, href);
    if (!titles.has(target)) titles.set(target, text);
  }
  return titles;
}

function titlesFromNcx(ncxXml: string, ncxHref: string): Map<string, string> {
  const titles = new Map<string, string>();
  const navMap: XmlNode | undefined = xml.parse(ncxXml)?.ncx?.navMap;
  const walk = (points: XmlNode | XmlNode[] | undefined): void => {
    for (const p of toArray<XmlNode>(points)) {
      const label = textOf(p?.navLabel?.text)?.trim();
      const src = p?.content?.["@_src"];
      if (label && typeof src === "string") {
        const target = resolveHref(ncxHref, src);
        if (!titles.has(target)) titles.set(target, label);
      }
      if (p?.navPoint) walk(p.navPoint);
    }
  };
  walk(navMap?.navPoint);
  return titles;
}

// --- helpers -----------------------------------------------------------------

function makeFileReader(zip: JSZip): (path: string) => Promise<string | null> {
  const byLower = new Map<string, JSZip.JSZipObject>();
  zip.forEach((relativePath, file) => {
    if (!file.dir) byLower.set(relativePath.toLowerCase(), file);
  });
  return async (path) => {
    const file = zip.file(path) ?? byLower.get(path.toLowerCase()) ?? null;
    return file ? file.async("string") : null;
  };
}

function dirname(p: string): string {
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
}

/** Resolve `href` relative to `baseFile`, stripping fragment/query and `../`. */
function resolveHref(baseFile: string, href: string): string {
  const clean = decodeURIComponent(href.split("#")[0]!.split("?")[0]!);
  const base = dirname(baseFile);
  const joined = base ? `${base}/${clean}` : clean;
  const parts: string[] = [];
  for (const seg of joined.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function textOf(node: unknown): string | undefined {
  if (node === undefined || node === null) return undefined;
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (typeof node === "object" && "#text" in (node as object)) {
    const t = (node as Record<string, unknown>)["#text"];
    return t === undefined || t === null ? undefined : String(t);
  }
  return undefined;
}

function firstText(meta: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (!(key in meta)) continue;
    for (const item of toArray(meta[key])) {
      const t = textOf(item)?.trim();
      if (t) return t;
    }
  }
  return undefined;
}
