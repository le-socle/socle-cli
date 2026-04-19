/**
 * Integration tests for `lytos init`.
 *
 * Each test runs the actual CLI binary in a temp directory,
 * then checks the file system and output.
 */

import { describe, it, expect, afterEach } from "vitest";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import {
  createEmptyFixture,
  createNodeProjectFixture,
  type Fixture,
} from "../helpers/fixtures.js";

const CLI = resolve(__dirname, "../../dist/cli.js");

function run(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout || "",
      stderr: e.stderr || "",
      exitCode: e.status || 1,
    };
  }
}

let fixture: Fixture;

afterEach(() => {
  if (fixture) fixture.cleanup();
});

describe("lytos init", () => {
  it("creates .lytos/ directory with essential files", () => {
    fixture = createEmptyFixture();
    const result = run('init --name "Test Project" --tool none --yes', fixture.cwd);

    // Should succeed
    expect(result.exitCode).toBe(0);

    // Essential directories exist
    expect(existsSync(join(fixture.cwd, ".lytos"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos", "memory", "cortex"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos", "issue-board", "3-in-progress"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos", "skills"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos", "rules"))).toBe(true);

    // Essential files exist
    expect(existsSync(join(fixture.cwd, ".lytos", "manifest.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos", "memory", "MEMORY.md"))).toBe(true);
    expect(existsSync(join(fixture.cwd, ".lytos", "issue-board", "BOARD.md"))).toBe(true);
  });

  it("pre-fills manifest with project name", () => {
    fixture = createEmptyFixture();
    run('init --name "My Awesome API" --tool none --yes', fixture.cwd);

    const manifest = readFileSync(
      join(fixture.cwd, ".lytos", "manifest.md"),
      "utf-8"
    );

    expect(manifest).toContain("# Manifest — My Awesome API");
    expect(manifest).toContain("| Name | My Awesome API |");
  });

  it("detects Node.js/TypeScript stack from package.json", () => {
    fixture = createNodeProjectFixture();
    run('init --name "Test" --tool none --yes', fixture.cwd);

    const manifest = readFileSync(
      join(fixture.cwd, ".lytos", "manifest.md"),
      "utf-8"
    );

    expect(manifest).toContain("TypeScript");
    expect(manifest).toContain("Next.js");
    expect(manifest).toContain("Vitest");
  });

  it("creates CLAUDE.md when --tool claude", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool claude --yes', fixture.cwd);

    expect(existsSync(join(fixture.cwd, "CLAUDE.md"))).toBe(true);

    const content = readFileSync(join(fixture.cwd, "CLAUDE.md"), "utf-8");
    expect(content).toContain("Lytos");
    expect(content).toContain("manifest.md");
  });

  it("creates .cursorrules when --tool cursor", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool cursor --yes', fixture.cwd);

    expect(existsSync(join(fixture.cwd, ".cursorrules"))).toBe(true);
  });

  it("does not create tool config when --tool none", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool none --yes', fixture.cwd);

    expect(existsSync(join(fixture.cwd, "CLAUDE.md"))).toBe(false);
    expect(existsSync(join(fixture.cwd, ".cursorrules"))).toBe(false);
  });

  it("fails if .lytos/ already exists", () => {
    fixture = createEmptyFixture();
    // First init
    run('init --name "Test" --tool none --yes', fixture.cwd);
    // Second init should fail
    const result = run('init --name "Test" --tool none --yes', fixture.cwd);

    expect(result.exitCode).toBe(2);
  });

  it("succeeds with --force when .lytos/ already exists", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool none --yes', fixture.cwd);
    const result = run('init --name "Test v2" --tool none --yes --force', fixture.cwd);

    expect(result.exitCode).toBe(0);

    const manifest = readFileSync(
      join(fixture.cwd, ".lytos", "manifest.md"),
      "utf-8"
    );
    expect(manifest).toContain("Test v2");
  });

  it("generates English manifest with --lang en", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool none --lang en --yes', fixture.cwd);

    const manifest = readFileSync(
      join(fixture.cwd, ".lytos", "manifest.md"),
      "utf-8"
    );

    // English section headers and stack labels
    expect(manifest).toContain("Why this project exists");
    expect(manifest).toContain("Tech stack");
    expect(manifest).toContain("| Language |");
    expect(manifest).toContain("| Framework |");
    expect(manifest).toContain("| Database |");
    expect(manifest).toContain("| Tests |");
    expect(manifest).not.toContain("Pourquoi ce projet existe");
  });

  it("generates French manifest with --lang fr (including stack labels)", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool none --lang fr --yes', fixture.cwd);

    const manifest = readFileSync(
      join(fixture.cwd, ".lytos", "manifest.md"),
      "utf-8"
    );

    // French section headers
    expect(manifest).toContain("Pourquoi ce projet existe");
    expect(manifest).toContain("Stack technique");
    // French stack row labels (the bug this test pins)
    expect(manifest).toContain("| Langage |");
    expect(manifest).toContain("| Base de données |");
    // English labels must not leak into French manifest
    expect(manifest).not.toContain("| Language |");
    expect(manifest).not.toContain("| Database |");
    expect(manifest).not.toContain("Why this project exists");
  });

  it("generates French memory with --lang fr", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool none --lang fr --yes', fixture.cwd);

    const memory = readFileSync(
      join(fixture.cwd, ".lytos", "memory", "MEMORY.md"),
      "utf-8"
    );
    expect(memory).toContain("Mémoire");
  });

  it("creates cortex files with example content", () => {
    fixture = createEmptyFixture();
    run('init --name "Test" --tool none --yes', fixture.cwd);

    const arch = readFileSync(
      join(fixture.cwd, ".lytos", "memory", "cortex", "architecture.md"),
      "utf-8"
    );
    expect(arch).toContain("Architecture");
    expect(arch).toContain("Example to adapt or remove");
  });

  it("detects Python stack from requirements.txt", () => {
    fixture = createEmptyFixture();
    writeFileSync(
      join(fixture.cwd, "requirements.txt"),
      "fastapi==0.110.0\nsqlalchemy==2.0.0\npytest==8.0.0\n"
    );
    run('init --name "Test" --tool none --yes', fixture.cwd);

    const manifest = readFileSync(
      join(fixture.cwd, ".lytos", "manifest.md"),
      "utf-8"
    );
    expect(manifest).toContain("Python");
    expect(manifest).toContain("FastAPI");
    expect(manifest).toContain("Pytest");
  });
});
