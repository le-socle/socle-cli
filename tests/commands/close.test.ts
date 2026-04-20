/**
 * Integration tests for `lyt close`.
 */

import { describe, it, expect, afterEach } from "vitest";
import { resolve, join } from "path";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
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

function createCloseFixture(cwd: string): void {
  const lyt = (p: string) => resolve(cwd, ".lytos", p);

  for (const dir of [
    "skills", "rules", "memory/cortex",
    "issue-board/0-icebox", "issue-board/1-backlog",
    "issue-board/2-sprint", "issue-board/3-in-progress",
    "issue-board/4-review", "issue-board/5-done",
  ]) {
    mkdirSync(lyt(dir), { recursive: true });
  }

  // In-progress issue with all items checked
  writeFileSync(
    lyt("issue-board/3-in-progress/ISS-0001-complete.md"),
    `---
id: ISS-0001
title: "Complete task"
type: feat
priority: P1-high
effort: M
status: 3-in-progress
depends: []
created: 2026-04-16
---

# ISS-0001 — Complete task

- [x] Step one
- [x] Step two
- [x] Step three
`
  );

  // In-progress issue with unchecked items
  writeFileSync(
    lyt("issue-board/3-in-progress/ISS-0002-incomplete.md"),
    `---
id: ISS-0002
title: "Incomplete task"
type: feat
priority: P1-high
effort: M
status: 3-in-progress
depends: []
created: 2026-04-15
---

# ISS-0002 — Incomplete task

- [x] Step one
- [ ] Step two
- [ ] Step three
`
  );

  // Backlog issue (not started)
  writeFileSync(
    lyt("issue-board/1-backlog/ISS-0003-backlog.md"),
    `---
id: ISS-0003
title: "Not started"
type: feat
priority: P2-normal
effort: S
status: 1-backlog
depends: []
created: 2026-04-14
---

# ISS-0003 — Not started
`
  );

  // Already done issue
  writeFileSync(
    lyt("issue-board/5-done/ISS-0004-done.md"),
    `---
id: ISS-0004
title: "Already done"
type: feat
priority: P1-high
effort: S
status: 5-done
depends: []
created: 2026-04-13
---

# ISS-0004 — Already done
`
  );

  // Review issue (closable)
  writeFileSync(
    lyt("issue-board/4-review/ISS-0005-review.md"),
    `---
id: ISS-0005
title: "In review"
type: feat
priority: P1-high
effort: M
status: 4-review
depends: []
created: 2026-04-15
---

# ISS-0005 — In review

- [x] All done
`
  );
}

// Batch-close fixture: two clean review issues + one with unchecked items.
function createBatchReviewFixture(cwd: string): void {
  const lyt = (p: string) => resolve(cwd, ".lytos", p);

  for (const dir of [
    "skills", "rules", "memory/cortex",
    "issue-board/0-icebox", "issue-board/1-backlog",
    "issue-board/2-sprint", "issue-board/3-in-progress",
    "issue-board/4-review", "issue-board/5-done",
  ]) {
    mkdirSync(lyt(dir), { recursive: true });
  }

  writeFileSync(
    lyt("issue-board/4-review/ISS-0010-clean-a.md"),
    `---
id: ISS-0010
title: "Clean A"
type: feat
priority: P1-high
status: 4-review
depends: []
created: 2026-04-20
---

# ISS-0010 — Clean A

- [x] done
`
  );

  writeFileSync(
    lyt("issue-board/4-review/ISS-0011-clean-b.md"),
    `---
id: ISS-0011
title: "Clean B"
type: feat
priority: P1-high
status: 4-review
depends: []
created: 2026-04-20
---

# ISS-0011 — Clean B

- [x] done
- [x] done
`
  );

  writeFileSync(
    lyt("issue-board/4-review/ISS-0012-unchecked.md"),
    `---
id: ISS-0012
title: "Still has unchecked"
type: feat
priority: P1-high
status: 4-review
depends: []
created: 2026-04-20
---

# ISS-0012 — Still has unchecked

- [x] done
- [ ] not done
`
  );
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt close", () => {
  it("closes a complete in-progress issue", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0001", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("ISS-0001");
    expect(result.stderr).toContain("closed");

    // File moved
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0001-complete.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/3-in-progress/ISS-0001-complete.md"))).toBe(false);

    // Frontmatter updated
    const content = readFileSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0001-complete.md"), "utf-8");
    expect(content).toContain("status: 5-done");
    expect(content).toContain("updated:");
  });

  it("blocks close when checklist items are unchecked", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0002", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("2");
    expect(result.stderr).toContain("unchecked");
    expect(result.stderr).toContain("--force");
  });

  it("closes with --force despite unchecked items", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0002 --force", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("closed");
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0002-incomplete.md"))).toBe(true);
  });

  it("errors when trying to close a backlog issue", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0003", fixture.cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("1-backlog");
  });

  it("warns when issue is already done", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0004", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("already done");
  });

  it("closes an issue in review", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0005", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0005-review.md"))).toBe(true);
  });

  it("outputs valid JSON with --json", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);

    const result = run("close ISS-0001 --json", fixture.cwd);

    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.status).toBe("closed");
    expect(data.checklist.done).toBe(3);
    expect(data.checklist.total).toBe(3);
  });
});

describe("lyt close (batch, no argument)", () => {
  it("reports empty 4-review gracefully", () => {
    fixture = createEmptyFixture();
    createCloseFixture(fixture.cwd);
    // Move the only review issue out so 4-review is empty
    writeFileSync(
      join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0005-review.md"),
      readFileSync(join(fixture.cwd, ".lytos/issue-board/4-review/ISS-0005-review.md"), "utf-8")
    );
    require("fs").unlinkSync(join(fixture.cwd, ".lytos/issue-board/4-review/ISS-0005-review.md"));

    const result = run("close --yes", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No issues in 4-review");
  });

  it("--yes promotes every clean issue in 4-review to 5-done", () => {
    fixture = createEmptyFixture();
    createBatchReviewFixture(fixture.cwd);

    const result = run("close --yes", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0010-clean-a.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0011-clean-b.md"))).toBe(true);
    // ISS-0012 has unchecked items → skipped (no --force)
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/4-review/ISS-0012-unchecked.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0012-unchecked.md"))).toBe(false);
  });

  it("skips issues with unchecked items by default and warns", () => {
    fixture = createEmptyFixture();
    createBatchReviewFixture(fixture.cwd);

    const result = run("close --yes", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("ISS-0012");
    expect(result.stderr).toContain("skipped");
    expect(result.stderr).toMatch(/2 closed.*1 skipped/);
  });

  it("--yes --force promotes even unchecked issues", () => {
    fixture = createEmptyFixture();
    createBatchReviewFixture(fixture.cwd);

    const result = run("close --yes --force", fixture.cwd);

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/5-done/ISS-0012-unchecked.md"))).toBe(true);
    expect(result.stderr).toMatch(/3 closed/);
  });

  it("--dry-run previews without changing anything", () => {
    fixture = createEmptyFixture();
    createBatchReviewFixture(fixture.cwd);

    const result = run("close --dry-run", fixture.cwd);

    expect(result.exitCode).toBe(0);
    // Issues still in 4-review
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/4-review/ISS-0010-clean-a.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/4-review/ISS-0011-clean-b.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos/issue-board/4-review/ISS-0012-unchecked.md"))).toBe(true);
    expect(result.stderr).toContain("Dry run");
  });

  it("--yes --json emits a summary of closed and skipped", () => {
    fixture = createEmptyFixture();
    createBatchReviewFixture(fixture.cwd);

    const result = run("close --yes --json", fixture.cwd);

    expect(result.exitCode).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.status).toBe("done");
    expect(data.closed).toEqual(expect.arrayContaining(["ISS-0010", "ISS-0011"]));
    expect(data.skipped).toHaveLength(1);
    expect(data.skipped[0].id).toBe("ISS-0012");
  });
});
