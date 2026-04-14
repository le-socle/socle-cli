/**
 * Test fixtures — helpers to create temporary .lytos/ directories.
 *
 * Each test gets its own isolated temp directory. No test can
 * pollute another. Cleanup is automatic via the returned `cleanup` function.
 */

import { mkdirSync, writeFileSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { rmSync } from "fs";

export interface Fixture {
  /** Absolute path to the temp directory */
  cwd: string;
  /** Call this to delete the temp directory */
  cleanup: () => void;
}

/**
 * Creates a bare temp directory (no .lytos/).
 */
export function createEmptyFixture(): Fixture {
  const cwd = mkdtempSync(join(tmpdir(), "lytos-test-"));
  return {
    cwd,
    cleanup: () => rmSync(cwd, { recursive: true, force: true }),
  };
}

/**
 * Creates a temp directory with a package.json (simulates a Node.js project).
 */
export function createNodeProjectFixture(): Fixture {
  const fixture = createEmptyFixture();
  writeFileSync(
    join(fixture.cwd, "package.json"),
    JSON.stringify({
      name: "test-project",
      dependencies: { next: "14.0.0" },
      devDependencies: { typescript: "5.5.0", vitest: "2.0.0" },
    })
  );
  return fixture;
}

/**
 * Creates a temp directory with a .lytos/issue-board/ containing sample issues.
 */
export function createBoardFixture(): Fixture {
  const fixture = createEmptyFixture();
  const board = join(fixture.cwd, ".lytos", "issue-board");

  // Create Kanban folders
  for (const dir of [
    "0-icebox",
    "1-backlog",
    "2-sprint",
    "3-in-progress",
    "4-review",
    "5-done",
  ]) {
    mkdirSync(join(board, dir), { recursive: true });
  }

  // Issue in backlog
  writeFileSync(
    join(board, "1-backlog", "ISS-0001-setup-db.md"),
    `---
id: ISS-0001
title: "Setup database"
type: feat
priority: P1-high
effort: M
status: 1-backlog
depends: []
created: 2026-04-10
---

# ISS-0001 — Setup database
`
  );

  // Issue in progress
  writeFileSync(
    join(board, "3-in-progress", "ISS-0002-create-api.md"),
    `---
id: ISS-0002
title: "Create REST API"
type: feat
priority: P1-high
effort: L
complexity: heavy
status: 3-in-progress
depends: [ISS-0001]
created: 2026-04-10
---

# ISS-0002 — Create REST API
`
  );

  // Issue done
  writeFileSync(
    join(board, "5-done", "ISS-0003-init-project.md"),
    `---
id: ISS-0003
title: "Initialize project"
type: chore
priority: P0-critical
effort: XS
status: 5-done
depends: []
created: 2026-04-08
updated: 2026-04-09
---

# ISS-0003 — Initialize project
`
  );

  // Issue with mismatched folder/frontmatter (for warning test)
  writeFileSync(
    join(board, "1-backlog", "ISS-0004-mismatched.md"),
    `---
id: ISS-0004
title: "Mismatched status"
type: fix
priority: P2-normal
effort: S
status: 3-in-progress
depends: []
created: 2026-04-10
---

# ISS-0004 — Mismatched status
`
  );

  return fixture;
}

/**
 * Creates an empty board fixture (no issues, just folders).
 */
export function createEmptyBoardFixture(): Fixture {
  const fixture = createEmptyFixture();
  const board = join(fixture.cwd, ".lytos", "issue-board");

  for (const dir of [
    "0-icebox",
    "1-backlog",
    "2-sprint",
    "3-in-progress",
    "4-review",
    "5-done",
  ]) {
    mkdirSync(join(board, dir), { recursive: true });
  }

  return fixture;
}
