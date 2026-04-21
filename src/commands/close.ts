/**
 * lyt close [issue-id] — Close one issue, or batch-close every issue
 * currently sitting in 4-review/.
 *
 * - With an argument: moves the named issue from 3-in-progress or 4-review
 *   to 5-done, warns on unchecked checklist items.
 * - Without an argument: lists every issue in 4-review/, prompts for
 *   confirmation, then promotes all of them to 5-done in one pass.
 *
 * Flags: --force (close with unchecked items), --yes (skip the batch
 * prompt), --dry-run (show what would close, change nothing), --json.
 */

import { Command } from "commander";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { createInterface } from "readline";
import {
  locateIssue,
  moveIssue,
  regenerateBoard,
  today,
  countChecklist,
  type IssueLocation,
} from "../lib/issue-ops.js";
import { parseFrontmatter } from "../lib/frontmatter.js";
import { ok, info, warn, error, bold, cyan, green, yellow, dim } from "../lib/output.js";

interface CloseOptions {
  force?: boolean;
  yes?: boolean;
  dryRun?: boolean;
  json?: boolean;
}

async function askConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export const closeCommand = new Command("close")
  .description("Close an issue — single (ISS-XXXX) or batch (all of 4-review)")
  .argument("[issue-id]", "Issue ID (e.g. ISS-0029). Omit to batch-close every issue in 4-review/.")
  .option("--force", "Close even with unchecked checklist items", false)
  .option("--yes", "Skip the batch confirmation prompt", false)
  .option("--dry-run", "Preview what would close, change nothing", false)
  .option("--json", "Output result as JSON", false)
  .on("--help", () => {
    console.log("");
    console.log("Examples:");
    console.log("  lyt close ISS-0053");
    console.log("  lyt close ISS-0053 --force");
    console.log("  lyt close");
    console.log("  lyt close --yes");
    console.log("  lyt close --dry-run");
    console.log("  lyt close --yes --force");
  })
  .action(async (issueId: string | undefined, opts: CloseOptions) => {
    const cwd = process.cwd();
    const lytosDir = resolve(cwd, ".lytos");

    if (!existsSync(lytosDir)) {
      error("No .lytos/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    if (issueId) {
      await closeSingle(lytosDir, issueId, opts);
    } else {
      await closeBatch(lytosDir, opts);
    }
  });

// ---------------------------------------------------------------------------
// Single-issue flow
// ---------------------------------------------------------------------------

async function closeSingle(lytosDir: string, issueId: string, opts: CloseOptions): Promise<void> {
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

  if (opts.dryRun) {
    if (opts.json) {
      console.log(JSON.stringify({ status: "dry-run", id: issueId, from: issue.dir, to: "5-done" }));
      return;
    }
    info(`Would close ${cyan(bold(issueId))} (${issue.dir} → 5-done)`);
    return;
  }

  moveIssue(lytosDir, issue, "5-done", { updated: today() });
  regenerateBoard(lytosDir);

  if (opts.json) {
    console.log(JSON.stringify({
      status: "closed",
      id: issueId,
      checklist: { done: checklist.done, total: checklist.total },
    }, null, 2));
    return;
  }

  console.error("");
  ok(`${cyan(bold(issueId))} closed`);
  if (checklist.total > 0) {
    info(`Checklist: ${green(`${checklist.done}/${checklist.total}`)} items completed`);
  }
  info("Board regenerated");
  console.error("");
}

// ---------------------------------------------------------------------------
// Batch flow — every issue in 4-review/ → 5-done/
// ---------------------------------------------------------------------------

interface ReviewCandidate {
  issue: IssueLocation;
  done: number;
  total: number;
  unchecked: number;
}

async function closeBatch(lytosDir: string, opts: CloseOptions): Promise<void> {
  const reviewDir = join(lytosDir, "issue-board", "4-review");
  const candidates: ReviewCandidate[] = [];

  if (existsSync(reviewDir)) {
    const files = readdirSync(reviewDir).filter((f) => f.startsWith("ISS-") && f.endsWith(".md"));
    for (const fileName of files) {
      const filePath = join(reviewDir, fileName);
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);
      if (!fm) continue;
      const checklist = countChecklist(content);
      candidates.push({
        issue: { filePath, fileName, dir: "4-review", content, frontmatter: fm },
        done: checklist.done,
        total: checklist.total,
        unchecked: checklist.total - checklist.done,
      });
    }
  }

  if (candidates.length === 0) {
    if (opts.json) {
      console.log(JSON.stringify({ status: "empty", closed: [], skipped: [] }));
      return;
    }
    info("No issues in 4-review. Nothing to close.");
    return;
  }

  // Non-TTY safeguard: refuse to prompt silently
  if (!opts.yes && !opts.dryRun && !opts.json && !process.stdin.isTTY) {
    error("Batch close requires --yes in non-interactive mode.");
    process.exit(2);
  }

  // Preview
  if (!opts.json) {
    console.error("");
    info(`Issues in 4-review (${candidates.length}):`);
    console.error("");
    for (const c of candidates) {
      const id = String(c.issue.frontmatter.id ?? c.issue.fileName.replace(/\.md$/, ""));
      const title = String(c.issue.frontmatter.title ?? "").replace(/^"|"$/g, "");
      const checklistStr = c.total > 0
        ? `${c.done}/${c.total} items${c.unchecked > 0 ? " " + yellow("⚠") : ""}`
        : dim("(no checklist)");
      console.error(`  ${cyan(bold(id))}   ${title} — ${checklistStr}`);
    }
    console.error("");
  }

  if (opts.dryRun) {
    if (opts.json) {
      console.log(JSON.stringify({
        status: "dry-run",
        candidates: candidates.map((c) => ({
          id: c.issue.frontmatter.id,
          unchecked: c.unchecked,
          wouldSkip: c.unchecked > 0 && !opts.force,
        })),
      }, null, 2));
      return;
    }
    info("Dry run — no changes applied.");
    return;
  }

  // Confirm (unless --yes)
  if (!opts.yes && !opts.json) {
    const confirm = await askConfirm(`Promote all ${candidates.length} to 5-done? [y/N] `);
    if (!confirm) {
      info("Cancelled.");
      return;
    }
  }

  // Promote
  const closed: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const c of candidates) {
    const id = String(c.issue.frontmatter.id ?? c.issue.fileName.replace(/\.md$/, ""));

    if (c.unchecked > 0 && !opts.force) {
      skipped.push({ id, reason: `${c.unchecked} unchecked checklist item${c.unchecked > 1 ? "s" : ""}` });
      if (!opts.json) {
        warn(`${cyan(bold(id))} skipped — ${c.unchecked} unchecked item${c.unchecked > 1 ? "s" : ""} (use --force to close anyway)`);
      }
      continue;
    }

    moveIssue(lytosDir, c.issue, "5-done", { updated: today() });
    closed.push(id);
    if (!opts.json) {
      ok(`${cyan(bold(id))} closed`);
    }
  }

  // One board regen at the end
  if (closed.length > 0) {
    regenerateBoard(lytosDir);
  }

  if (opts.json) {
    console.log(JSON.stringify({
      status: "done",
      closed,
      skipped,
    }, null, 2));
    return;
  }

  console.error("");
  const parts = [`${closed.length} closed`];
  if (skipped.length > 0) parts.push(`${skipped.length} skipped`);
  info(parts.join(" · "));
  if (closed.length > 0) info("Board regenerated");
  console.error("");
}
