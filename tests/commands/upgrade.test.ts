/**
 * Integration tests for `lyt upgrade`.
 *
 * Covers: fresh .lytos/ (everything up to date), modified file with --force,
 * missing file auto-added, --dry-run listing, no .lytos/ → exit 2.
 */

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmSync } from "fs";
import { resolve, join } from "path";
import { createEmptyFixture, type Fixture } from "../helpers/fixtures.js";

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

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lyt upgrade", () => {
  it("exits 2 when no .lytos/ directory exists", () => {
    fixture = createEmptyFixture();
    const result = run("upgrade --dry-run", fixture.cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("No .lytos/");
  });

  it("reports all files up to date after fresh init", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    const result = run("upgrade --dry-run", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("up to date");
    // No "(differs)" when nothing differs
    expect(result.stderr).not.toContain("(differs)");
  });

  it("reports a missing file as new in --dry-run", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    // Delete one upgradeable file
    const skillPath = join(
      fixture.cwd,
      ".lytos",
      "skills",
      "session-start.md"
    );
    unlinkSync(skillPath);

    const result = run("upgrade --dry-run", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("skills/session-start.md");
    expect(result.stderr).toContain("(new)");

    // --dry-run does not write
    expect(existsSync(skillPath)).toBe(false);
  });

  it("--force overwrites a modified file", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    const lytosMd = join(fixture.cwd, ".lytos", "LYTOS.md");
    const original = readFileSync(lytosMd, "utf-8");
    writeFileSync(lytosMd, "USER MODIFIED CONTENT", "utf-8");

    const result = run("upgrade --force", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("LYTOS.md");
    expect(result.stderr).toContain("updated");

    const after = readFileSync(lytosMd, "utf-8");
    expect(after).toBe(original);
  });

  it("--force adds a missing file and writes it", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    const skillPath = join(
      fixture.cwd,
      ".lytos",
      "skills",
      "session-start.md"
    );
    unlinkSync(skillPath);

    const result = run("upgrade --force", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(existsSync(skillPath)).toBe(true);
    expect(result.stderr).toContain("(new)");
  });

  it("recreates a missing 6-private-notes/.gitkeep (legacy project)", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    // Simulate a project that pre-dates the 6-private-notes column:
    // wipe the folder entirely, including its .gitkeep.
    const privateNotesDir = join(
      fixture.cwd,
      ".lytos",
      "issue-board",
      "6-private-notes"
    );
    rmSync(privateNotesDir, { recursive: true, force: true });
    expect(existsSync(privateNotesDir)).toBe(false);

    const result = run("upgrade --force", fixture.cwd);
    expect(result.exitCode).toBe(0);

    const gitkeep = join(privateNotesDir, ".gitkeep");
    expect(existsSync(gitkeep)).toBe(true);
    expect(result.stderr).toContain("issue-board/6-private-notes/.gitkeep");
  });

  it("--dry-run reports missing kanban .gitkeeps without writing them", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    const privateNotesDir = join(
      fixture.cwd,
      ".lytos",
      "issue-board",
      "6-private-notes"
    );
    rmSync(privateNotesDir, { recursive: true, force: true });

    const result = run("upgrade --dry-run", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("issue-board/6-private-notes/.gitkeep");
    expect(existsSync(privateNotesDir)).toBe(false);
  });

  it("never touches manifest.md when it has been modified", () => {
    fixture = createEmptyFixture();
    run("init --yes", fixture.cwd);

    const manifest = join(fixture.cwd, ".lytos", "manifest.md");
    const userContent = "# My personal manifest\n\nCustom notes.";
    writeFileSync(manifest, userContent, "utf-8");

    run("upgrade --force", fixture.cwd);

    const after = readFileSync(manifest, "utf-8");
    expect(after).toBe(userContent);
  });

  it("--migrate-cursor moves legacy .cursorrules to .cursor/rules/lytos.mdc (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool none", fixture.cwd);

    const legacy = join(fixture.cwd, ".cursorrules");
    const modern = join(fixture.cwd, ".cursor", "rules", "lytos.mdc");
    const legacyContent = "# Our project rules\n\nAlways use Tailwind, never CSS modules.\n";
    writeFileSync(legacy, legacyContent, "utf-8");

    const result = run("upgrade --migrate-cursor --force", fixture.cwd);
    expect(result.exitCode).toBe(0);

    // Legacy file removed, modern file written
    expect(existsSync(legacy)).toBe(false);
    expect(existsSync(modern)).toBe(true);

    const migrated = readFileSync(modern, "utf-8");
    // Wrapped in the modern front-matter
    expect(migrated).toMatch(/^---\n[\s\S]*?alwaysApply: true[\s\S]*?\n---\n/);
    // Original content preserved verbatim in the body
    expect(migrated).toContain("Always use Tailwind, never CSS modules.");
  });

  it("--migrate-cursor with --dry-run leaves everything in place (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool none", fixture.cwd);

    const legacy = join(fixture.cwd, ".cursorrules");
    const modern = join(fixture.cwd, ".cursor", "rules", "lytos.mdc");
    writeFileSync(legacy, "legacy content\n", "utf-8");

    const result = run("upgrade --migrate-cursor --dry-run", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(existsSync(legacy)).toBe(true);
    expect(existsSync(modern)).toBe(false);
    expect(result.stderr).toContain("would migrate");
  });

  it("--migrate-cursor with both files present refuses to touch either (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool cursor", fixture.cwd);

    // Modern path is already there after `init --tool cursor`; add a legacy
    // file on top so we simulate a half-migrated project.
    const legacy = join(fixture.cwd, ".cursorrules");
    const modern = join(fixture.cwd, ".cursor", "rules", "lytos.mdc");
    writeFileSync(legacy, "legacy content\n", "utf-8");
    const modernBefore = readFileSync(modern, "utf-8");

    const result = run("upgrade --migrate-cursor --force", fixture.cwd);
    expect(result.exitCode).toBe(0);

    // Neither file was touched
    expect(existsSync(legacy)).toBe(true);
    expect(readFileSync(legacy, "utf-8")).toBe("legacy content\n");
    expect(readFileSync(modern, "utf-8")).toBe(modernBefore);
    // Warning surfaces the conflict
    expect(result.stderr).toContain("both present");
  });

  it("--migrate-cursor is a no-op when no legacy .cursorrules exists (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool none", fixture.cwd);

    const result = run("upgrade --migrate-cursor --force", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("No legacy .cursorrules");
  });

  it("--migrate-cursor is idempotent — running twice is safe (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool none", fixture.cwd);

    const legacy = join(fixture.cwd, ".cursorrules");
    const modern = join(fixture.cwd, ".cursor", "rules", "lytos.mdc");
    writeFileSync(legacy, "first run content\n", "utf-8");

    const first = run("upgrade --migrate-cursor --force", fixture.cwd);
    expect(first.exitCode).toBe(0);
    const afterFirst = readFileSync(modern, "utf-8");

    // Second run: legacy is gone, modern is untouched, no error
    const second = run("upgrade --migrate-cursor --force", fixture.cwd);
    expect(second.exitCode).toBe(0);
    expect(second.stderr).toContain("No legacy .cursorrules");
    expect(readFileSync(modern, "utf-8")).toBe(afterFirst);
  });

  it("warns about a legacy .cursorrules even when --migrate-cursor is omitted (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool none", fixture.cwd);

    // Seed a legacy file without the modern path — the project is on the
    // deprecated Cursor convention but the user ran a plain `lyt upgrade`.
    writeFileSync(join(fixture.cwd, ".cursorrules"), "legacy body\n", "utf-8");

    const result = run("upgrade --force", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("Legacy .cursorrules detected");
    expect(result.stderr).toContain("--migrate-cursor");
    // Legacy file is left in place — the warning is informational only.
    expect(existsSync(join(fixture.cwd, ".cursorrules"))).toBe(true);
  });

  it("does not warn about .cursorrules when the modern path already exists (ISS-0050)", () => {
    fixture = createEmptyFixture();
    run("init --yes --tool none", fixture.cwd);

    // Both files present is the migrated-but-stale case — handled
    // separately by --migrate-cursor's "both-present" branch.
    writeFileSync(join(fixture.cwd, ".cursorrules"), "legacy body\n", "utf-8");
    const modernDir = join(fixture.cwd, ".cursor", "rules");
    mkdirSync(modernDir, { recursive: true });
    writeFileSync(join(modernDir, "lytos.mdc"), "modern body\n", "utf-8");

    const result = run("upgrade --force", fixture.cwd);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain("Legacy .cursorrules detected");
  });
});
