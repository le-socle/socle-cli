/**
 * Legacy .cursorrules → .cursor/rules/lytos.mdc migration.
 *
 * Context
 * -------
 * Cursor's current rule format is `.cursor/rules/*.mdc` — per-rule files with
 * YAML front-matter (alwaysApply, globs, …). `lyt init --tool cursor` emits
 * this layout since ISS-0050. Projects scaffolded earlier (or hand-written
 * before the convention changed) still carry a flat `.cursorrules` file at
 * the project root, which Cursor still reads for backwards compatibility but
 * can no longer scope or toggle.
 *
 * This module provides a single migration path that preserves the user's
 * legacy content — it does NOT replace it with the bundled template — and
 * wraps it in the minimal YAML front-matter that Cursor's modern loader
 * expects. A user who has hand-tuned their `.cursorrules` keeps their work.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";

export type CursorMigrationStatus =
  | "migrated" // moved legacy content into the new path
  | "no-legacy" // nothing to migrate
  | "both-present" // both files exist — user must decide
  | "dry-run"; // would-migrate mode

export interface CursorMigrationResult {
  status: CursorMigrationStatus;
  legacyPath: string;
  modernPath: string;
  /** True when the modern path already existed and was not touched. */
  modernAlreadyExists: boolean;
}

/**
 * Wrap plain legacy .cursorrules content with the minimal front-matter the
 * modern .mdc loader expects. The content itself is preserved verbatim so
 * any project-specific rules a user wrote by hand survive the migration.
 */
export function wrapLegacyRules(legacyContent: string): string {
  const frontMatter = [
    "---",
    'description: "Project rules migrated from legacy .cursorrules"',
    'globs: ["**/*"]',
    "alwaysApply: true",
    "---",
    "",
  ].join("\n");
  // Strip any trailing newline on legacy so we don't end up with a blank gap.
  const body = legacyContent.replace(/\n+$/, "") + "\n";
  return frontMatter + body;
}

export function migrateCursorRules(
  cwd: string,
  options: { dryRun?: boolean } = {}
): CursorMigrationResult {
  const legacyPath = join(cwd, ".cursorrules");
  const modernPath = join(cwd, ".cursor", "rules", "lytos.mdc");
  const modernAlreadyExists = existsSync(modernPath);

  if (!existsSync(legacyPath)) {
    return {
      status: "no-legacy",
      legacyPath,
      modernPath,
      modernAlreadyExists,
    };
  }

  if (modernAlreadyExists) {
    // Both files present — refuse to touch either side. The user has a real
    // decision to make (keep legacy, keep modern, merge by hand). We surface
    // the situation; we don't silently overwrite.
    return {
      status: "both-present",
      legacyPath,
      modernPath,
      modernAlreadyExists,
    };
  }

  if (options.dryRun) {
    return {
      status: "dry-run",
      legacyPath,
      modernPath,
      modernAlreadyExists,
    };
  }

  const legacyContent = readFileSync(legacyPath, "utf-8");
  mkdirSync(dirname(modernPath), { recursive: true });
  writeFileSync(modernPath, wrapLegacyRules(legacyContent), "utf-8");
  unlinkSync(legacyPath);

  return {
    status: "migrated",
    legacyPath,
    modernPath,
    modernAlreadyExists: false,
  };
}
