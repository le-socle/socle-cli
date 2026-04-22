/**
 * Integration tests for `lyt archive`.
 *
 * Covers: default 7-day threshold, --older-than, --all, --dry-run,
 * invalid --older-than, empty 5-done/, and the guarantee that
 * `lyt board` no longer moves files.
 */

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import {
  createEmptyBoardFixture,
  createEmptyFixture,
  type Fixture,
} from "../helpers/fixtures.js";

const CLI = resolve(__dirname, "../../dist/cli.js");

function run(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("node", [CLI, ...args.split(" ").filter(Boolean)], {
    cwd,
    encoding: "utf-8",
  });
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 0,
  };
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function writeDoneIssue(cwd: string, id: string, updatedISO: string): void {
  const board = join(cwd, ".lytos", "issue-board", "5-done");
  writeFileSync(
    join(board, `${id}-sample.md`),
    `---
id: ${id}
title: "Sample closed issue"
type: chore
priority: P2-normal
effort: XS
status: 5-done
depends: []
created: ${updatedISO}
updated: ${updatedISO}
---

# ${id} — Sample closed issue
`
  );
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt archive", () => {
  it("exits 2 when no issue-board/ directory exists", () => {
    fixture = createEmptyFixture();
    const result = run("archive", fixture.cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No issue-board/");
  });

  it("default 7-day threshold: archives old issues, keeps recent ones", () => {
    fixture = createEmptyBoardFixture();
    writeDoneIssue(fixture.cwd, "ISS-9001", daysAgoISO(10)); // old
    writeDoneIssue(fixture.cwd, "ISS-9002", daysAgoISO(2)); // recent

    const result = run("archive", fixture.cwd);
    expect(result.exitCode).toBe(0);

    const doneDir = join(fixture.cwd, ".lytos", "issue-board", "5-done");
    const archiveDir = join(fixture.cwd, ".lytos", "issue-board", "archive");

    const done = readdirSync(doneDir);
    expect(done).not.toContain("ISS-9001-sample.md");
    expect(done).toContain("ISS-9002-sample.md");

    // Archive index updated, old issue present, recent one absent
    const index = readFileSync(join(archiveDir, "INDEX.md"), "utf-8");
    expect(index).toContain("ISS-9001");
    expect(index).not.toContain("ISS-9002");
  });

  it("--all archives everything regardless of age", () => {
    fixture = createEmptyBoardFixture();
    writeDoneIssue(fixture.cwd, "ISS-9003", daysAgoISO(0)); // today

    const result = run("archive --all", fixture.cwd);
    expect(result.exitCode).toBe(0);

    const doneDir = join(fixture.cwd, ".lytos", "issue-board", "5-done");
    expect(readdirSync(doneDir)).not.toContain("ISS-9003-sample.md");
  });

  it("--older-than 30d keeps issues younger than 30 days", () => {
    fixture = createEmptyBoardFixture();
    writeDoneIssue(fixture.cwd, "ISS-9004", daysAgoISO(10)); // 10d old, under threshold

    const result = run("archive --older-than 30d", fixture.cwd);
    expect(result.exitCode).toBe(0);

    const doneDir = join(fixture.cwd, ".lytos", "issue-board", "5-done");
    expect(readdirSync(doneDir)).toContain("ISS-9004-sample.md");
    expect(result.stderr).toContain("too recent");
  });

  it("--dry-run reports moves without touching the filesystem", () => {
    fixture = createEmptyBoardFixture();
    writeDoneIssue(fixture.cwd, "ISS-9005", daysAgoISO(30));

    const result = run("archive --dry-run", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("ISS-9005");

    const doneDir = join(fixture.cwd, ".lytos", "issue-board", "5-done");
    expect(readdirSync(doneDir)).toContain("ISS-9005-sample.md");

    const archiveDir = join(fixture.cwd, ".lytos", "issue-board", "archive");
    expect(existsSync(join(archiveDir, "INDEX.md"))).toBe(false);
  });

  it("reports nothing to archive when 5-done/ is empty", () => {
    fixture = createEmptyBoardFixture();
    const result = run("archive", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Nothing in 5-done/");
  });

  it("rejects an invalid --older-than value with exit 2", () => {
    fixture = createEmptyBoardFixture();
    const result = run("archive --older-than 7h", fixture.cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("Invalid --older-than");
  });

  it("lyt board no longer archives issues from 5-done/", () => {
    fixture = createEmptyBoardFixture();
    writeDoneIssue(fixture.cwd, "ISS-9006", daysAgoISO(30));

    const result = run("board", fixture.cwd);
    expect(result.exitCode).toBe(0);

    // Issue must still be in 5-done/ after lyt board
    const doneDir = join(fixture.cwd, ".lytos", "issue-board", "5-done");
    expect(readdirSync(doneDir)).toContain("ISS-9006-sample.md");
  });

  it("regenerates BOARD.md after archiving so archive counts stay in sync (ISS-0051)", () => {
    fixture = createEmptyBoardFixture();
    writeDoneIssue(fixture.cwd, "ISS-9100", daysAgoISO(30));

    const result = run("archive --all", fixture.cwd);
    expect(result.exitCode).toBe(0);

    const boardPath = join(fixture.cwd, ".lytos", "issue-board", "BOARD.md");
    expect(existsSync(boardPath)).toBe(true);
    const board = readFileSync(boardPath, "utf-8");
    // BOARD.md references the archive index once issues have been archived
    expect(board).toContain("archive/INDEX.md");
    expect(result.stderr).toContain("BOARD.md refreshed");
  });

  it("BOARD.md lists issues still in 5-done/ (ISS-0051 retention window)", () => {
    fixture = createEmptyBoardFixture();
    // A freshly closed issue (today) — must remain visible on the board.
    writeDoneIssue(fixture.cwd, "ISS-9200", daysAgoISO(0));

    const result = run("board", fixture.cwd);
    expect(result.exitCode).toBe(0);

    const boardPath = join(fixture.cwd, ".lytos", "issue-board", "BOARD.md");
    const board = readFileSync(boardPath, "utf-8");
    expect(board).toContain("5-done");
    expect(board).toContain("ISS-9200");
  });
});
