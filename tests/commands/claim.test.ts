/**
 * Integration tests for `lyt claim` and `lyt unclaim`.
 *
 * Covers: claim moves issue to 3-in-progress with assignee,
 * unclaim moves it back to 2-sprint, double-claim is blocked
 * without --force, issue-id not found returns exit 1.
 */

import { describe, it, expect, afterEach } from "vitest";
import { resolve, join } from "path";
import { mkdirSync, writeFileSync, existsSync, readFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { execSync, spawnSync } from "child_process";
import { createEmptyFixture, type Fixture } from "../helpers/fixtures.js";

const CLI = resolve(__dirname, "../../dist/cli.js");

function run(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
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

function createClaimFixture(gitUserName = "Test User"): Fixture {
  const fixture = createEmptyFixture();
  const lyt = (p: string) => resolve(fixture.cwd, ".lytos", p);

  for (const dir of [
    "skills",
    "rules",
    "memory/cortex",
    "issue-board/0-icebox",
    "issue-board/1-backlog",
    "issue-board/2-sprint",
    "issue-board/3-in-progress",
    "issue-board/4-review",
    "issue-board/5-done",
  ]) {
    mkdirSync(lyt(dir), { recursive: true });
  }

  // Sprint-ready issue (claim target)
  writeFileSync(
    lyt("issue-board/2-sprint/ISS-0001-feature-a.md"),
    `---
id: ISS-0001
title: "Feature A"
type: feat
priority: P1-high
effort: M
status: 2-sprint
branch: "feat/ISS-0001-feature-a"
depends: []
created: 2026-04-16
---

# ISS-0001 — Feature A
`
  );

  // Issue already claimed by someone else (double-claim test)
  writeFileSync(
    lyt("issue-board/3-in-progress/ISS-0002-feature-b.md"),
    `---
id: ISS-0002
title: "Feature B"
type: feat
priority: P1-high
effort: M
status: 3-in-progress
branch: "feat/ISS-0002-feature-b"
assignee: someoneElse
depends: []
created: 2026-04-16
---

# ISS-0002 — Feature B
`
  );

  // Minimal BOARD.md so regenerateBoard has something to overwrite
  writeFileSync(lyt("issue-board/BOARD.md"), "# Issue Board\n");

  // Git setup — claim reads git config user.name
  execSync("git init -b main", { cwd: fixture.cwd, stdio: "pipe" });
  execSync("git config user.email 'test@test.com'", { cwd: fixture.cwd, stdio: "pipe" });
  execSync(`git config user.name '${gitUserName}'`, { cwd: fixture.cwd, stdio: "pipe" });
  execSync("git add -A && git commit -m 'init' --no-gpg-sign", {
    cwd: fixture.cwd,
    stdio: "pipe",
  });

  return fixture;
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt claim", () => {
  it("assigns issue to git user and moves it to 3-in-progress", () => {
    fixture = createClaimFixture("Alice");
    const result = run("claim ISS-0001", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("claimed by @Alice");

    // File moved from 2-sprint → 3-in-progress
    const oldPath = join(
      fixture.cwd,
      ".lytos/issue-board/2-sprint/ISS-0001-feature-a.md"
    );
    const newPath = join(
      fixture.cwd,
      ".lytos/issue-board/3-in-progress/ISS-0001-feature-a.md"
    );
    expect(existsSync(oldPath)).toBe(false);
    expect(existsSync(newPath)).toBe(true);

    // Frontmatter has assignee and status updated
    const content = readFileSync(newPath, "utf-8");
    expect(content).toContain("assignee: Alice");
    expect(content).toContain("status: 3-in-progress");
  });

  it("blocks double-claim without --force", () => {
    fixture = createClaimFixture("Alice");
    const result = run("claim ISS-0002", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("already claimed by @someoneElse");
    expect(result.stderr).toContain("--force");

    // File not modified
    const content = readFileSync(
      join(fixture.cwd, ".lytos/issue-board/3-in-progress/ISS-0002-feature-b.md"),
      "utf-8"
    );
    expect(content).toContain("assignee: someoneElse");
  });

  it("overrides existing assignee with --force", () => {
    fixture = createClaimFixture("Alice");
    const result = run("claim ISS-0002 --force", fixture.cwd);

    expect(result.exitCode).toBe(0);

    const content = readFileSync(
      join(fixture.cwd, ".lytos/issue-board/3-in-progress/ISS-0002-feature-b.md"),
      "utf-8"
    );
    expect(content).toContain("assignee: Alice");
    expect(content).not.toContain("assignee: someoneElse");
  });

  it("returns exit 1 when issue id is not found", () => {
    fixture = createClaimFixture("Alice");
    const result = run("claim ISS-9999", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("not found");
  });
});

// ---------------------------------------------------------------------------
// Origin-freshness tests — behaviors added in ISS-0041
// ---------------------------------------------------------------------------

/**
 * Sets up a bare repo as "origin" for the given fixture and pushes the current
 * state. Returns the bare repo path so tests can mutate it to simulate
 * concurrent changes. Caller must clean up the bare repo in afterEach.
 */
function addOriginAndPush(fixtureCwd: string): string {
  const origin = mkdtempSync(join(tmpdir(), "lytos-origin-"));
  // -b main so HEAD is set to main; otherwise clones land on an empty working tree
  execSync(`git init --bare -b main "${origin}"`, { stdio: "pipe" });
  execSync(`git remote add origin "${origin}"`, { cwd: fixtureCwd, stdio: "pipe" });
  execSync("git push -u origin main", { cwd: fixtureCwd, stdio: "pipe" });
  return origin;
}

/**
 * Makes the fixture's local main "behind" origin by pushing an unrelated commit
 * through a temporary clone. Returns the path of that clone for cleanup.
 */
function advanceOrigin(originPath: string): string {
  const clone = mkdtempSync(join(tmpdir(), "lytos-clone-"));
  execSync(`git clone "${originPath}" "${clone}"`, { stdio: "pipe" });
  execSync("git config user.email 'bot@test.com'", { cwd: clone, stdio: "pipe" });
  execSync("git config user.name 'Bot'", { cwd: clone, stdio: "pipe" });
  writeFileSync(resolve(clone, "advance.txt"), "advance");
  execSync("git add . && git commit -m 'advance' --no-gpg-sign", { cwd: clone, stdio: "pipe" });
  execSync("git push origin main", { cwd: clone, stdio: "pipe" });
  return clone;
}

/**
 * On origin, marks ISS-XXXX as claimed by someone else (moved to 3-in-progress
 * with assignee=other). Uses a throwaway clone, push to origin, then the
 * fixture has a stale view until it fetches.
 */
function claimOnOrigin(
  originPath: string,
  issueFileNameInSprint: string,
  newAssignee: string
): string {
  const clone = mkdtempSync(join(tmpdir(), "lytos-clone-"));
  execSync(`git clone "${originPath}" "${clone}"`, { stdio: "pipe" });
  execSync("git config user.email 'other@test.com'", { cwd: clone, stdio: "pipe" });
  execSync("git config user.name 'OtherDev'", { cwd: clone, stdio: "pipe" });

  const sprintPath = resolve(clone, ".lytos/issue-board/2-sprint", issueFileNameInSprint);
  const inProgressDir = resolve(clone, ".lytos/issue-board/3-in-progress");
  mkdirSync(inProgressDir, { recursive: true });

  let content = readFileSync(sprintPath, "utf-8");
  content = content.replace(/status: 2-sprint/, "status: 3-in-progress");
  content = content.replace(/depends: \[\]/, `depends: []\nassignee: ${newAssignee}\nupdated: 2026-04-20`);
  const destPath = resolve(inProgressDir, issueFileNameInSprint);
  writeFileSync(destPath, content);
  execSync(`git rm "${sprintPath}"`, { cwd: clone, stdio: "pipe" });
  execSync("git add -A && git commit -m 'claim on origin' --no-gpg-sign", { cwd: clone, stdio: "pipe" });
  execSync("git push origin main", { cwd: clone, stdio: "pipe" });
  return clone;
}

describe("lyt claim — origin freshness (ISS-0041)", () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const p of cleanupPaths) {
      try { rmSync(p, { recursive: true, force: true }); } catch { /* noop */ }
    }
    cleanupPaths.length = 0;
  });

  it("aborts when local main is behind origin", () => {
    fixture = createClaimFixture("Alice");
    const origin = addOriginAndPush(fixture.cwd);
    cleanupPaths.push(origin);
    const clone = advanceOrigin(origin);
    cleanupPaths.push(clone);

    const result = run("claim ISS-0001", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/behind origin/);
    // File not moved
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/2-sprint/ISS-0001-feature-a.md"))).toBe(true);
  });

  it("--force claims even when local main is behind", () => {
    fixture = createClaimFixture("Alice");
    const origin = addOriginAndPush(fixture.cwd);
    cleanupPaths.push(origin);
    const clone = advanceOrigin(origin);
    cleanupPaths.push(clone);

    const result = run("claim ISS-0001 --force", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/3-in-progress/ISS-0001-feature-a.md"))).toBe(true);
  });

  it("aborts when the issue is already claimed on origin by someone else", () => {
    fixture = createClaimFixture("Alice");
    const origin = addOriginAndPush(fixture.cwd);
    cleanupPaths.push(origin);
    const clone = claimOnOrigin(origin, "ISS-0001-feature-a.md", "OtherDev");
    cleanupPaths.push(clone);

    // Alice tries to claim the same issue locally (her local main is now behind)
    const result = run("claim ISS-0001", fixture.cwd);

    expect(result.exitCode).toBe(1);
    // Either "behind" or "already claimed" is acceptable — the behind check
    // fires first since the clone pushed a commit. Both are correct refusals.
    expect(result.stderr).toMatch(/behind origin|claimed by @OtherDev/);
  });
});

describe("lyt unclaim", () => {
  it("removes assignee and moves issue back to 2-sprint", () => {
    fixture = createClaimFixture("someoneElse");
    const result = run("unclaim ISS-0002", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("unclaimed");

    const sprintPath = join(
      fixture.cwd,
      ".lytos/issue-board/2-sprint/ISS-0002-feature-b.md"
    );
    expect(existsSync(sprintPath)).toBe(true);

    const content = readFileSync(sprintPath, "utf-8");
    expect(content).not.toContain("assignee:");
    expect(content).toContain("status: 2-sprint");
  });

  it("blocks unclaim when issue is claimed by someone else (no --force)", () => {
    fixture = createClaimFixture("Alice");
    const result = run("unclaim ISS-0002", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("claimed by @someoneElse");
  });
});
