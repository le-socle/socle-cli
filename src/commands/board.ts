/**
 * lytos board — Regenerate BOARD.md from issue frontmatter.
 *
 * Reads all ISS-*.md files, parses their YAML frontmatter,
 * and generates a clean BOARD.md index. Source of truth is
 * the frontmatter `status` field, not the folder.
 */

import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import {
  collectIssues,
  generateBoardMarkdown,
  boardToJson,
  archiveIssues,
  countArchived,
} from "../lib/board-generator.js";
import { displayBoard } from "../lib/board-display.js";
import { discoverRepos, displayOverview, listSiblings } from "../lib/board-overview.js";
import { ok, warn, error } from "../lib/output.js";

function findBoardDir(cwd: string): string | null {
  // Try .lytos/issue-board/ first, then issue-board/
  const candidates = [
    join(cwd, ".lytos", "issue-board"),
    join(cwd, "issue-board"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export const boardCommand = new Command("board")
  .description("Display board overview and regenerate BOARD.md")
  .option(
    "--check",
    "Check if BOARD.md is up to date (exit 1 if not)",
    false
  )
  .option("--json", "Output board data as JSON", false)
  .option("--all", "Show consolidated overview of sibling Lytos projects", false)
  .option(
    "--dirs <paths>",
    "Comma-separated list of directories to include in overview"
  )
  .on("--help", () => {
    console.log("");
    console.log("Examples:");
    console.log("  lyt board");
    console.log("  lyt board --check");
    console.log("  lyt board --json");
    console.log("  lyt board --all");
    console.log("  lyt board --dirs ../lytos-cli,../lytos-website");
  })
  .action((opts) => {
    const cwd = process.cwd();

    // Multi-repo overview mode
    if (opts.all || opts.dirs) {
      const candidates: string[] = opts.dirs
        ? String(opts.dirs).split(",").map((p) => p.trim()).filter(Boolean)
        : listSiblings(cwd);
      const repos = discoverRepos(candidates);

      if (opts.json) {
        console.log(
          JSON.stringify(
            repos.map((r) => ({
              name: r.name,
              path: r.path,
              counts: r.counts,
              archived: r.archived,
              total: r.total,
            })),
            null,
            2
          )
        );
        return;
      }

      displayOverview(repos);
      return;
    }

    const boardDir = findBoardDir(cwd);

    if (!boardDir) {
      error(
        "No issue-board/ directory found. Run `lytos init` first."
      );
      process.exit(2);
    }

    // Archive completed issues from 5-done/
    archiveIssues(boardDir);

    // Collect issues
    const data = collectIssues(boardDir);
    const archivedCount = countArchived(boardDir);

    // Show warnings
    for (const w of data.warnings) {
      warn(w);
    }

    // JSON mode — output to stdout and exit
    if (opts.json) {
      console.log(JSON.stringify(boardToJson(data), null, 2));
      return;
    }

    // Generate markdown
    const newContent = generateBoardMarkdown(data, archivedCount);

    // Check mode — compare with existing BOARD.md
    if (opts.check) {
      const boardPath = join(boardDir, "BOARD.md");
      if (!existsSync(boardPath)) {
        error("BOARD.md does not exist.");
        process.exit(1);
      }

      const existing = readFileSync(boardPath, "utf-8");

      // Compare ignoring the "Last generated" date line
      // (it changes every time, so we strip it for comparison)
      const normalize = (s: string) =>
        s.replace(/\*\*Last generated\*\*:.*/, "").trim();

      if (normalize(existing) === normalize(newContent)) {
        ok("BOARD.md is up to date.");
        return;
      } else {
        error(
          "BOARD.md is outdated. Run `lytos board` to regenerate."
        );
        process.exit(1);
      }
    }

    // Default mode — display board + write BOARD.md
    displayBoard(data);

    const boardPath = join(boardDir, "BOARD.md");
    writeFileSync(boardPath, newContent, "utf-8");

    ok(
      `BOARD.md regenerated`
    );
  });
