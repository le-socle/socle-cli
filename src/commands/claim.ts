/**
 * lyt claim ISS-XXXX — assign an issue to the current git user and move to in-progress.
 * lyt unclaim ISS-XXXX — remove assignment and move back to sprint.
 */

import { Command } from "commander";
import { execFileSync } from "child_process";
import { writeFileSync, renameSync } from "fs";
import { join } from "path";
import { existsSync } from "fs";
import { locateIssue, ensureBranch, regenerateBoard, today, checkOriginFresh } from "../lib/issue-ops.js";
import { serializeFrontmatter } from "../lib/frontmatter.js";
import { ok, error, info, warn, cyan, bold } from "../lib/output.js";

function findLytosDir(cwd: string): string | null {
  const candidate = join(cwd, ".lytos");
  return existsSync(candidate) ? candidate : null;
}

function getGitUser(): string {
  try {
    return execFileSync("git", ["config", "user.name"], { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function updateAndMove(
  lytosDir: string,
  filePath: string,
  fileName: string,
  content: string,
  fm: Record<string, string | string[]>,
  targetDir: string
): void {
  const boardDir = join(lytosDir, "issue-board");
  const targetPath = join(boardDir, targetDir, fileName);
  const fmStr = serializeFrontmatter(fm);
  const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : "";
  writeFileSync(filePath, fmStr + "\n" + body);
  renameSync(filePath, targetPath);
}

export const claimCommand = new Command("claim")
  .description("Assign an issue to yourself and move it to in-progress")
  .argument("<issue-id>", "Issue ID (e.g. ISS-0012)")
  .option("--force", "Claim even if already assigned to someone else")
  .on("--help", () => {
    console.log("");
    console.log("Examples:");
    console.log("  lyt claim ISS-0042");
    console.log("  lyt claim ISS-0042 --force");
  })
  .action((issueId: string, opts: { force?: boolean }) => {
    const cwd = process.cwd();
    const lytosDir = findLytosDir(cwd);
    if (!lytosDir) { error("No .lytos/ directory found. Run `lyt init` first."); process.exit(2); }

    const issue = locateIssue(lytosDir, issueId);
    if (!issue) { error(`Issue ${issueId} not found.`); process.exit(1); }

    const currentAssignee = issue.frontmatter.assignee;
    const gitUser = getGitUser();

    if (currentAssignee && currentAssignee !== gitUser && !opts.force) {
      error(`${issueId} is already claimed by @${currentAssignee}`);
      info("Use --force to override.");
      process.exit(1);
    }

    // Origin-freshness check: refuse to claim against a stale local main or
    // when the issue is already in 3-in-progress on origin under someone else.
    if (!opts.force) {
      const check = checkOriginFresh(lytosDir, issueId, gitUser);
      if (check.status === "behind" || check.status === "diverged") {
        error(check.message!);
        process.exit(1);
      }
      if (check.status === "already-claimed") {
        error(check.message!);
        process.exit(1);
      }
      if (check.status === "offline") {
        warn(check.message!);
      }
    }

    const branch = typeof issue.frontmatter.branch === "string"
      ? issue.frontmatter.branch
      : `feat/${issueId.toLowerCase()}-work`;

    const updatedFm = { ...issue.frontmatter, status: "3-in-progress", assignee: gitUser, updated: today() };
    updateAndMove(lytosDir, issue.filePath, issue.fileName, issue.content, updatedFm, "3-in-progress");
    ensureBranch(branch);
    regenerateBoard(lytosDir);

    ok(`${cyan(bold(issueId))} claimed by @${gitUser}`);
    info(`Branch: ${branch}`);
  });

export const unclaimCommand = new Command("unclaim")
  .description("Remove your assignment from an issue and move it back to sprint")
  .argument("<issue-id>", "Issue ID (e.g. ISS-0012)")
  .option("--force", "Unclaim even if assigned to someone else")
  .on("--help", () => {
    console.log("");
    console.log("Examples:");
    console.log("  lyt unclaim ISS-0042");
    console.log("  lyt unclaim ISS-0042 --force");
  })
  .action((issueId: string, opts: { force?: boolean }) => {
    const cwd = process.cwd();
    const lytosDir = findLytosDir(cwd);
    if (!lytosDir) { error("No .lytos/ directory found. Run `lyt init` first."); process.exit(2); }

    const issue = locateIssue(lytosDir, issueId);
    if (!issue) { error(`Issue ${issueId} not found.`); process.exit(1); }

    const currentAssignee = issue.frontmatter.assignee;
    const gitUser = getGitUser();

    if (currentAssignee && currentAssignee !== gitUser && !opts.force) {
      error(`${issueId} is claimed by @${currentAssignee}, not you.`);
      info("Use --force to override.");
      process.exit(1);
    }

    const updatedFm = { ...issue.frontmatter };
    delete updatedFm.assignee;
    updatedFm.status = "2-sprint";
    updatedFm.updated = today();

    updateAndMove(lytosDir, issue.filePath, issue.fileName, issue.content, updatedFm, "2-sprint");
    regenerateBoard(lytosDir);

    ok(`${cyan(bold(issueId))} unclaimed`);
  });
