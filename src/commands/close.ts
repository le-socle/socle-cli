/**
 * lyt close ISS-XXXX — Automate the mandatory close phase.
 *
 * Moves issue to done, updates frontmatter with completion date,
 * regenerates board. Warns about unchecked checklist items.
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import {
  locateIssue,
  moveIssue,
  regenerateBoard,
  today,
  countChecklist,
} from "../lib/issue-ops.js";
import { ok, info, warn, error, bold, cyan, green, yellow, dim } from "../lib/output.js";

export const closeCommand = new Command("close")
  .description("Close an issue — move to done, update board")
  .argument("<issue-id>", "Issue ID (e.g. ISS-0029)")
  .option("--force", "Close even with unchecked checklist items", false)
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

    // Edge case: already done
    if (issue.dir === "5-done") {
      if (opts.json) {
        console.log(JSON.stringify({ status: "already-done", id: issueId }));
        return;
      }
      warn(`${issueId} is already done.`);
      process.exit(0);
    }

    // Edge case: not started
    if (issue.dir !== "3-in-progress" && issue.dir !== "4-review") {
      if (opts.json) {
        console.log(JSON.stringify({ status: "error", message: "Cannot close an issue that hasn't been started" }));
      } else {
        error(`Cannot close ${issueId} — it's in ${issue.dir}. Only in-progress or review issues can be closed.`);
      }
      process.exit(1);
    }

    // Check unchecked items
    const checklist = countChecklist(issue.content);
    const unchecked = checklist.total - checklist.done;

    if (unchecked > 0 && !opts.force) {
      if (opts.json) {
        console.log(JSON.stringify({
          status: "blocked",
          message: `${unchecked} unchecked items`,
          unchecked,
          total: checklist.total,
        }));
        process.exit(1);
      }
      console.error("");
      warn(`${cyan(bold(issueId))} has ${yellow(String(unchecked))} unchecked checklist item${unchecked > 1 ? "s" : ""} out of ${checklist.total}.`);
      console.error(`  ${dim("Use")} ${cyan(bold("--force"))} ${dim("to close anyway, or complete the items first.")}`);
      console.error("");
      process.exit(1);
    }

    // 1. Move to done
    moveIssue(lytosDir, issue, "5-done", { updated: today() });

    // 2. Regenerate board
    regenerateBoard(lytosDir);

    if (opts.json) {
      console.log(JSON.stringify({
        status: "closed",
        id: issueId,
        checklist: { done: checklist.done, total: checklist.total },
      }, null, 2));
      return;
    }

    // Display result
    console.error("");
    ok(`${cyan(bold(issueId))} closed`);
    if (checklist.total > 0) {
      info(`Checklist: ${green(`${checklist.done}/${checklist.total}`)} items completed`);
    }
    info("Board regenerated");
    console.error("");
  });
