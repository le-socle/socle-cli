/**
 * Show — parse and resolve issue detail for display.
 *
 * Reads a single issue file, extracts checklist progress,
 * resolves dependency status, and computes metadata.
 * Zero dependencies.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parseFrontmatter, type Frontmatter } from "./frontmatter.js";

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface DependencyInfo {
  id: string;
  title: string;
  done: boolean;
}

export interface IssueDetail {
  id: string;
  title: string;
  status: string;
  priority: string;
  effort: string;
  skill: string;
  skillsAux: string[];
  branch: string;
  complexity: string;
  created: string;
  updated: string;
  daysOpen: number;
  checklist: ChecklistItem[];
  checklistDone: number;
  checklistTotal: number;
  progress: number;
  dependencies: DependencyInfo[];
  body: string;
}

export interface IssueSummary {
  id: string;
  title: string;
  progress: number;
  checklistDone: number;
  checklistTotal: number;
  effort: string;
  daysOpen: number;
}

const STATUS_DIRS = [
  "0-icebox", "1-backlog", "2-sprint",
  "3-in-progress", "4-review", "5-done",
];

/**
 * Find an issue file by ID across all status directories.
 */
export function findIssueFile(
  lytosDir: string,
  issueId: string
): { path: string; dir: string } | null {
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
      return { path: join(dirPath, files[0]), dir };
    }
  }

  return null;
}

/**
 * Parse a single issue file into a detailed view.
 */
export function parseIssueDetail(
  lytosDir: string,
  issueId: string
): IssueDetail | null {
  const found = findIssueFile(lytosDir, issueId);
  if (!found) return null;

  const content = readFileSync(found.path, "utf-8");
  const fm = parseFrontmatter(content);
  if (!fm) return null;

  const checklist = parseChecklist(content);
  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistTotal = checklist.length;
  const progress = checklistTotal > 0
    ? Math.round((checklistDone / checklistTotal) * 100)
    : 0;

  const dependencies = resolveDependencies(lytosDir, fm);
  const daysOpen = computeDaysOpen(fm);

  // Extract body (content after frontmatter, skip the H1 title)
  const bodyMatch = content.match(/^---[\s\S]*?---\s*\n(?:#[^\n]*\n)?([\s\S]*)/);
  const body = bodyMatch ? bodyMatch[1].trim() : "";

  return {
    id: str(fm.id),
    title: str(fm.title),
    status: found.dir,
    priority: str(fm.priority),
    effort: str(fm.effort),
    skill: str(fm.skill),
    skillsAux: Array.isArray(fm.skills_aux) ? fm.skills_aux : [],
    branch: str(fm.branch),
    complexity: str(fm.complexity),
    created: str(fm.created),
    updated: str(fm.updated),
    daysOpen,
    checklist,
    checklistDone,
    checklistTotal,
    progress,
    dependencies,
    body,
  };
}

/**
 * Get summary of all in-progress issues.
 */
export function getInProgressSummaries(lytosDir: string): IssueSummary[] {
  const boardDir = join(lytosDir, "issue-board");
  const inProgressDir = join(boardDir, "3-in-progress");

  if (!existsSync(inProgressDir)) return [];

  const files = readdirSync(inProgressDir).filter(
    (f) => f.startsWith("ISS-") && f.endsWith(".md")
  );

  const summaries: IssueSummary[] = [];

  for (const file of files) {
    const content = readFileSync(join(inProgressDir, file), "utf-8");
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    const checklist = parseChecklist(content);
    const checklistDone = checklist.filter((c) => c.done).length;
    const checklistTotal = checklist.length;
    const progress = checklistTotal > 0
      ? Math.round((checklistDone / checklistTotal) * 100)
      : 0;

    summaries.push({
      id: str(fm.id),
      title: str(fm.title),
      progress,
      checklistDone,
      checklistTotal,
      effort: str(fm.effort),
      daysOpen: computeDaysOpen(fm),
    });
  }

  return summaries;
}

/**
 * Parse markdown checklist items from content.
 */
function parseChecklist(content: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const pattern = /^[ \t]*- \[([ xX])\] (.+)$/gm;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    items.push({
      done: match[1] !== " ",
      text: match[2].trim(),
    });
  }

  return items;
}

/**
 * Resolve dependency IDs to their status and title.
 */
function resolveDependencies(
  lytosDir: string,
  fm: Frontmatter
): DependencyInfo[] {
  const depends = fm.depends;
  if (!Array.isArray(depends) || depends.length === 0) return [];

  const results: DependencyInfo[] = [];

  for (const depId of depends) {
    if (!depId) continue;

    const found = findIssueFile(lytosDir, depId);
    if (!found) {
      results.push({ id: depId, title: "(not found)", done: false });
      continue;
    }

    const content = readFileSync(found.path, "utf-8");
    const depFm = parseFrontmatter(content);
    const title = depFm ? str(depFm.title) : "(unknown)";
    const done = found.dir === "5-done";

    results.push({ id: depId, title, done });
  }

  return results;
}

/**
 * Compute days since issue creation.
 */
function computeDaysOpen(fm: Frontmatter): number {
  const created = str(fm.created);
  if (!created) return 0;

  const createdDate = new Date(created);
  if (isNaN(createdDate.getTime())) return 0;

  const now = new Date();
  const diffMs = now.getTime() - createdDate.getTime();
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

function str(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val.join(", ");
  return val || "";
}
