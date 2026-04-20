/**
 * Issue operations — move, update frontmatter, and regenerate board.
 *
 * Shared logic for lyt start and lyt close commands.
 * Zero dependencies beyond Node.js stdlib.
 */

import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { parseFrontmatter, serializeFrontmatter } from "./frontmatter.js";
import { collectIssues, generateBoardMarkdown } from "./board-generator.js";

const STATUS_DIRS = [
  "0-icebox", "1-backlog", "2-sprint",
  "3-in-progress", "4-review", "5-done",
];

export interface IssueLocation {
  filePath: string;
  fileName: string;
  dir: string;
  content: string;
  frontmatter: Record<string, string | string[]>;
}

/**
 * Find an issue by ID across all status directories.
 */
export function locateIssue(lytosDir: string, issueId: string): IssueLocation | null {
  const boardDir = join(lytosDir, "issue-board");
  if (!existsSync(boardDir)) return null;

  const normalizedId = issueId.toUpperCase();

  for (const dir of STATUS_DIRS) {
    const dirPath = join(boardDir, dir);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath).filter(
      (f) => f.endsWith(".md") && f.toUpperCase().startsWith(normalizedId)
    );

    if (files.length > 0) {
      const filePath = join(dirPath, files[0]);
      const content = readFileSync(filePath, "utf-8");
      const frontmatter = parseFrontmatter(content);
      if (!frontmatter) return null;

      return {
        filePath,
        fileName: files[0],
        dir,
        content,
        frontmatter,
      };
    }
  }

  return null;
}

/**
 * Move an issue file to a new status directory and update its frontmatter.
 */
export function moveIssue(
  lytosDir: string,
  issue: IssueLocation,
  targetDir: string,
  extraFields?: Record<string, string>
): string {
  const boardDir = join(lytosDir, "issue-board");
  const targetPath = join(boardDir, targetDir, issue.fileName);

  // Update frontmatter
  const updatedFm: Record<string, string | string[]> = { ...issue.frontmatter, status: targetDir };
  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      updatedFm[key] = value;
    }
  }

  // Rebuild file content with updated frontmatter
  const fmStr = serializeFrontmatter(updatedFm);
  const bodyMatch = issue.content.match(/^---[\s\S]*?---\s*\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : "";
  const newContent = fmStr + "\n" + body;

  // Write updated content then move
  writeFileSync(issue.filePath, newContent);
  renameSync(issue.filePath, targetPath);

  return targetPath;
}

/**
 * Regenerate BOARD.md from current issue files.
 */
export function regenerateBoard(lytosDir: string): void {
  const boardDir = join(lytosDir, "issue-board");
  const issues = collectIssues(boardDir);
  const markdown = generateBoardMarkdown(issues);
  writeFileSync(join(boardDir, "BOARD.md"), markdown);
}

/**
 * Validate a branch name — reject shell metacharacters.
 * Only allows: a-z, A-Z, 0-9, hyphens, underscores, slashes, dots.
 */
export function isValidBranchName(name: string): boolean {
  return /^[a-zA-Z0-9/_.\-]+$/.test(name) && name.length > 0 && name.length <= 200;
}

/**
 * Create a git branch if it doesn't already exist.
 * Returns "created", "switched", "invalid", or "error".
 * Uses execFileSync (no shell) to prevent command injection.
 */
export function ensureBranch(branchName: string): "created" | "switched" | "invalid" | "error" {
  if (!isValidBranchName(branchName)) {
    return "invalid";
  }

  try {
    // Check if branch exists (no shell — safe)
    const branches = execFileSync("git", ["branch", "--list"], { encoding: "utf-8" });
    const exists = branches.split("\n").some(
      (b) => b.trim().replace("* ", "") === branchName
    );

    if (exists) {
      execFileSync("git", ["checkout", branchName], { stdio: "pipe" });
      return "switched";
    }

    execFileSync("git", ["checkout", "-b", branchName], { stdio: "pipe" });
    return "created";
  } catch {
    return "error";
  }
}

/**
 * Get today's date as YYYY-MM-DD.
 */
export function today(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/**
 * Result of an origin-freshness check before claiming / starting an issue.
 *
 * - `ok`              : origin is reachable and the issue is free to claim locally
 * - `behind`          : local main is behind origin — user must `git pull` first
 * - `diverged`        : local main has diverged from origin — user must resolve
 * - `already-claimed` : the same issue is in 3-in-progress on origin with a
 *                       different assignee — likely a concurrent claim
 * - `offline`         : `git fetch` failed (network or auth). Caller should warn
 *                       and proceed with local state only.
 * - `not-applicable`  : not a git repo / no origin remote / origin has no main.
 *                       Caller should skip the check silently.
 */
export interface OriginCheckResult {
  status: "ok" | "behind" | "diverged" | "already-claimed" | "offline" | "not-applicable";
  message?: string;
  assignee?: string;
}

/**
 * Check that the local main is fresh against origin AND that the given issue
 * isn't already claimed on origin by someone else. Used by `lyt claim` and
 * `lyt start` to prevent concurrent claims.
 *
 * All git calls are network-timeout-bounded and `stdio: "pipe"` so this never
 * leaks noise into the caller's output.
 */
export function checkOriginFresh(
  lytosDir: string,
  issueId: string,
  gitUser: string,
  opts: { mainBranch?: string; fetchTimeoutMs?: number } = {}
): OriginCheckResult {
  const mainBranch = opts.mainBranch ?? "main";
  const fetchTimeoutMs = opts.fetchTimeoutMs ?? 10_000;

  // Not a git repo → skip silently
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "pipe" });
  } catch {
    return { status: "not-applicable" };
  }

  // No origin remote → skip silently
  try {
    execFileSync("git", ["remote", "get-url", "origin"], { stdio: "pipe" });
  } catch {
    return { status: "not-applicable" };
  }

  // Fetch (best effort)
  try {
    execFileSync("git", ["fetch", "--quiet", "origin", mainBranch], {
      stdio: "pipe",
      timeout: fetchTimeoutMs,
    });
  } catch {
    return { status: "offline", message: `Could not fetch origin/${mainBranch} — proceeding with local state only` };
  }

  // origin/main exists?
  try {
    execFileSync("git", ["rev-parse", "--verify", `origin/${mainBranch}`], { stdio: "pipe" });
  } catch {
    return { status: "not-applicable" };
  }

  // Check ancestry
  let localIsAncestor = false;
  let originIsAncestor = false;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", mainBranch, `origin/${mainBranch}`], { stdio: "pipe" });
    localIsAncestor = true;
  } catch { /* non-zero exit = not an ancestor */ }
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", `origin/${mainBranch}`, mainBranch], { stdio: "pipe" });
    originIsAncestor = true;
  } catch { /* non-zero exit = not an ancestor */ }

  if (localIsAncestor && !originIsAncestor) {
    return {
      status: "behind",
      message: `Your local ${mainBranch} is behind origin. Run \`git pull\` on ${mainBranch}, then retry.`,
    };
  }
  if (!localIsAncestor && !originIsAncestor) {
    return {
      status: "diverged",
      message: `Your local ${mainBranch} has diverged from origin. Resolve before claiming.`,
    };
  }
  // Else: local == origin, or local is ahead (unpushed commits). Both are fine.

  // Is the same issue already in 3-in-progress on origin, with a different assignee?
  const normalizedId = issueId.toUpperCase();
  let pathOnOrigin: string | null = null;
  try {
    const out = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", `origin/${mainBranch}`, ".lytos/issue-board/"],
      { encoding: "utf-8", stdio: "pipe" }
    );
    for (const line of out.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const fileName = trimmed.split("/").pop() ?? "";
      if (fileName.toUpperCase().startsWith(normalizedId) && fileName.endsWith(".md")) {
        pathOnOrigin = trimmed;
        break;
      }
    }
  } catch {
    return { status: "ok" };
  }

  if (!pathOnOrigin) return { status: "ok" };
  if (!pathOnOrigin.includes("/3-in-progress/")) return { status: "ok" };

  let content: string;
  try {
    content = execFileSync("git", ["show", `origin/${mainBranch}:${pathOnOrigin}`], {
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch {
    return { status: "ok" };
  }

  const fm = parseFrontmatter(content);
  if (!fm) return { status: "ok" };

  const originAssignee = typeof fm.assignee === "string" ? fm.assignee : undefined;
  if (originAssignee && originAssignee !== gitUser) {
    const date = typeof fm.updated === "string" ? fm.updated : "?";
    return {
      status: "already-claimed",
      message: `${issueId} was claimed by @${originAssignee} on ${date}. Use --force to override.`,
      assignee: originAssignee,
    };
  }

  return { status: "ok" };
}

/**
 * Count checklist items in markdown content.
 */
export function countChecklist(content: string): { done: number; total: number } {
  const pattern = /^[ \t]*- \[([ xX])\] /gm;
  let done = 0;
  let total = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    total++;
    if (match[1] !== " ") done++;
  }

  return { done, total };
}
