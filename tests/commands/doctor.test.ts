/**
 * Integration tests for `lyt doctor`.
 *
 * Tests the diagnostic engine against various .lytos/ configurations.
 */

import { describe, it, expect, afterEach } from "vitest";
import { resolve, join } from "path";
import { mkdirSync, writeFileSync, utimesSync } from "fs";
import { execSync } from "child_process";
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

  for (const dir of [
    "skills", "rules", "memory/cortex", "scripts",
    "issue-board/0-icebox", "issue-board/1-backlog",
    "issue-board/2-sprint", "issue-board/3-in-progress",
    "issue-board/4-review", "issue-board/5-done",
  ]) {
    mkdirSync(lyt(dir), { recursive: true });
  }

  writeFileSync(lyt("manifest.md"), `# Manifest — test

## Identity

| Field | Value |
|-------|-------|
| Name | test |
| Description | A test project |
| Owner | tester |

## Why this project exists

This is a test project.

## Tech stack

| Component | Technology |
|-----------|------------|
| Language | TypeScript |
`);

  writeFileSync(lyt("LYTOS.md"), "# LYTOS\nMethod reference.");
  writeFileSync(lyt("memory/MEMORY.md"), "# Memory\nIndex.");
  writeFileSync(lyt("rules/default-rules.md"), "# Rules\nDefault rules.");
  writeFileSync(lyt("issue-board/BOARD.md"), "# Board\nEmpty.");
  // session-start stays flat (Lytos bootstrap protocol)
  writeFileSync(lyt("skills/session-start.md"), "# Session Start\nSkill.");
  // Task skills follow agentskills.io folder format
  mkdirSync(lyt("skills/code-structure"), { recursive: true });
  writeFileSync(
    lyt("skills/code-structure/SKILL.md"),
    "---\nname: code-structure\ndescription: test fixture\n---\n\n# Code Structure\nSkill."
  );
}

function initGitRepo(cwd: string): void {
  execSync("git init -b main", { cwd, stdio: "pipe" });
  execSync("git config user.email 'test@test.com'", { cwd, stdio: "pipe" });
  execSync("git config user.name 'Test'", { cwd, stdio: "pipe" });
  writeFileSync(join(cwd, "README.md"), "# Test");
  execSync("git add -A", { cwd, stdio: "pipe" });
  execSync("git commit -m 'init' --no-gpg-sign", { cwd, stdio: "pipe" });
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt doctor", () => {
  it("passes on a healthy .lytos/ structure", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    const result = run("doctor", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("All diagnostics passed");
    expect(result.stderr).toContain("100%");
  });

  it("fails when .lytos/ does not exist", () => {
    fixture = createEmptyFixture();

    const result = run("doctor", fixture.cwd);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No .lytos/ directory found");
  });

  it("detects broken internal links", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Add a file with a broken link
    writeFileSync(
      resolve(fixture.cwd, ".lytos", "memory", "MEMORY.md"),
      "# Memory\n\nSee [architecture](./cortex/nonexistent.md) for details."
    );

    const result = run("doctor", fixture.cwd);

    expect(result.stderr).toContain("Broken link");
    expect(result.stderr).toContain("nonexistent.md");
  });

  it("detects stale memory files", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Create a cortex file and backdate it 120 days
    const cortexFile = resolve(fixture.cwd, ".lytos", "memory", "cortex", "old-patterns.md");
    writeFileSync(cortexFile, "# Old Patterns\nSome old stuff.");

    const oldDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    utimesSync(cortexFile, oldDate, oldDate);

    const result = run("doctor", fixture.cwd);

    expect(result.stderr).toContain("Stale memory");
    expect(result.stderr).toContain("old-patterns.md");
  });

  it("detects missing skill references", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Create an issue referencing a non-existent skill
    writeFileSync(
      resolve(fixture.cwd, ".lytos", "issue-board", "1-backlog", "ISS-0001-test.md"),
      `---
id: ISS-0001
title: "Test issue"
status: 1-backlog
priority: P1-high
skill: nonexistent-skill
skills_aux: [also-missing, code-structure]
---

# Test
`
    );

    const result = run("doctor", fixture.cwd);

    expect(result.stderr).toContain("nonexistent-skill");
    expect(result.stderr).toContain("also-missing");
    // code-structure exists, should NOT be flagged
    expect(result.stderr).not.toContain('"code-structure" which does not exist');
  });

  it("detects frontmatter/folder status mismatch", () => {
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

    const result = run("doctor", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("1-backlog");
    expect(result.stderr).toContain("3-in-progress");
  });

  it("detects orphan dependencies", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    writeFileSync(
      resolve(fixture.cwd, ".lytos", "issue-board", "1-backlog", "ISS-0001-test.md"),
      `---
id: ISS-0001
title: "Has orphan dep"
status: 1-backlog
priority: P1-high
depends: [ISS-9999]
---

# Test
`
    );

    const result = run("doctor", fixture.cwd);

    expect(result.stderr).toContain("ISS-9999");
    expect(result.stderr).toContain("does not exist");
  });

  it("detects when the current issue branch points to a backlog issue", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);
    initGitRepo(fixture.cwd);

    writeFileSync(
      resolve(fixture.cwd, ".lytos", "issue-board", "1-backlog", "ISS-0001-test.md"),
      `---
id: ISS-0001
title: "Test issue"
status: 1-backlog
priority: P1-high
branch: "fix/ISS-0001-test"
---

# Test
`
    );

    execSync("git checkout -b fix/ISS-0001-test", { cwd: fixture.cwd, stdio: "pipe" });

    const result = run("doctor", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Git Workflow");
    expect(result.stderr).toContain("Current branch fix/ISS-0001-test points to ISS-0001");
    expect(result.stderr).toContain("1-backlog");
    expect(result.stderr).toContain("lyt start ISS-0001");
  });

  it("does not flag an active issue branch when the issue is in progress", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);
    initGitRepo(fixture.cwd);

    writeFileSync(
      resolve(fixture.cwd, ".lytos", "issue-board", "3-in-progress", "ISS-0001-test.md"),
      `---
id: ISS-0001
title: "Test issue"
status: 3-in-progress
priority: P1-high
branch: "fix/ISS-0001-test"
---

# Test
`
    );

    execSync("git checkout -b fix/ISS-0001-test", { cwd: fixture.cwd, stdio: "pipe" });

    const result = run("doctor", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("All diagnostics passed");
  });

  it("outputs valid JSON with --json", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    const result = run("doctor --json", fixture.cwd);

    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.score).toBe(100);
    expect(data.errors).toBe(0);
    expect(data.warnings).toBe(0);
    expect(data.filesChecked).toBeGreaterThan(0);
  });

  it("computes a reduced score with findings", () => {
    fixture = createEmptyFixture();
    createValidLytos(fixture.cwd);

    // Add a status mismatch (error = -10) and a stale file (warning = -5)
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

    const cortexFile = resolve(fixture.cwd, ".lytos", "memory", "cortex", "stale.md");
    writeFileSync(cortexFile, "# Stale\nOld content.");
    const oldDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    utimesSync(cortexFile, oldDate, oldDate);

    const result = run("doctor --json", fixture.cwd);
    const data = JSON.parse(result.stdout);

    expect(data.score).toBeLessThan(100);
    expect(data.errors).toBeGreaterThan(0);
    expect(data.warnings).toBeGreaterThan(0);
  });
});
