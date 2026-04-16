/**
 * lyt show [ISS-XXXX] — Display issue detail with progress.
 *
 * With an argument: shows a single issue with checklist, progress bar,
 * metadata, and dependency status.
 * Without argument: shows all in-progress issues with progress summary.
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import {
  parseIssueDetail,
  getInProgressSummaries,
  type IssueDetail,
  type IssueSummary,
} from "../lib/show.js";
import { ok, error, bold, green, red, yellow, blue, dim } from "../lib/output.js";

function progressBar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const colorFn = percent === 100 ? green : percent >= 50 ? yellow : red;
  return `${colorFn("█".repeat(filled))}${dim("░".repeat(empty))}`;
}

function statusLabel(status: string): string {
  const labels: Record<string, (t: string) => string> = {
    "0-icebox": dim,
    "1-backlog": dim,
    "2-sprint": blue,
    "3-in-progress": yellow,
    "4-review": blue,
    "5-done": green,
  };
  const colorFn = labels[status] || dim;
  return colorFn(status);
}

function displayDetail(issue: IssueDetail): void {
  const titleLine = `${bold(issue.id)} — ${bold(issue.title)}`;
  const metaLine = `${statusLabel(issue.status)}  ${dim("·")}  Effort: ${issue.effort}  ${dim("·")}  ${issue.daysOpen}d`;

  console.error("");
  console.error(`  ┌${"─".repeat(56)}┐`);
  console.error(`  │  ${titleLine}`);
  console.error(`  │  ${metaLine}`);
  console.error(`  ├${"─".repeat(56)}┤`);

  // Progress
  if (issue.checklistTotal > 0) {
    const pct = issue.progress;
    const colorFn = pct === 100 ? green : pct >= 50 ? yellow : red;
    console.error(`  │`);
    console.error(`  │  Progress  ${progressBar(pct)}  ${colorFn(bold(`${issue.checklistDone}/${issue.checklistTotal}`))} ${colorFn(`${pct}%`)}`);
    console.error(`  │`);

    // Checklist
    for (const item of issue.checklist) {
      const icon = item.done ? green("✓") : dim("○");
      const text = item.done ? dim(item.text) : item.text;
      console.error(`  │  ${icon} ${text}`);
    }
  } else {
    console.error(`  │`);
    console.error(`  │  ${dim("No checklist items found")}`);
  }

  console.error(`  │`);

  // Metadata
  if (issue.skill) {
    console.error(`  │  ${dim("Skill:")} ${issue.skill}`);
  }
  if (issue.skillsAux.length > 0) {
    console.error(`  │  ${dim("Aux:")} ${issue.skillsAux.join(", ")}`);
  }
  if (issue.branch) {
    console.error(`  │  ${dim("Branch:")} ${issue.branch}`);
  }
  if (issue.complexity) {
    console.error(`  │  ${dim("Complexity:")} ${issue.complexity}`);
  }

  // Dependencies
  if (issue.dependencies.length > 0) {
    console.error(`  │`);
    console.error(`  │  ${dim("Dependencies:")}`);
    for (const dep of issue.dependencies) {
      const icon = dep.done ? green("✓") : yellow("○");
      const status = dep.done ? green("done") : yellow("pending");
      console.error(`  │    ${icon} ${dep.id} ${dim("—")} ${dep.title} ${dim("(")}${status}${dim(")")}`);
    }
  }

  console.error(`  │`);
  console.error(`  └${"─".repeat(56)}┘`);
  console.error("");
}

function displaySummaries(summaries: IssueSummary[]): void {
  console.error("");
  console.error(`  ${bold("In Progress")} ${dim(`(${summaries.length})`)}`);
  console.error("");

  for (const s of summaries) {
    const pct = s.progress;
    const colorFn = pct === 100 ? green : pct >= 50 ? yellow : red;
    const progressStr = s.checklistTotal > 0
      ? `${progressBar(pct, 15)}  ${colorFn(`${s.checklistDone}/${s.checklistTotal}`)} ${colorFn(`${pct}%`)}`
      : dim("no checklist");

    console.error(`  ${dim(s.id)}  ${bold(s.title)}`);
    console.error(`           ${progressStr}  ${dim(`·  ${s.effort}  ·  ${s.daysOpen}d`)}`);
    console.error("");
  }
}

export const showCommand = new Command("show")
  .description("Display issue detail with progress, or all in-progress issues")
  .argument("[issue-id]", "Issue ID (e.g. ISS-0028)")
  .option("--json", "Output as JSON", false)
  .action((issueId: string | undefined, opts) => {
    const cwd = process.cwd();
    const lytosDir = resolve(cwd, ".lytos");

    if (!existsSync(lytosDir)) {
      error("No .lytos/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    if (issueId) {
      // Single issue detail
      const detail = parseIssueDetail(lytosDir, issueId);
      if (!detail) {
        error(`Issue ${issueId} not found on the board.`);
        process.exit(1);
      }

      if (opts.json) {
        console.log(JSON.stringify(detail, null, 2));
      } else {
        displayDetail(detail);
      }
    } else {
      // All in-progress issues
      const summaries = getInProgressSummaries(lytosDir);

      if (opts.json) {
        console.log(JSON.stringify(summaries, null, 2));
        return;
      }

      if (summaries.length === 0) {
        console.error("");
        ok("No issues in progress.");
        console.error("");
        return;
      }

      displaySummaries(summaries);
    }
  });
