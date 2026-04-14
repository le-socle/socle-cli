import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";

const CLI_PATH = resolve(__dirname, "../dist/cli.js");

function run(args: string): string {
  return execSync(`node ${CLI_PATH} ${args}`, { encoding: "utf-8" }).trim();
}

describe("lytos CLI", () => {
  it("shows help", () => {
    const output = run("--help");
    expect(output).toContain("Lytos");
    expect(output).toContain("Options:");
  });

  it("shows version", () => {
    const output = run("--version");
    expect(output).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
