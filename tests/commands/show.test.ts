/**
 * Integration tests for `lyt show`.
 *
 * Tests issue detail display, progress parsing, and no-arg mode.
 */

import { describe, it, expect, afterEach } from "vitest";
import { resolve, join } from "path";
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

function createLytosWithIssues(cwd: string): void {
  const lyt = (p: string) => resolve(cwd, ".lytos", p);

  for (const dir of [
    "skills", "rules", "memory/cortex",
    "issue-board/0-icebox", "issue-board/1-backlog",
    "issue-board/2-sprint", "issue-board/3-in-progress",
    "issue-board/4-review", "issue-board/5-done",
  ]) {
    mkdirSync(lyt(dir), { recursive: true });
  }

  // In-progress issue with checklist
  writeFileSync(
    lyt("issue-board/3-in-progress/ISS-0042-payment.md"),
    `---
id: ISS-0042
title: "Add payment integration"
type: feat
priority: P1-high
effort: M
complexity: standard
skill: api-design
skills_aux: [security, testing]
status: 3-in-progress
branch: "feat/ISS-0042-payment"
depends: [ISS-0040]
created: 2026-04-10
---

# ISS-0042 — Add payment integration

## Checklist

- [x] Create payment service
- [x] Add Stripe webhook endpoint
- [x] Write integration tests
- [ ] Add error handling for failed payments
- [ ] Update API documentation
`
  );

  // Done dependency
  writeFileSync(
    lyt("issue-board/5-done/ISS-0040-user-auth.md"),
    `---
id: ISS-0040
title: "User authentication"
type: feat
priority: P1-high
effort: L
status: 5-done
depends: []
created: 2026-04-08
updated: 2026-04-09
---

# ISS-0040 — User authentication
`
  );

  // Backlog issue without checklist
  writeFileSync(
    lyt("issue-board/1-backlog/ISS-0043-docs.md"),
    `---
id: ISS-0043
title: "Update documentation"
type: docs
priority: P2-normal
effort: S
status: 1-backlog
depends: []
created: 2026-04-12
---

# ISS-0043 — Update documentation

Just a description, no checklist.
`
  );

  // Second in-progress issue
  writeFileSync(
    lyt("issue-board/3-in-progress/ISS-0044-refactor.md"),
    `---
id: ISS-0044
title: "Refactor auth middleware"
type: refactor
priority: P1-high
effort: S
status: 3-in-progress
branch: "refactor/ISS-0044-auth-middleware"
depends: []
created: 2026-04-14
---

# ISS-0044 — Refactor auth middleware

- [x] Extract middleware to separate file
- [ ] Add unit tests
- [ ] Update imports
`
  );
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt show ISS-XXXX", () => {
  it("displays issue detail with progress", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show ISS-0042", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("ISS-0042");
    expect(result.stderr).toContain("Add payment integration");
    expect(result.stderr).toContain("3/5");
    expect(result.stderr).toContain("60%");
    expect(result.stderr).toContain("api-design");
    expect(result.stderr).toContain("feat/ISS-0042-payment");
  });

  it("resolves dependencies and shows their status", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show ISS-0042", fixture.cwd);

    expect(result.stderr).toContain("ISS-0040");
    expect(result.stderr).toContain("User authentication");
    expect(result.stderr).toContain("done");
  });

  it("handles issue without checklist", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show ISS-0043", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("ISS-0043");
    expect(result.stderr).toContain("No checklist");
  });

  it("fails for non-existent issue", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show ISS-9999", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("not found");
  });

  it("outputs valid JSON with --json", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show ISS-0042 --json", fixture.cwd);

    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.id).toBe("ISS-0042");
    expect(data.progress).toBe(60);
    expect(data.checklistDone).toBe(3);
    expect(data.checklistTotal).toBe(5);
    expect(data.dependencies).toHaveLength(1);
    expect(data.dependencies[0].done).toBe(true);
  });
});

describe("lyt show (no argument)", () => {
  it("displays all in-progress issues with progress", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("In Progress");
    expect(result.stderr).toContain("ISS-0042");
    expect(result.stderr).toContain("ISS-0044");
    expect(result.stderr).toContain("3/5");
    expect(result.stderr).toContain("1/3");
  });

  it("shows clean message when no issues in progress", () => {
    fixture = createEmptyFixture();
    const lyt = (p: string) => resolve(fixture.cwd, ".lytos", p);
    for (const dir of [
      "issue-board/0-icebox", "issue-board/1-backlog",
      "issue-board/2-sprint", "issue-board/3-in-progress",
      "issue-board/4-review", "issue-board/5-done",
    ]) {
      mkdirSync(lyt(dir), { recursive: true });
    }

    const result = run("show", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No issues in progress");
  });

  it("outputs valid JSON array with --json", () => {
    fixture = createEmptyFixture();
    createLytosWithIssues(fixture.cwd);

    const result = run("show --json", fixture.cwd);

    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });
});

describe("lyt show (edge cases)", () => {
  it("fails when .lytos/ does not exist", () => {
    fixture = createEmptyFixture();

    const result = run("show ISS-0001", fixture.cwd);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No .lytos/ directory found");
  });
});
