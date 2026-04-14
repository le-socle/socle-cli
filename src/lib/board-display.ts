/**
 * Rich terminal display for `lyt board`.
 *
 * Shows a colorful, structured overview of the board
 * with dependency trees, priority colors, and a summary line.
 * Zero dependencies — uses ANSI escape codes directly.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { BoardData, Issue } from "./board-generator.js";

const noColor =
  process.env.NO_COLOR !== undefined ||
  process.argv.includes("--no-color");

function c(code: string, text: string): string {
  if (noColor) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

const bold = (t: string) => c("1", t);
const dim = (t: string) => c("2", t);
const red = (t: string) => c("31", t);
const green = (t: string) => c("32", t);
const yellow = (t: string) => c("33", t);
const blue = (t: string) => c("34", t);
const magenta = (t: string) => c("35", t);
const cyan = (t: string) => c("36", t);
const white = (t: string) => c("37", t);
const bgRed = (t: string) => c("41", t);
const boldRed = (t: string) => c("1;31", t);
const boldYellow = (t: string) => c("1;33", t);
const boldBlue = (t: string) => c("1;34", t);
const boldGreen = (t: string) => c("1;32", t);
const boldCyan = (t: string) => c("1;36", t);
const boldMagenta = (t: string) => c("1;35", t);

/** Color a priority tag */
function colorPriority(p: string): string {
  if (p.startsWith("P0")) return bgRed(bold(` ${p} `));
  if (p.startsWith("P1")) return boldYellow(p);
  if (p.startsWith("P2")) return boldBlue(p);
  if (p.startsWith("P3")) return dim(p);
  return p;
}

/** Color an effort tag */
function colorEffort(e: string): string {
  return dim(e);
}

/** Color a status section header */
function colorStatus(status: string, count: number): string {
  const label = STATUS_DISPLAY[status] || status;
  const countStr = `(${count})`;
  switch (status) {
    case "0-icebox": return dim(`▸ ${label} ${countStr}`);
    case "1-backlog": return bold(white(`▸ ${label} ${countStr}`));
    case "2-sprint": return boldCyan(`▸ ${label} ${countStr}`);
    case "3-in-progress": return boldYellow(`▸ ${label} ${countStr}`);
    case "4-review": return boldMagenta(`▸ ${label} ${countStr}`);
    case "5-done": return boldGreen(`▸ ${label} ${countStr}`);
    default: return `▸ ${label} ${countStr}`;
  }
}

const STATUS_DISPLAY: Record<string, string> = {
  "0-icebox": "ICEBOX",
  "1-backlog": "BACKLOG",
  "2-sprint": "SPRINT",
  "3-in-progress": "IN PROGRESS",
  "4-review": "REVIEW",
  "5-done": "DONE",
};

const ACTIVE_STATUSES = [
  "0-icebox",
  "1-backlog",
  "2-sprint",
  "3-in-progress",
  "4-review",
];

/**
 * Build a dependency tree for issues within a status group.
 * Returns issues ordered so that children appear after their parent,
 * with an indentation level.
 */
interface DisplayIssue {
  issue: Issue;
  depth: number;
  isLast: boolean;
}

function buildTree(issues: Issue[]): DisplayIssue[] {
  const issueIds = new Set(issues.map((i) => String(i.frontmatter.id)));
  const result: DisplayIssue[] = [];

  // Find root issues (no depends, or depends not in this group)
  const children = new Map<string, Issue[]>();
  const roots: Issue[] = [];

  for (const issue of issues) {
    const deps = issue.frontmatter.depends;
    const depList = Array.isArray(deps) ? deps : deps ? [deps] : [];
    const parentInGroup = depList.find((d) => issueIds.has(d));

    if (parentInGroup) {
      const existing = children.get(parentInGroup) || [];
      existing.push(issue);
      children.set(parentInGroup, existing);
    } else {
      roots.push(issue);
    }
  }

  // Recursively add issues
  function addIssue(issue: Issue, depth: number, isLast: boolean) {
    result.push({ issue, depth, isLast });
    const kids = children.get(String(issue.frontmatter.id)) || [];
    kids.forEach((kid, i) => {
      addIssue(kid, depth + 1, i === kids.length - 1);
    });
  }

  roots.forEach((root, i) => {
    addIssue(root, 0, i === roots.length - 1);
  });

  return result;
}

/** Format a single issue line */
function formatIssue(di: DisplayIssue): string {
  const { issue, depth, isLast } = di;
  const id = String(issue.frontmatter.id || "?");
  const title = String(issue.frontmatter.title || "?");
  const priority = String(issue.frontmatter.priority || "?");
  const effort = String(issue.frontmatter.effort || "?");

  // Truncate title if too long
  const maxTitle = 50;
  const displayTitle = title.length > maxTitle
    ? title.slice(0, maxTitle - 1) + "…"
    : title;

  // Build tree prefix
  let prefix = "  ";
  if (depth === 0) {
    prefix = "  ";
  } else {
    prefix = "  " + "   ".repeat(depth - 1) + (isLast ? "└── " : "├── ");
  }

  return `${prefix}${dim(id)}  ${colorPriority(priority)}  ${colorEffort(effort)}  ${displayTitle}`;
}

/**
 * Detect project name from manifest.md or package.json
 */
function detectProjectName(cwd: string): string {
  try {
    // Try manifest.md
    const manifestPath = join(cwd, ".lytos", "manifest.md");
    if (existsSync(manifestPath)) {
      const content = readFileSync(manifestPath, "utf-8");
      const nameMatch = content.match(/\|\s*Name\s*\|\s*(.+?)\s*\|/);
      if (nameMatch) return nameMatch[1].trim();
    }

    // Try package.json
    const pkgPath = join(cwd, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (pkg.name) return pkg.name;
    }
  } catch {
    // ignore
  }
  return "project";
}

/**
 * Main display function — renders the board to the terminal.
 */
export function displayBoard(data: BoardData): void {
  const projectName = detectProjectName(process.cwd());
  const line = "─".repeat(52);

  console.log("");
  console.log(`  ${boldCyan("╔")}${boldCyan("═".repeat(52))}${boldCyan("╗")}`);
  console.log(`  ${boldCyan("║")}  ${bold("LYTOS BOARD")} — ${projectName}${" ".repeat(Math.max(0, 38 - projectName.length))}${boldCyan("║")}`);
  console.log(`  ${boldCyan("╚")}${boldCyan("═".repeat(52))}${boldCyan("╝")}`);
  console.log("");

  // Count per status
  const counts: Record<string, number> = {};
  for (const status of [...ACTIVE_STATUSES, "5-done"]) {
    counts[status] = data.issues.filter((i) => i.status === status).length;
  }

  // Active statuses with issues or always shown
  const shownStatuses = ["1-backlog", "2-sprint", "3-in-progress", "4-review"];

  for (const status of shownStatuses) {
    const issues = data.issues.filter((i) => i.status === status);
    console.log(`  ${colorStatus(status, issues.length)}`);

    if (issues.length === 0) {
      console.log("");
      continue;
    }

    console.log(`  ${dim("│")}`);
    const tree = buildTree(issues);
    for (const di of tree) {
      console.log(`  ${dim("│")} ${formatIssue(di)}`);
    }
    console.log("");
  }

  // Icebox — only show if non-empty
  const iceboxCount = counts["0-icebox"];
  if (iceboxCount > 0) {
    console.log(`  ${colorStatus("0-icebox", iceboxCount)}`);
    const iceboxIssues = data.issues.filter((i) => i.status === "0-icebox");
    console.log(`  ${dim("│")}`);
    const tree = buildTree(iceboxIssues);
    for (const di of tree) {
      console.log(`  ${dim("│")} ${formatIssue(di)}`);
    }
    console.log("");
  }

  // Done — compact
  console.log(`  ${colorStatus("5-done", counts["5-done"])}`);
  console.log("");

  // Summary line
  console.log(`  ${dim(line)}`);
  const parts = [
    `${bold(String(data.issues.length))} issues`,
    counts["1-backlog"] ? `${counts["1-backlog"]} backlog` : null,
    counts["2-sprint"] ? `${cyan(String(counts["2-sprint"]))} sprint` : null,
    counts["3-in-progress"] ? `${yellow(String(counts["3-in-progress"]))} wip` : null,
    counts["4-review"] ? `${magenta(String(counts["4-review"]))} review` : null,
    counts["5-done"] ? `${green(String(counts["5-done"]))} done ${green("✓")}` : null,
  ].filter(Boolean);
  console.log(`  ${parts.join(dim(" · "))}`);
  console.log("");
}
