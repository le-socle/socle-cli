/**
 * Integration tests for `lyt lint`.
 *
 * Tests the linter against various .lytos/ configurations.
 */

import { describe, it, expect, afterEach } from "vitest";
import { resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";
import {
  createEmptyFixture,
  type Fixture,
} from "../helpers/fixtures.js";

const CLI = resolve(__dirname, "../../dist/cli.js");

function run(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
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
}

function createValidLytos(cwd: string): void {
  const lyt = (p: string) => resolve(cwd, ".lytos", p);

  // Create directories
  for (const dir of [
    "skills", "rules", "memory/cortex", "scripts",
    "issue-board/0-icebox", "issue-board/1-backlog",
    "issue-board/2-sprint", "issue-board/3-in-progress",
    "issue-board/4-review", "issue-board/5-done",
  ]) {
    mkdirSync(lyt(dir), { recursive: true });
  }

  // Required files
  writeFileSync(lyt("manifest.md"), `# Manifest — test

## Identity

| Field | Value |
|-------|-------|
| Name | test |
| Description | A test project |
| Owner | tester |

## Why this project exists

This is a test project for validating lyt lint.

## Tech stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
`);

  writeFileSync(lyt("LYTOS.md"), "# LYTOS\nMethod reference.");
  writeFileSync(lyt("memory/MEMORY.md"), "# Memory\nIndex.");
  writeFileSync(lyt("rules/default-rules.md"), "# Rules\nDefault rules.");
  writeFileSync(lyt("issue-board/BOARD.md"), "# Board\nEmpty.");
  writeFileSync(lyt("skills/session-start.md"), "# Session Start\nSkill.");
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt lint", () => {
  it("passes on a valid .lytos/ structure", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    const result = run("lint", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("All checks passed");
  });

  it("fails when .lytos/ does not exist", () => {
    fixture = createEmptyFixture();

    const result = run("lint", fixture.cwd);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No .lytos/ directory found");
  });

  it("detects missing required files", () => {
    fixture = createEmptyFixture();
    mkdirSync(resolve(fixture.cwd, ".lytos"), { recursive: true });

    const result = run("lint", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("manifest.md");
    expect(result.stderr).toContain("LYTOS.md");
    expect(result.stderr).toContain("MEMORY.md");
  });

  it("detects empty manifest fields", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Overwrite manifest with empty fields
    writeFileSync(resolve(fixture.cwd, ".lytos", "manifest.md"), `# Manifest

## Identity

| Field | Value |
|-------|-------|
| Name | test |
| Description | |
| Owner | |

## Why this project exists

*3-5 sentences. The "why" of this project.*

## Tech stack

| Component | Technology |
|-----------|------------|
`);

    const result = run("lint", fixture.cwd);

    expect(result.stderr).toContain("Empty description");
    expect(result.stderr).toContain("Empty owner");
    expect(result.stderr).toContain("placeholder");
  });

  it("detects invalid issue frontmatter", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Create an issue with missing required fields
    writeFileSync(
      resolve(fixture.cwd, ".lytos", "issue-board", "1-backlog", "ISS-0001-test.md"),
      `---
id: ISS-0001
title: "Test issue"
---

# Test
`
    );

    const result = run("lint", fixture.cwd);

    expect(result.stderr).toContain("Missing required field: status");
    expect(result.stderr).toContain("Missing required field: priority");
  });

  it("detects folder/frontmatter status mismatch", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    writeFileSync(
      resolve(fixture.cwd, ".lytos", "issue-board", "1-backlog", "ISS-0001-test.md"),
      `---
id: ISS-0001
title: "Mismatched"
status: 3-in-progress
priority: P1-high
---

# Test
`
    );

    const result = run("lint", fixture.cwd);

    expect(result.stderr).toContain("1-backlog");
    expect(result.stderr).toContain("3-in-progress");
  });

  it("outputs valid JSON with --json", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    const result = run("lint --json", fixture.cwd);

    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.errors).toBe(0);
    expect(data.warnings).toBe(0);
    expect(data.filesChecked).toBeGreaterThan(0);
  });

  it("returns exit code 1 on errors, 0 on warnings only", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Add a warning-only issue (empty description in manifest)
    writeFileSync(resolve(fixture.cwd, ".lytos", "manifest.md"), `# Manifest

## Identity

| Field | Value |
|-------|-------|
| Name | test |
| Description | |
| Owner | tester |

## Why this project exists

This project exists for real reasons.

## Tech stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
`);

    const result = run("lint", fixture.cwd);

    // Warnings only — should still exit 0
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Empty description");
  });
});
