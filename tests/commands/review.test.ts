/**
 * Integration tests for `lyt review`.
 *
 * Covers the three modes (list / export / accept), verdict parsing,
 * NO_GO transitions, and guardrails against malformed input.
 */

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { createEmptyBoardFixture, createEmptyFixture, type Fixture } from "../helpers/fixtures.js";

const CLI = resolve(__dirname, "../../dist/cli.js");

function run(
  args: string,
  cwd: string,
  stdinInput?: string
): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("node", [CLI, ...args.split(" ").filter(Boolean)], {
    cwd,
    encoding: "utf-8",
    input: stdinInput,
  });
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 0,
  };
}

/**
 * Write a minimal issue file directly into 4-review/. Avoids going
 * through `lyt start/close` just to set up a test fixture.
 */
function writeReviewIssue(
  cwd: string,
  id: string,
  titleSuffix = "sample"
): string {
  const dir = join(cwd, ".lytos", "issue-board", "4-review");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${id}-${titleSuffix}.md`);
  writeFileSync(
    filePath,
    `---
id: ${id}
title: "Sample issue ${id}"
type: feat
priority: P2-normal
effort: S
status: 4-review
branch: "feat/${id}-sample"
depends: []
created: 2026-04-22
updated: 2026-04-22
---

# ${id} — Sample issue

## Context

Some context.

## Definition of done

- [x] Tests added
- [x] Docs aligned
`,
    "utf-8"
  );
  return filePath;
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt review", () => {
  it("exits 2 when no issue-board/ exists", () => {
    fixture = createEmptyFixture();
    const result = run("review", fixture.cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No issue-board/");
  });

  it("lists pending reviews when called with no args", () => {
    fixture = createEmptyBoardFixture();
    writeReviewIssue(fixture.cwd, "ISS-9100", "alpha");
    writeReviewIssue(fixture.cwd, "ISS-9101", "beta");

    const result = run("review", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("ISS-9100");
    expect(result.stderr).toContain("ISS-9101");
    expect(result.stderr).toContain("pending");
  });

  it("prints the audit prompt when an issue ID is given", () => {
    fixture = createEmptyBoardFixture();
    writeReviewIssue(fixture.cwd, "ISS-9200");

    const result = run("review ISS-9200", fixture.cwd);
    expect(result.exitCode).toBe(0);
    // Each of the 9 prompt sections should appear
    expect(result.stdout).toContain("## 1 — Your role");
    expect(result.stdout).toContain("## 2 — What Lytos is");
    expect(result.stdout).toContain("## 3 — Project manifest excerpt");
    expect(result.stdout).toContain("## 4 — Quality rules");
    expect(result.stdout).toContain("## 5 — Review skill");
    expect(result.stdout).toContain("## 6 — The issue being audited (ISS-9200)");
    expect(result.stdout).toContain("## 7 — Implementation diff");
    expect(result.stdout).toContain("## 8 — Expected output format");
    expect(result.stdout).toContain("## 9 — Exit instructions");
    // The role header must tell the auditor they are not the implementer
    expect(result.stdout).toContain("You did NOT implement this issue");
  });

  it("exits 2 when the issue ID is not in 4-review/", () => {
    fixture = createEmptyBoardFixture();

    const result = run("review ISS-0001", fixture.cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("not found in 4-review/");
  });

  it("--accept with a GO verdict appends the audit and keeps the file in 4-review/", () => {
    fixture = createEmptyBoardFixture();
    const issueFile = writeReviewIssue(fixture.cwd, "ISS-9300");

    const auditPath = join(fixture.cwd, "audit.md");
    writeFileSync(
      auditPath,
      `## Audit — 2026-04-22

**Verdict:** GO

### Checks
- [x] Tests pass
- [x] Rules respected

### Notes
Looks clean.
`,
      "utf-8"
    );

    const result = run(`review ISS-9300 --accept ${auditPath}`, fixture.cwd);
    expect(result.exitCode).toBe(0);

    // File is still at its original location
    expect(existsSync(issueFile)).toBe(true);
    // Audit block appended
    const content = readFileSync(issueFile, "utf-8");
    expect(content).toContain("## Audit — 2026-04-22");
    expect(content).toContain("**Verdict:** GO");
    expect(result.stderr).toContain("Audit recorded: GO");
  });

  it("--accept with a NO_GO verdict moves the issue back to 3-in-progress/", () => {
    fixture = createEmptyBoardFixture();
    const issueFile = writeReviewIssue(fixture.cwd, "ISS-9400");

    const auditPath = join(fixture.cwd, "audit.md");
    writeFileSync(
      auditPath,
      `## Audit — 2026-04-22

**Verdict:** NO_GO

### Checks
- [ ] Tests pass
- [ ] Docs aligned

### Notes
Several gaps spotted.

### To fix before next review
- [ ] Add test for the new flag
- [ ] Update README commands table
`,
      "utf-8"
    );

    const result = run(`review ISS-9400 --accept ${auditPath}`, fixture.cwd);
    expect(result.exitCode).toBe(0);

    // Original location gone
    expect(existsSync(issueFile)).toBe(false);
    // New location under 3-in-progress
    const newPath = join(
      fixture.cwd,
      ".lytos",
      "issue-board",
      "3-in-progress",
      "ISS-9400-sample.md"
    );
    expect(existsSync(newPath)).toBe(true);

    const content = readFileSync(newPath, "utf-8");
    // Frontmatter re-tagged to 3-in-progress
    expect(content).toMatch(/^status:\s*3-in-progress\s*$/m);
    // Audit block preserved in the body
    expect(content).toContain("## Audit — 2026-04-22");
    expect(content).toContain("**Verdict:** NO_GO");
    expect(content).toContain("Add test for the new flag");

    expect(result.stderr).toContain("Audit recorded: NO_GO");
  });

  it("--accept exits 2 when no verdict line is present", () => {
    fixture = createEmptyBoardFixture();
    writeReviewIssue(fixture.cwd, "ISS-9500");

    const auditPath = join(fixture.cwd, "audit.md");
    writeFileSync(
      auditPath,
      `## Audit — 2026-04-22

I read the diff and it looks fine.
`,
      "utf-8"
    );

    const result = run(`review ISS-9500 --accept ${auditPath}`, fixture.cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Verdict");
  });

  it("--accept - reads the audit from stdin", () => {
    fixture = createEmptyBoardFixture();
    const issueFile = writeReviewIssue(fixture.cwd, "ISS-9600");

    const block = `## Audit — 2026-04-22\n\n**Verdict:** GO\n\n### Checks\n- [x] ok\n`;
    const result = run(`review ISS-9600 --accept -`, fixture.cwd, block);
    expect(result.exitCode).toBe(0);

    const content = readFileSync(issueFile, "utf-8");
    expect(content).toContain("**Verdict:** GO");
  });
});
