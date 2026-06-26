import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { makeEpub } from "./fixtures/makeEpub.js";

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(ROOT, "src", "cli.ts");

/** Run the CLI through tsx the same way `pnpm analyze` does, capturing stdout. */
function cli(args: string[]) {
  return run(process.execPath, ["--import", "tsx", CLI, ...args], { cwd: ROOT });
}

let dir: string;
let epubPath: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "lexiprep-cli-"));
  epubPath = join(dir, "probe.epub");
  const epub = await makeEpub({
    title: "Probe Book",
    author: "Nobody",
    chapters: [
      { file: "ch1.xhtml", title: "One", body: "<p>The fox runs. The fox jumps.</p>" },
    ],
  });
  await writeFile(epubPath, epub);
}, 30_000);

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("CLI", () => {
  it("prints a human-readable report with the title and top words", async () => {
    const { stdout } = await cli([epubPath, "--top", "3"]);
    expect(stdout).toContain("Probe Book");
    expect(stdout).toContain("by Nobody");
    // "fox" occurs twice and stopwords are filtered, so it heads the list.
    expect(stdout).toMatch(/fox\s+2/);
  }, 30_000);

  it("emits valid JSON with --json", async () => {
    const { stdout } = await cli([epubPath, "--json"]);
    const data = JSON.parse(stdout) as {
      uniqueWords: number;
      totalTokens: number;
      frequencies: { word: string; count: number }[];
    };
    expect(data.totalTokens).toBeGreaterThan(0);
    expect(Array.isArray(data.frequencies)).toBe(true);
    expect(data.frequencies.find((f) => f.word === "fox")?.count).toBe(2);
  }, 30_000);

  it("prints usage and exits 0 with --help", async () => {
    const { stdout } = await cli(["--help"]);
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("lexiprep-analyze");
  }, 30_000);

  it("prints usage when given no arguments (no crash)", async () => {
    const { stdout } = await cli([]);
    expect(stdout).toContain("Usage:");
  }, 30_000);
});
