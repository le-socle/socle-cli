/**
 * lyt archive — move completed issues from 5-done/ to archive/<quarter>/.
 *
 * Archival is deliberately manual (ISS-0051). `lyt board` no longer
 * moves files; issues stay in 5-done/ until this command is run. The
 * default threshold keeps issues visible for 7 days so retros, PR
 * cross-references and rollback verification all have a window.
 */

import { Command } from "commander";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import {
  archiveIssues,
  collectIssues,
  countArchived,
  generateBoardMarkdown,
} from "../lib/board-generator.js";
import { ok, info, warn, error, cyan, bold, green, dim } from "../lib/output.js";

function findBoardDir(cwd: string): string | null {
  const candidates = [
    join(cwd, ".lytos", "issue-board"),
    join(cwd, "issue-board"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Parse a `--older-than` value. Accepts `<N>d` (e.g. `7d`, `0d`) or a
 * bare integer interpreted as days. Any other suffix is rejected so
 * nobody writes `7h` and assumes it means hours.
 */
export function parseOlderThan(value: string): number {
  const trimmed = value.trim().toLowerCase();
  const match = /^(\d+)(d?)$/.exec(trimmed);
  if (!match) {
    throw new Error(
      `Invalid --older-than value "${value}". Expected a day count like "7", "7d" or "0d".`
    );
  }
  return parseInt(match[1], 10);
}

export const archiveCommand = new Command("archive")
  .description(
    "Move completed issues from 5-done/ to archive/<quarter>/ (default: issues older than 7 days)"
  )
  .option(
    "--older-than <age>",
    "Only archive issues at least this old (e.g. 7d, 0d). Defaults to 7d.",
    "7d"
  )
  .option(
    "--all",
    "Archive everything in 5-done/ regardless of age (shortcut for --older-than 0d).",
    false
  )
  .option("--dry-run", "Preview what would move without touching the filesystem.", false)
  .action((opts: { olderThan: string; all: boolean; dryRun: boolean }) => {
    const cwd = process.cwd();
    const boardDir = findBoardDir(cwd);

    if (!boardDir) {
      error("No issue-board/ directory found. Run `lyt init` first.");
      process.exit(2);
    }

    let olderThanDays: number;
    if (opts.all) {
      olderThanDays = 0;
    } else {
      try {
        olderThanDays = parseOlderThan(opts.olderThan);
      } catch (e) {
        error(e instanceof Error ? e.message : String(e));
        process.exit(2);
      }
    }

    console.error("");
    info(
      opts.dryRun
        ? `Dry run — previewing archives for issues older than ${olderThanDays} day(s).`
        : `Archiving issues older than ${olderThanDays} day(s)...`
    );
    console.error("");

    const result = archiveIssues(boardDir, {
      olderThanDays,
      dryRun: opts.dryRun,
    });

    for (const move of result.moved) {
      const prefix = opts.dryRun ? cyan("~") : green("→");
      console.error(
        `  ${prefix} ${dim(move.id)} ${dim(`(${move.ageDays}d old)`)} → ${dim(`archive/${move.quarter}/`)}`
      );
    }
    for (const skipped of result.skippedTooRecent) {
      console.error(
        `  ${dim("·")} ${dim(skipped.id)} ${dim(`(${skipped.ageDays}d — too recent)`)}`
      );
    }

    console.error("");

    if (result.moved.length === 0 && result.skippedTooRecent.length === 0) {
      info("Nothing in 5-done/ to archive.");
      return;
    }

    if (opts.dryRun) {
      const verb = result.moved.length === 1 ? "issue would be" : "issues would be";
      info(
        `${result.moved.length} ${verb} archived · ${result.skippedTooRecent.length} kept in 5-done/`
      );
      info("Re-run without `--dry-run` to apply.");
      return;
    }

    if (result.moved.length > 0) {
      // Auto-regenerate BOARD.md so the "archived" counter stays in sync
      // without forcing users to remember a second command after archive.
      const data = collectIssues(boardDir);
      const archivedCount = countArchived(boardDir);
      const boardPath = join(boardDir, "BOARD.md");
      writeFileSync(boardPath, generateBoardMarkdown(data, archivedCount), "utf-8");

      const verb = result.moved.length === 1 ? "issue" : "issues";
      ok(
        cyan(bold(`${result.moved.length} ${verb} archived`)) +
          (result.skippedTooRecent.length > 0
            ? ` · ${result.skippedTooRecent.length} kept in 5-done/`
            : "")
      );
      info(`BOARD.md refreshed with ${archivedCount} archived total.`);
    } else {
      warn(
        `Nothing old enough to archive yet (${result.skippedTooRecent.length} in 5-done/, all too recent).`
      );
    }
  });
