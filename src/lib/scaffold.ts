/**
 * Scaffolding logic for `socle init`.
 *
 * Creates the .socle/ directory structure and all essential files.
 * Downloads skills, rules, and SOCLE.md from the Le Socle GitHub repo.
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import {
  manifestTemplate,
  memoryTemplate,
  cortexTemplate,
  getCortexFiles,
  boardTemplate,
  claudeTemplate,
  cursorrTemplate,
} from "./templates.js";
import type { DetectedStack } from "./detect-stack.js";

const REPO_RAW =
  "https://raw.githubusercontent.com/le-socle/socle/main";

const SKILLS = [
  "session-start",
  "code-review",
  "testing",
  "documentation",
  "git-workflow",
  "code-structure",
  "deployment",
  "security",
  "api-design",
];

const REMOTE_FILES = [
  ...SKILLS.map((s) => ({
    remote: `skills/${s}.md`,
    local: `skills/${s}.md`,
  })),
  { remote: "rules/default-rules.md", local: "rules/default-rules.md" },
  { remote: "rules/README.md", local: "rules/README.md" },
  { remote: "SOCLE.md", local: "SOCLE.md" },
  { remote: "templates/sprint.md", local: "templates/sprint.md" },
  {
    remote: "issue-board/templates/issue-feature.md",
    local: "issue-board/templates/issue-feature.md",
  },
  {
    remote: "issue-board/templates/issue-task.md",
    local: "issue-board/templates/issue-task.md",
  },
];

export interface ScaffoldOptions {
  projectName: string;
  tool: "claude" | "cursor" | "none";
  stack: Partial<DetectedStack>;
  cwd: string;
  dryRun: boolean;
}

export interface ScaffoldResult {
  filesCreated: string[];
  filesSkipped: string[];
  warnings: string[];
}

async function download(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return response.text();
}

function ensureDir(dir: string, dryRun: boolean): void {
  if (!dryRun && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function writeFile(
  path: string,
  content: string,
  dryRun: boolean,
  result: ScaffoldResult
): void {
  if (dryRun) {
    result.filesCreated.push(path);
    return;
  }
  ensureDir(join(path, ".."), false);
  writeFileSync(path, content, "utf-8");
  result.filesCreated.push(path);
}

export async function scaffold(
  options: ScaffoldOptions
): Promise<ScaffoldResult> {
  const result: ScaffoldResult = {
    filesCreated: [],
    filesSkipped: [],
    warnings: [],
  };

  const socleDir = join(options.cwd, ".socle");
  const today = new Date().toISOString().slice(0, 10);
  const ctx = {
    projectName: options.projectName,
    date: today,
    stack: options.stack,
  };

  // Create directory structure
  const dirs = [
    "memory/cortex",
    "rules",
    "skills",
    "scripts",
    "templates",
    "issue-board/0-icebox",
    "issue-board/1-backlog",
    "issue-board/2-sprint",
    "issue-board/3-in-progress",
    "issue-board/4-review",
    "issue-board/5-done",
    "issue-board/templates",
  ];

  for (const dir of dirs) {
    ensureDir(join(socleDir, dir), options.dryRun);
  }

  // Create .gitkeep files in empty Kanban folders
  const kanbanDirs = [
    "0-icebox",
    "1-backlog",
    "2-sprint",
    "3-in-progress",
    "4-review",
    "5-done",
  ];
  for (const dir of kanbanDirs) {
    writeFile(
      join(socleDir, "issue-board", dir, ".gitkeep"),
      "",
      options.dryRun,
      result
    );
  }

  // Generate local files from templates
  writeFile(
    join(socleDir, "manifest.md"),
    manifestTemplate(ctx),
    options.dryRun,
    result
  );
  writeFile(
    join(socleDir, "memory", "MEMORY.md"),
    memoryTemplate(ctx),
    options.dryRun,
    result
  );
  writeFile(
    join(socleDir, "issue-board", "BOARD.md"),
    boardTemplate(ctx),
    options.dryRun,
    result
  );

  // Generate cortex files with examples
  for (const cortexFile of getCortexFiles()) {
    writeFile(
      join(socleDir, "memory", "cortex", cortexFile.name),
      cortexTemplate(cortexFile),
      options.dryRun,
      result
    );
  }

  // Download remote files (skills, rules, SOCLE.md, templates)
  for (const file of REMOTE_FILES) {
    try {
      const content = await download(`${REPO_RAW}/${file.remote}`);
      writeFile(
        join(socleDir, file.local),
        content,
        options.dryRun,
        result
      );
    } catch (err) {
      result.warnings.push(
        `Could not download ${file.remote}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Create AI tool config at project root
  if (options.tool === "claude") {
    writeFile(
      join(options.cwd, "CLAUDE.md"),
      claudeTemplate(ctx),
      options.dryRun,
      result
    );
  } else if (options.tool === "cursor") {
    writeFile(
      join(options.cwd, ".cursorrules"),
      cursorrTemplate(ctx),
      options.dryRun,
      result
    );
  }

  return result;
}
