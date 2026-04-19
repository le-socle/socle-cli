/**
 * lyt start ISS-XXXX — Automate the mandatory start phase.
 *
 * Moves issue to in-progress, updates frontmatter, regenerates
 * board, and creates the git branch. One command, zero friction.
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import {
  locateIssue,
  moveIssue,
  regenerateBoard,
  ensureBranch,
} from "../lib/issue-ops.js";
import { parseIssueDetail } from "../lib/show.js";
import { ok, info, warn, error, bold, cyan, green } from "../lib/output.js";

export const startCommand = new Command("start")
  .description("Start working on an issue — move to in-progress, create branch, update board")
  .argument("<issue-id>", "Issue ID (e.g. ISS-0029)")
  .option("--json", "Output result as JSON", false)
  .action((issueId: string, opts) => {
    const cwd = process.cwd();
    const lytosDir = resolve(cwd, ".lytos");

    if (!existsSync(lytosDir)) {
      error("No .lytos/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    const issue = locateIssue(lytosDir, issueId);
    if (!issue) {
      error(`Issue ${issueId} not found on the board.`);
      process.exit(1);
    }

    // Edge case: already in-progress
    if (issue.dir === "3-in-progress") {
      if (opts.json) {
        console.log(JSON.stringify({ status: "already-in-progress", id: issueId }));
        return;
      }
      warn(`${issueId} is already in progress.`);
      process.exit(0);
    }

    // Edge case: done
    if (issue.dir === "5-done") {
      if (opts.json) {
        console.log(JSON.stringify({ status: "error", message: "Cannot start a done issue" }));
      } else {
        error(`Cannot start ${issueId} — it's already done.`);
      }
      process.exit(1);
    }

    // 1. Move to in-progress
    moveIssue(lytosDir, issue, "3-in-progress");

    // 2. Regenerate board
    regenerateBoard(lytosDir);

    // 3. Create/switch to branch
    const branchName = typeof issue.frontmatter.branch === "string" && issue.frontmatter.branch
      ? issue.frontmatter.branch
      : buildBranchName(issue.frontmatter);

    const branchResult = ensureBranch(branchName);

    if (opts.json) {
      const detail = parseIssueDetail(lytosDir, issueId);
      console.log(JSON.stringify({
        status: "started",
        branch: branchName,
        branchAction: branchResult,
        issue: detail,
      }, null, 2));
      return;
    }

    // Display result
    console.error("");
    ok(`${cyan(bold(issueId))} started`);
    console.error("");

    if (branchResult === "created") {
      info(`Branch ${green(branchName)} created`);
    } else if (branchResult === "switched") {
      info(`Switched to existing branch ${green(branchName)}`);
    } else if (branchResult === "invalid") {
      warn(`Branch name "${branchName}" contains invalid characters — create it manually`);
    } else {
      warn(`Could not create branch ${branchName} — create it manually`);
    }

    info("Board regenerated");
    console.error("");
  });

function buildBranchName(fm: Record<string, string | string[]>): string {
  const type = typeof fm.type === "string" ? fm.type : "feat";
  const id = typeof fm.id === "string" ? fm.id : "ISS-0000";
  const title = typeof fm.title === "string" ? fm.title : "untitled";
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${type}/${id}-${slug}`;
}
