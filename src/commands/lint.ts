/**
 * lyt lint — Validate .lytos/ structure and content.
 *
 * Checks required files, manifest sections, issue frontmatter,
 * and detects placeholder text. Usable in CI (exit code 1 = problems).
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { lint, type LintResult } from "../lib/linter.js";
import { ok, error, bold, red, yellow, cyan, green, dim } from "../lib/output.js";

function displayResults(result: LintResult): void {
  if (result.findings.length === 0) {
    console.error("");
    ok(`${green(bold("All checks passed"))} — ${result.filesChecked} files checked`);
    console.error("");
    return;
  }

  console.error("");

  // Group by file
  const byFile = new Map<string, typeof result.findings>();
  for (const f of result.findings) {
    const existing = byFile.get(f.file) || [];
    existing.push(f);
    byFile.set(f.file, existing);
  }

  for (const [file, findings] of byFile) {
    console.error(`  ${cyan(bold(file))}`);
    for (const f of findings) {
      const icon = f.severity === "error" ? red("✗") : yellow("!");
      console.error(`    ${icon} ${f.message}`);
      console.error(`      ${dim("→")} ${dim(f.fix)}`);
    }
    console.error("");
  }

  // Summary
  const parts: string[] = [];
  parts.push(`${result.filesChecked} files checked`);
  if (result.errors > 0) {
    parts.push(red(`${result.errors} error${result.errors > 1 ? "s" : ""}`));
  }
  if (result.warnings > 0) {
    parts.push(yellow(`${result.warnings} warning${result.warnings > 1 ? "s" : ""}`));
  }
  console.error(`  ${parts.join(dim(" · "))}`);
  console.error("");
}

export const lintCommand = new Command("lint")
  .description("Validate .lytos/ structure and content")
  .option("--json", "Output findings as JSON", false)
  .action((opts) => {
    const cwd = process.cwd();
    const lytosDir = resolve(cwd, ".lytos");

    if (!existsSync(lytosDir)) {
      error("No .lytos/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    const result = lint(lytosDir);

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      displayResults(result);
    }

    // Exit code: 0 = clean, 1 = errors found
    if (result.errors > 0) {
      process.exit(1);
    }
  });
