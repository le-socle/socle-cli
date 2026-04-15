/**
 * Linter — validates .lytos/ structure and content.
 *
 * Returns a list of findings (errors and warnings) with
 * file path, message, and fix suggestion.
 * Zero dependencies.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parseFrontmatter } from "./frontmatter.js";

export type Severity = "error" | "warning";

export interface LintFinding {
  severity: Severity;
  file: string;
  message: string;
  fix: string;
}

export interface LintResult {
  findings: LintFinding[];
  filesChecked: number;
  errors: number;
  warnings: number;
}

const REQUIRED_FILES = [
  { path: "manifest.md", fix: "Run `lyt init` to create the Lytos structure" },
  { path: "LYTOS.md", fix: "Run `lyt init` or download from github.com/getlytos/lytos-method" },
  { path: "memory/MEMORY.md", fix: "Create memory/MEMORY.md with a section index" },
  { path: "rules/default-rules.md", fix: "Run `lyt init` to get the default rules" },
  { path: "issue-board/BOARD.md", fix: "Run `lyt board` to generate BOARD.md" },
];

const REQUIRED_DIRS = [
  { path: "skills", fix: "Run `lyt init` to create the skills directory" },
  { path: "rules", fix: "Run `lyt init` to create the rules directory" },
  { path: "memory/cortex", fix: "Run `lyt init` to create the cortex directory" },
  { path: "issue-board", fix: "Run `lyt init` to create the issue board" },
];

const MANIFEST_SECTIONS = [
  { pattern: /## Identity/, name: "Identity", fix: "Add an ## Identity section with project name and description" },
  { pattern: /## Why this project exists/, name: "Why this project exists", fix: "Add a ## Why this project exists section" },
  { pattern: /## Tech stack/, name: "Tech stack", fix: "Add a ## Tech stack section with your technologies" },
];

const PLACEHOLDER_PATTERNS = [
  { pattern: /YYYY-MM-DD/, message: "Date placeholder not replaced", fix: "Replace YYYY-MM-DD with an actual date" },
  { pattern: /\| Description \|\s*\|/, message: "Empty description in manifest", fix: "Fill in the project description" },
  { pattern: /\| Owner \|\s*\|/, message: "Empty owner in manifest", fix: "Fill in the project owner" },
  { pattern: /\*3-5 sentences\. The "why"/, message: "Template placeholder text still present", fix: "Replace the placeholder with your project's purpose" },
];

const REQUIRED_FRONTMATTER_FIELDS = ["id", "title", "status", "priority"];

/**
 * Run all lint checks on a .lytos/ directory.
 */
export function lint(lytosDir: string): LintResult {
  const findings: LintFinding[] = [];
  let filesChecked = 0;

  // Check required files
  for (const req of REQUIRED_FILES) {
    const fullPath = join(lytosDir, req.path);
    if (!existsSync(fullPath)) {
      findings.push({
        severity: "error",
        file: req.path,
        message: `Required file missing: ${req.path}`,
        fix: req.fix,
      });
    } else {
      filesChecked++;
    }
  }

  // Check required directories
  for (const req of REQUIRED_DIRS) {
    const fullPath = join(lytosDir, req.path);
    if (!existsSync(fullPath)) {
      findings.push({
        severity: "error",
        file: req.path,
        message: `Required directory missing: ${req.path}`,
        fix: req.fix,
      });
    }
  }

  // Validate manifest content
  const manifestPath = join(lytosDir, "manifest.md");
  if (existsSync(manifestPath)) {
    const content = readFileSync(manifestPath, "utf-8");
    filesChecked++;

    for (const section of MANIFEST_SECTIONS) {
      if (!section.pattern.test(content)) {
        findings.push({
          severity: "error",
          file: "manifest.md",
          message: `Missing section: ${section.name}`,
          fix: section.fix,
        });
      }
    }

    // Check for placeholders in manifest
    for (const ph of PLACEHOLDER_PATTERNS) {
      if (ph.pattern.test(content)) {
        findings.push({
          severity: "warning",
          file: "manifest.md",
          message: ph.message,
          fix: ph.fix,
        });
      }
    }
  }

  // Validate issue frontmatter
  const issueFindings = lintIssues(lytosDir);
  findings.push(...issueFindings.findings);
  filesChecked += issueFindings.filesChecked;

  // Check skills directory has files
  const skillsDir = join(lytosDir, "skills");
  if (existsSync(skillsDir)) {
    const skills = readdirSync(skillsDir).filter((f) => f.endsWith(".md"));
    if (skills.length === 0) {
      findings.push({
        severity: "warning",
        file: "skills/",
        message: "Skills directory is empty",
        fix: "Run `lyt init` to download the 9 default skills",
      });
    }
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;

  return { findings, filesChecked, errors, warnings };
}

/**
 * Validate all issue files in the issue-board.
 */
function lintIssues(lytosDir: string): { findings: LintFinding[]; filesChecked: number } {
  const findings: LintFinding[] = [];
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

      if (!fm) {
        findings.push({
          severity: "error",
          file: relPath,
          message: "No YAML frontmatter found",
          fix: "Add YAML frontmatter with --- delimiters at the top of the file",
        });
        continue;
      }

      // Check required fields
      for (const field of REQUIRED_FRONTMATTER_FIELDS) {
        const value = fm[field];
        if (!value || (typeof value === "string" && value.trim() === "")) {
          findings.push({
            severity: "error",
            file: relPath,
            message: `Missing required field: ${field}`,
            fix: `Add '${field}:' to the issue frontmatter`,
          });
        }
      }

      // Check folder matches frontmatter status
      const fmStatus = typeof fm.status === "string" ? fm.status : "";
      if (fmStatus && fmStatus !== dir) {
        findings.push({
          severity: "warning",
          file: relPath,
          message: `Folder is ${dir} but frontmatter says status: ${fmStatus}`,
          fix: `Move the file to ${fmStatus}/ or update the frontmatter status`,
        });
      }
    }
  }

  return { findings, filesChecked };
}
