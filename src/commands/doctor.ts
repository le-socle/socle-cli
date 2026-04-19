/**
 * lyt doctor — Full diagnostic of .lytos/ health.
 *
 * Goes beyond lint: checks broken links, stale memory,
 * missing skills, orphan dependencies, and computes a health score.
 * Usable in CI (exit code 1 = errors found).
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { diagnose, type DiagnosticResult } from "../lib/doctor.js";
import { ok, error, bold, green, red, yellow, blue, cyan, dim } from "../lib/output.js";

const CATEGORY_LABELS: Record<string, string> = {
  "broken-link": "Broken Links",
  "stale-memory": "Stale Memory",
  "missing-skill": "Missing Skills",
  "status-mismatch": "Status Mismatches",
  "orphan-dependency": "Orphan Dependencies",
};

function scoreColor(score: number): (t: string) => string {
  if (score >= 80) return green;
  if (score >= 50) return yellow;
  return red;
}

function displayResults(result: DiagnosticResult): void {
  console.error("");

  if (result.findings.length === 0) {
    ok(`${green(bold("All diagnostics passed"))} — ${result.filesChecked} files checked`);
    console.error("");
    displayScore(result.score);
    return;
  }

  // Group by category
  const byCategory = new Map<string, typeof result.findings>();
  for (const f of result.findings) {
    const existing = byCategory.get(f.category) || [];
    existing.push(f);
    byCategory.set(f.category, existing);
  }

  for (const [category, findings] of byCategory) {
    const label = CATEGORY_LABELS[category] || category;
    console.error(`  ${cyan(bold(label))}`);

    for (const f of findings) {
      const icon =
        f.severity === "error" ? red("✗") :
        f.severity === "warning" ? yellow("!") :
        blue("·");
      console.error(`    ${icon} ${dim(f.file)} ${f.message}`);
      console.error(`      ${dim("→")} ${dim(f.fix)}`);
    }
    console.error("");
  }

  // Summary line
  const parts: string[] = [];
  parts.push(`${result.filesChecked} files checked`);
  if (result.errors > 0) {
    parts.push(red(`${result.errors} error${result.errors > 1 ? "s" : ""}`));
  }
  if (result.warnings > 0) {
    parts.push(yellow(`${result.warnings} warning${result.warnings > 1 ? "s" : ""}`));
  }
  if (result.infos > 0) {
    parts.push(blue(`${result.infos} info${result.infos > 1 ? "s" : ""}`));
  }
  console.error(`  ${parts.join(dim(" · "))}`);
  console.error("");

  displayScore(result.score);
}

function displayScore(score: number): void {
  const colorFn = scoreColor(score);
  const bar = buildScoreBar(score);
  console.error(`  ${cyan(bold("Health score:"))} ${colorFn(bold(`${score}%`))} ${bar}`);
  console.error("");
}

function buildScoreBar(score: number): string {
  const width = 20;
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  const colorFn = scoreColor(score);
  return `${colorFn("█".repeat(filled))}${dim("░".repeat(empty))}`;
}

export const doctorCommand = new Command("doctor")
  .description("Full diagnostic — broken links, stale memory, missing skills, health score")
  .option("--json", "Output diagnostics as JSON", false)
  .action((opts) => {
    const cwd = process.cwd();
    const lytosDir = resolve(cwd, ".lytos");

    if (!existsSync(lytosDir)) {
      error("No .lytos/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    const result = diagnose(lytosDir);

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      displayResults(result);
    }

    if (result.errors > 0) {
      process.exit(1);
    }
  });
