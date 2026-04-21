/**
 * lyt upgrade — update method files in .lytos/ from the bundled version.
 *
 * Compares local .lytos/ files with the bundled dist/method/ files.
 * Never touches manifest.md, memory/, or issue-board/ (except templates).
 */

import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";
import { ok, info, error, cyan, bold, green, dim } from "../lib/output.js";
import { KANBAN_DIRS } from "../lib/scaffold.js";

const METHOD_DIR = join(dirname(fileURLToPath(import.meta.url)), "method");

const UPGRADEABLE_FILES = [
  // session-start is a Lytos bootstrap protocol, kept flat
  "skills/session-start.md",
  // Task skills follow agentskills.io format: <name>/SKILL.md
  "skills/code-review/SKILL.md",
  "skills/testing/SKILL.md",
  "skills/documentation/SKILL.md",
  "skills/git-workflow/SKILL.md",
  "skills/code-structure/SKILL.md",
  "skills/deployment/SKILL.md",
  "skills/security/SKILL.md",
  "skills/api-design/SKILL.md",
  "rules/default-rules.md",
  "rules/README.md",
  "LYTOS.md",
  ".gitignore",
  "templates/sprint.md",
  "issue-board/templates/issue-feature.md",
  "issue-board/templates/issue-task.md",
];

async function askConfirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

export const upgradeCommand = new Command("upgrade")
  .description("Update method files in .lytos/ from the bundled version")
  .option("--force", "Overwrite all changed files without confirmation")
  .option("--dry-run", "Show what would change without applying")
  .action(async (opts: { force?: boolean; dryRun?: boolean }) => {
    const cwd = process.cwd();
    const lytosDir = join(cwd, ".lytos");

    if (!existsSync(lytosDir)) {
      error("No .lytos/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    console.error("");
    info(opts.dryRun ? "Dry run — no files will be written." : "Checking method files...");
    console.error("");

    let added = 0;
    let updated = 0;
    let skipped = 0;
    let upToDate = 0;

    for (const relPath of UPGRADEABLE_FILES) {
      const localPath = join(lytosDir, relPath);
      const bundledPath = join(METHOD_DIR, relPath);

      if (!existsSync(bundledPath)) continue;

      const bundled = readFileSync(bundledPath, "utf-8");

      if (!existsSync(localPath)) {
        // New file — add automatically
        if (!opts.dryRun) {
          mkdirSync(dirname(localPath), { recursive: true });
          writeFileSync(localPath, bundled, "utf-8");
        }
        console.error(`  ${green("+")} ${dim(relPath)} ${dim("(new)")}`);
        added++;
        continue;
      }

      const local = readFileSync(localPath, "utf-8");

      if (local === bundled) {
        upToDate++;
        continue;
      }

      // File differs
      if (opts.dryRun) {
        console.error(`  ${cyan("~")} ${dim(relPath)} ${dim("(differs)")}`);
        skipped++;
        continue;
      }

      if (opts.force) {
        writeFileSync(localPath, bundled, "utf-8");
        console.error(`  ${green("✓")} ${dim(relPath)} ${dim("(updated)")}`);
        updated++;
        continue;
      }

      // Ask user
      process.stderr.write(`  ${cyan("~")} ${relPath} differs — update? [y/N] `);
      const confirm = await askConfirm("");
      if (confirm) {
        writeFileSync(localPath, bundled, "utf-8");
        console.error(`    ${green("✓")} updated`);
        updated++;
      } else {
        console.error(`    ${dim("skipped")}`);
        skipped++;
      }
    }

    // Ensure every Kanban folder + its .gitkeep exist. Older projects
    // (init'd before the 6-private-notes column was added, or before
    // .gitignore-protected private notes shipped) may be missing them.
    for (const dir of KANBAN_DIRS) {
      const gitkeepPath = join(lytosDir, "issue-board", dir, ".gitkeep");
      if (existsSync(gitkeepPath)) continue;

      if (!opts.dryRun) {
        mkdirSync(dirname(gitkeepPath), { recursive: true });
        writeFileSync(gitkeepPath, "", "utf-8");
      }
      console.error(`  ${green("+")} ${dim(`issue-board/${dir}/.gitkeep`)} ${dim("(new)")}`);
      added++;
    }

    console.error("");

    if (opts.dryRun) {
      info(`${added} new · ${skipped} differ · ${upToDate} up to date`);
      info("Run `lyt upgrade` to apply changes.");
    } else {
      const parts = [];
      if (added > 0) parts.push(`${added} added`);
      if (updated > 0) parts.push(`${updated} updated`);
      if (skipped > 0) parts.push(`${skipped} skipped`);
      if (upToDate > 0) parts.push(`${upToDate} already up to date`);

      if (added === 0 && updated === 0) {
        ok(`Already up to date. ${dim(`(${upToDate} files checked)`)}`);
      } else {
        ok(cyan(bold("Method files upgraded")) + " — " + parts.join(" · "));
      }
    }
  });
