/**
 * Integration tests for `lyt upgrade`.
 *
 * Covers: fresh .lytos/ (everything up to date), modified file with --force,
 * missing file auto-added, --dry-run listing, no .lytos/ → exit 2.
 */

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
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
});
