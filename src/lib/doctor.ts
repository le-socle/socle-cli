/**
 * Doctor — deep diagnostic for .lytos/ health.
 *
 * Goes beyond lint (structure validation) to check:
 * - Broken internal links (file references that don't exist)
 * - Stale memory (cortex files not updated recently)
 * - Issues referencing non-existent skills
 * - Overall health score (0-100%)
 *
 * Zero dependencies.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { parseFrontmatter } from "./frontmatter.js";

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface DiagnosticFinding {
  severity: DiagnosticSeverity;
  category: string;
  file: string;
  message: string;
  fix: string;
}

export interface DiagnosticResult {
  findings: DiagnosticFinding[];
  filesChecked: number;
  errors: number;
  warnings: number;
  infos: number;
  score: number;
}

const STALE_DAYS = 90;

/**
 * Run all doctor checks on a .lytos/ directory.
 */
export function diagnose(lytosDir: string): DiagnosticResult {
  const findings: DiagnosticFinding[] = [];
  let filesChecked = 0;

  // 1. Broken internal links
  const linkResults = checkBrokenLinks(lytosDir);
  findings.push(...linkResults.findings);
  filesChecked += linkResults.filesChecked;

  // 2. Stale memory
  const memoryResults = checkStaleMemory(lytosDir);
  findings.push(...memoryResults.findings);
  filesChecked += memoryResults.filesChecked;

  // 3. Issues referencing non-existent skills
  const skillResults = checkMissingSkills(lytosDir);
  findings.push(...skillResults.findings);
  filesChecked += skillResults.filesChecked;

  // 4. Frontmatter status / folder mismatch (deeper than lint)
  const statusResults = checkStatusMismatches(lytosDir);
  findings.push(...statusResults.findings);
  filesChecked += statusResults.filesChecked;

  // 5. Orphan dependencies (depends on issues that don't exist)
  const depResults = checkOrphanDependencies(lytosDir);
  findings.push(...depResults.findings);
  filesChecked += depResults.filesChecked;

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const infos = findings.filter((f) => f.severity === "info").length;

  const score = computeScore(findings, filesChecked);

  return { findings, filesChecked, errors, warnings, infos, score };
}

/**
 * Check all markdown files for internal links pointing to non-existent files.
 */
function checkBrokenLinks(
  lytosDir: string
): { findings: DiagnosticFinding[]; filesChecked: number } {
  const findings: DiagnosticFinding[] = [];
  let filesChecked = 0;

  const mdFiles = collectMarkdownFiles(lytosDir)
    .filter((f) => !f.includes("/templates/"));
  // Match markdown links: [text](path) — skip http/https/mailto links and placeholders
  const linkPattern = /\[([^\]]*)\]\((?!https?:\/\/|mailto:)([^)]+)\)/g;

  for (const filePath of mdFiles) {
    const content = readFileSync(filePath, "utf-8");
    const relFile = relative(lytosDir, filePath);
    filesChecked++;

    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(content)) !== null) {
      const linkTarget = match[2].split("#")[0]; // strip anchors
      if (!linkTarget) continue;

      // Resolve relative to the file's directory
      const fileDir = filePath.replace(/\/[^/]+$/, "");
      const resolvedPath = join(fileDir, linkTarget);

      if (!existsSync(resolvedPath)) {
        findings.push({
          severity: "error",
          category: "broken-link",
          file: relFile,
          message: `Broken link: [${match[1]}](${match[2]}) → file not found`,
          fix: `Fix the path or remove the link in ${relFile}`,
        });
      }
    }
  }

  return { findings, filesChecked };
}

/**
 * Check memory/cortex/ for stale files (not modified in STALE_DAYS days).
 */
function checkStaleMemory(
  lytosDir: string
): { findings: DiagnosticFinding[]; filesChecked: number } {
  const findings: DiagnosticFinding[] = [];
  let filesChecked = 0;

  const cortexDir = join(lytosDir, "memory", "cortex");
  if (!existsSync(cortexDir)) return { findings, filesChecked };

  const now = Date.now();
  const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;

  const files = readdirSync(cortexDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = join(cortexDir, file);
    const stat = statSync(filePath);
    filesChecked++;

    const ageMs = now - stat.mtimeMs;
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

    if (ageMs > staleThreshold) {
      findings.push({
        severity: "warning",
        category: "stale-memory",
        file: `memory/cortex/${file}`,
        message: `Stale memory: not updated in ${ageDays} days`,
        fix: `Review and update memory/cortex/${file}, or delete it if no longer relevant`,
      });
    }
  }

  return { findings, filesChecked };
}

/**
 * Check issues for skill references that don't exist in skills/.
 */
function checkMissingSkills(
  lytosDir: string
): { findings: DiagnosticFinding[]; filesChecked: number } {
  const findings: DiagnosticFinding[] = [];
  let filesChecked = 0;

  const skillsDir = join(lytosDir, "skills");
  const boardDir = join(lytosDir, "issue-board");

  if (!existsSync(boardDir)) return { findings, filesChecked };

  // Collect available skill names (filename without .md)
  const availableSkills = new Set<string>();
  if (existsSync(skillsDir)) {
    for (const f of readdirSync(skillsDir)) {
      if (f.endsWith(".md")) {
        availableSkills.add(f.replace(/\.md$/, ""));
      }
    }
  }

  const statusDirs = [
    "0-icebox", "1-backlog", "2-sprint",
    "3-in-progress", "4-review",
  ];

  for (const dir of statusDirs) {
    const dirPath = join(boardDir, dir);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath).filter(
      (f) => f.startsWith("ISS-") && f.endsWith(".md")
    );

    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);
      const relPath = `issue-board/${dir}/${file}`;
      filesChecked++;

      if (!fm) continue;

      // Check main skill
      const skill = fm.skill;
      if (typeof skill === "string" && skill && !availableSkills.has(skill)) {
        findings.push({
          severity: "warning",
          category: "missing-skill",
          file: relPath,
          message: `References skill "${skill}" which does not exist in skills/`,
          fix: `Create skills/${skill}.md or fix the skill field in ${relPath}`,
        });
      }

      // Check auxiliary skills
      const auxSkills = fm.skills_aux;
      if (Array.isArray(auxSkills)) {
        for (const aux of auxSkills) {
          if (aux && !availableSkills.has(aux)) {
            findings.push({
              severity: "warning",
              category: "missing-skill",
              file: relPath,
              message: `References auxiliary skill "${aux}" which does not exist in skills/`,
              fix: `Create skills/${aux}.md or fix skills_aux in ${relPath}`,
            });
          }
        }
      }
    }
  }

  return { findings, filesChecked };
}

/**
 * Check that frontmatter status matches the folder the issue is in.
 */
function checkStatusMismatches(
  lytosDir: string
): { findings: DiagnosticFinding[]; filesChecked: number } {
  const findings: DiagnosticFinding[] = [];
  let filesChecked = 0;

  const boardDir = join(lytosDir, "issue-board");
  if (!existsSync(boardDir)) return { findings, filesChecked };

  const statusDirs = [
    "0-icebox", "1-backlog", "2-sprint",
    "3-in-progress", "4-review", "5-done",
  ];

  for (const dir of statusDirs) {
    const dirPath = join(boardDir, dir);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath).filter(
      (f) => f.startsWith("ISS-") && f.endsWith(".md")
    );

    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);
      const relPath = `issue-board/${dir}/${file}`;
      filesChecked++;

      if (!fm) continue;

      const fmStatus = typeof fm.status === "string" ? fm.status : "";
      if (fmStatus && fmStatus !== dir) {
        findings.push({
          severity: "error",
          category: "status-mismatch",
          file: relPath,
          message: `File is in ${dir}/ but frontmatter says status: ${fmStatus}`,
          fix: `Move to issue-board/${fmStatus}/ or update frontmatter to status: ${dir}`,
        });
      }
    }
  }

  return { findings, filesChecked };
}

/**
 * Check that issue dependencies reference existing issues.
 */
function checkOrphanDependencies(
  lytosDir: string
): { findings: DiagnosticFinding[]; filesChecked: number } {
  const findings: DiagnosticFinding[] = [];
  let filesChecked = 0;

  const boardDir = join(lytosDir, "issue-board");
  if (!existsSync(boardDir)) return { findings, filesChecked };

  // Collect all issue IDs
  const allIssueIds = new Set<string>();
  const statusDirs = [
    "0-icebox", "1-backlog", "2-sprint",
    "3-in-progress", "4-review", "5-done",
  ];

  for (const dir of statusDirs) {
    const dirPath = join(boardDir, dir);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath).filter(
      (f) => f.startsWith("ISS-") && f.endsWith(".md")
    );

    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm && typeof fm.id === "string") {
        allIssueIds.add(fm.id);
      }
    }
  }

  // Check depends fields
  for (const dir of statusDirs) {
    const dirPath = join(boardDir, dir);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath).filter(
      (f) => f.startsWith("ISS-") && f.endsWith(".md")
    );

    for (const file of files) {
      const filePath = join(dirPath, file);
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);
      const relPath = `issue-board/${dir}/${file}`;
      filesChecked++;

      if (!fm) continue;

      const depends = fm.depends;
      if (Array.isArray(depends)) {
        for (const dep of depends) {
          if (dep && !allIssueIds.has(dep)) {
            findings.push({
              severity: "warning",
              category: "orphan-dependency",
              file: relPath,
              message: `Depends on ${dep} which does not exist on the board`,
              fix: `Remove ${dep} from depends or create the missing issue`,
            });
          }
        }
      }
    }
  }

  return { findings, filesChecked };
}

/**
 * Recursively collect all .md files in a directory.
 */
function collectMarkdownFiles(dir: string): string[] {
  const results: string[] = [];

  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Compute a health score from 0 to 100.
 *
 * Starts at 100, deducts points per finding:
 * - error: -10 points
 * - warning: -5 points
 * - info: -0 points
 * Floor at 0.
 */
function computeScore(findings: DiagnosticFinding[], filesChecked: number): number {
  if (filesChecked === 0) return 0;

  let score = 100;

  for (const f of findings) {
    if (f.severity === "error") score -= 10;
    if (f.severity === "warning") score -= 5;
  }

  return Math.max(0, score);
}
