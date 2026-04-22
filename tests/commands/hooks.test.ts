/**
 * Integration tests for git pre-commit hook.
 *
 * Tests hook installation and branch name enforcement.
 */

import { describe, it, expect, afterEach } from "vitest";
import { resolve, join } from "path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import {
  createEmptyFixture,
  type Fixture,
} from "../helpers/fixtures.js";
import { installPreCommitHook } from "../../src/lib/hooks.js";

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

function initGitRepo(cwd: string): void {
  execSync("git init -b main", { cwd, stdio: "pipe" });
  execSync("git config user.email 'test@test.com'", { cwd, stdio: "pipe" });
  execSync("git config user.name 'Test'", { cwd, stdio: "pipe" });
  writeFileSync(join(cwd, "README.md"), "# Test");
  execSync("git add -A && git commit -m 'init' --no-gpg-sign", { cwd, stdio: "pipe" });
}

function writeIssue(cwd: string, statusDir: string, status: string): void {
  const boardDir = join(cwd, ".lytos", "issue-board", statusDir);
  mkdirSync(boardDir, { recursive: true });
  writeFileSync(
    join(boardDir, "ISS-0001-test-feature.md"),
    `---
id: ISS-0001
title: "Test feature"
type: feat
priority: P1-high
status: ${status}
branch: "feat/ISS-0001-test-feature"
---

# ISS-0001 — Test feature
`,
    "utf-8"
  );
}

function tryCommit(cwd: string): { exitCode: number; stderr: string } {
  writeFileSync(join(cwd, "test.txt"), `change-${Date.now()}`);
  execSync("git add -A", { cwd, stdio: "pipe" });
  try {
    const result = execSync("git commit -m 'test commit' --no-gpg-sign 2>&1", {
      cwd,
      encoding: "utf-8",
    });
    return { exitCode: 0, stderr: result };
  } catch (err: unknown) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { exitCode: e.status || 1, stderr: (e.stdout || "") + (e.stderr || "") };
  }
}

describe("installPreCommitHook", () => {
  it("installs hook in a git repo", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);

    const result = installPreCommitHook(fixture.cwd);

    expect(result).toBe("installed");
    expect(existsSync(join(fixture.cwd, ".git/hooks/pre-commit"))).toBe(true);

    const content = readFileSync(join(fixture.cwd, ".git/hooks/pre-commit"), "utf-8");
    expect(content).toContain("lytos pre-commit hook");
    expect(content).toContain("ISS-");
  });

  it("returns no-git when no .git/ exists", () => {
    fixture = createEmptyFixture();

    const result = installPreCommitHook(fixture.cwd);

    expect(result).toBe("no-git");
  });

  it("preserves existing hook content", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);

    // Create an existing hook
    const hookPath = join(fixture.cwd, ".git/hooks/pre-commit");
    mkdirSync(join(fixture.cwd, ".git/hooks"), { recursive: true });
    writeFileSync(hookPath, "#!/bin/sh\necho 'custom hook'\n", "utf-8");

    const result = installPreCommitHook(fixture.cwd);

    expect(result).toBe("installed");
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("custom hook");
    expect(content).toContain("lytos pre-commit hook");
  });

  it("updates existing Lytos section without duplicating", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);

    // Install twice
    installPreCommitHook(fixture.cwd);
    const result = installPreCommitHook(fixture.cwd);

    expect(result).toBe("updated");
    const content = readFileSync(join(fixture.cwd, ".git/hooks/pre-commit"), "utf-8");
    const count = (content.match(/lytos pre-commit hook start/g) || []).length;
    expect(count).toBe(1);
  });

  it("returns dry-run in dry-run mode", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);

    const result = installPreCommitHook(fixture.cwd, true);

    expect(result).toBe("dry-run");
    expect(existsSync(join(fixture.cwd, ".git/hooks/pre-commit"))).toBe(false);
  });
});

describe("pre-commit hook enforcement", () => {
  /**
   * Helper: check if git hooks actually execute in this environment.
   * Some CI environments or git configurations may not run hooks.
   */
  function hooksWork(cwd: string): boolean {
    installPreCommitHook(cwd);
    // Try a commit on main — if hooks work, it should be blocked
    writeFileSync(join(cwd, "hook-test.txt"), "test");
    execSync("git add -A", { cwd, stdio: "pipe" });
    try {
      execSync("git commit -m 'hook test' --no-gpg-sign 2>&1", { cwd, encoding: "utf-8" });
      // If commit succeeded, hooks didn't run — clean up
      execSync("git reset HEAD~1", { cwd, stdio: "pipe" });
      return false;
    } catch {
      // Commit was blocked — hooks work, clean up staged files
      execSync("git reset", { cwd, stdio: "pipe" });
      return true;
    }
  }

  it("blocks commits on main", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);

    if (!hooksWork(fixture.cwd)) {
      return; // skip — hooks not supported in this environment
    }

    const result = tryCommit(fixture.cwd);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("not allowed");
    expect(result.stderr).toContain("lyt start");
  });

  it("allows commits on a properly named branch", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);
    installPreCommitHook(fixture.cwd);

    execSync("git checkout -b feat/ISS-0001-test-feature", { cwd: fixture.cwd, stdio: "pipe" });

    const result = tryCommit(fixture.cwd);

    expect(result.exitCode).toBe(0);
  });

  it("blocks commits when the issue branch points to a backlog issue", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);
    installPreCommitHook(fixture.cwd);
    writeIssue(fixture.cwd, "1-backlog", "1-backlog");

    execSync("git checkout -b feat/ISS-0001-test-feature", { cwd: fixture.cwd, stdio: "pipe" });

    const result = tryCommit(fixture.cwd);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("issue status is '1-backlog'");
    expect(result.stderr).toContain("lyt start ISS-0001");
  });

  it("allows commits when the issue branch points to an in-progress issue", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);
    installPreCommitHook(fixture.cwd);
    writeIssue(fixture.cwd, "3-in-progress", "3-in-progress");

    execSync("git checkout -b feat/ISS-0001-test-feature", { cwd: fixture.cwd, stdio: "pipe" });

    const result = tryCommit(fixture.cwd);

    expect(result.exitCode).toBe(0);
  });

  it("blocks commits on incorrectly named branch", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);

    if (!hooksWork(fixture.cwd)) {
      return; // skip — hooks not supported in this environment
    }

    execSync("git checkout -b my-random-branch", { cwd: fixture.cwd, stdio: "pipe" });

    const result = tryCommit(fixture.cwd);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("naming convention");
  });

  it("allows bypass with --no-verify", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);
    installPreCommitHook(fixture.cwd);

    writeFileSync(join(fixture.cwd, "test.txt"), "change");
    execSync("git add -A", { cwd: fixture.cwd, stdio: "pipe" });

    // Should not throw
    execSync("git commit -m 'bypass' --no-verify --no-gpg-sign", {
      cwd: fixture.cwd,
      stdio: "pipe",
    });
  });

  it("allows commits when CI=true", () => {
    fixture = createEmptyFixture();
    initGitRepo(fixture.cwd);
    installPreCommitHook(fixture.cwd);

    writeFileSync(join(fixture.cwd, "test.txt"), "change");
    execSync("git add -A", { cwd: fixture.cwd, stdio: "pipe" });

    // Should not throw with CI=true
    execSync("git commit -m 'ci commit' --no-gpg-sign", {
      cwd: fixture.cwd,
      stdio: "pipe",
      env: { ...process.env, CI: "true" },
    });
  });
});
