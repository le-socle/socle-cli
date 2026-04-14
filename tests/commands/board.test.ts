/**
 * Integration tests for `lytos board`.
 *
 * Uses fixture directories with pre-made issue files.
 * Tests the actual CLI binary output.
 */

import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, join } from "path";
import {
  createBoardFixture,
  createEmptyBoardFixture,
  createEmptyFixture,
  type Fixture,
} from "../helpers/fixtures.js";

const CLI = resolve(__dirname, "../../dist/cli.js");

function run(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    // Use spawnSync to capture both stdout and stderr even on success
    const { spawnSync } = require("child_process");
    const result = spawnSync("node", [CLI, ...args.split(" ")], {
      cwd,
      encoding: "utf-8",
    });
    return {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: result.status ?? 0,
    };
  } catch {
    return { stdout: "", stderr: "", exitCode: 1 };
  }
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lytos board", () => {
  it("generates BOARD.md from fixture issues", () => {
    fixture = createBoardFixture();
    const result = run("board", fixture.cwd);

    expect(result.exitCode).toBe(0);

    const board = readFileSync(
      join(fixture.cwd, ".lytos", "issue-board", "BOARD.md"),
      "utf-8"
    );

    // Should contain all issues
    expect(board).toContain("ISS-0001");
    expect(board).toContain("ISS-0002");
    expect(board).toContain("ISS-0003");
    expect(board).toContain("Setup database");
    expect(board).toContain("Create REST API");

    // 5-done section should have the completed issue
    expect(board).toContain("Initialize project");

    // Next number should be ISS-0005
    expect(board).toContain("ISS-0005");
  });

  it("outputs valid JSON with --json", () => {
    fixture = createBoardFixture();
    const result = run("board --json", fixture.cwd);

    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout);
    expect(data.nextNumber).toBe("ISS-0005");
    expect(data.columns).toHaveLength(6);

    // Find the 3-in-progress column
    // ISS-0002 is genuinely in-progress. ISS-0004 is in 1-backlog/ folder
    // but its frontmatter says 3-in-progress (source of truth), so it
    // also appears here. That's the correct behavior.
    const inProgress = data.columns.find(
      (c: { folder: string }) => c.folder === "3-in-progress"
    );
    expect(inProgress.issues).toHaveLength(2);
    const ids = inProgress.issues.map((i: { id: string }) => i.id);
    expect(ids).toContain("ISS-0002");
  });

  it("warns on frontmatter/folder status mismatch", () => {
    fixture = createBoardFixture();
    const result = run("board --json", fixture.cwd);

    // ISS-0004 is in 1-backlog/ but frontmatter says 3-in-progress
    expect(result.stderr).toContain("ISS-0004");
    expect(result.stderr).toContain("1-backlog");
    expect(result.stderr).toContain("3-in-progress");
  });

  it("handles empty board (no issues)", () => {
    fixture = createEmptyBoardFixture();
    const result = run("board", fixture.cwd);

    expect(result.exitCode).toBe(0);

    const board = readFileSync(
      join(fixture.cwd, ".lytos", "issue-board", "BOARD.md"),
      "utf-8"
    );
    expect(board).toContain("No issues.");
    expect(board).toContain("ISS-0001"); // next number
  });

  it("fails when no issue-board/ directory exists", () => {
    fixture = createEmptyFixture();
    const result = run("board", fixture.cwd);

    expect(result.exitCode).toBe(2);
  });

  it("--check returns 0 when BOARD.md is up to date", () => {
    fixture = createBoardFixture();
    // Generate first
    run("board", fixture.cwd);
    // Check should pass
    const result = run("board --check", fixture.cwd);

    expect(result.exitCode).toBe(0);
  });

  it("--check returns 1 when BOARD.md is outdated", () => {
    fixture = createBoardFixture();
    // Generate, then manually modify BOARD.md
    run("board", fixture.cwd);

    const boardPath = join(fixture.cwd, ".lytos", "issue-board", "BOARD.md");
    const content = readFileSync(boardPath, "utf-8");
    // Simulate an outdated board by adding a fake line
    const modified = content.replace("_No issues._", "| ISS-9999 | Fake | P3-low | XS |");
    const { writeFileSync: wfs } = require("fs");
    wfs(boardPath, modified);

    const result = run("board --check", fixture.cwd);
    expect(result.exitCode).toBe(1);
  });
});
