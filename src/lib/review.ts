/**
 * lyt review helpers — cross-model audit workflow.
 *
 * The point of these helpers is to let an AI session that did NOT
 * implement an issue audit it from zero context: we assemble a
 * self-contained prompt (method brief + rules + skill + issue + diff +
 * exact output format) that any capable model can follow and return a
 * GO/NO_GO verdict in a fixed block format.
 *
 * Companion command at src/commands/review.ts drives the UX.
 */

import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { parseFrontmatter } from "./frontmatter.js";

export interface PendingReview {
  id: string;
  title: string;
  filePath: string;
  hasAudit: boolean;
}

export type AuditVerdict = "GO" | "NO_GO" | "UNKNOWN";

export interface ParsedAudit {
  verdict: AuditVerdict;
  block: string;
}

/**
 * List every issue currently in 4-review/ along with whether it already
 * carries an audit block (a prior re-audit) so callers can surface
 * "pending" vs "audited" without reopening each file.
 */
export function listPendingReviews(boardDir: string): PendingReview[] {
  const reviewDir = join(boardDir, "4-review");
  if (!existsSync(reviewDir)) return [];

  const out: PendingReview[] = [];
  for (const file of readdirSync(reviewDir).sort()) {
    if (!file.startsWith("ISS-") || !file.endsWith(".md")) continue;
    const filePath = join(reviewDir, file);
    const content = readFileSync(filePath, "utf-8");
    const fm = parseFrontmatter(content);
    const id = (fm && typeof fm.id === "string" ? fm.id : file.replace(/\.md$/, ""));
    const title = (fm && typeof fm.title === "string" ? fm.title : "?");
    const hasAudit = /^##\s+Audit\s+—\s+\d{4}-\d{2}-\d{2}/m.test(content);
    out.push({ id, title, filePath, hasAudit });
  }
  return out;
}

/**
 * Resolve the issue file for a given ID inside 4-review/.
 * Returns null if no match is found (issue might be in another column).
 */
export function findReviewIssue(boardDir: string, issueId: string): string | null {
  const reviewDir = join(boardDir, "4-review");
  if (!existsSync(reviewDir)) return null;
  for (const file of readdirSync(reviewDir)) {
    if (file.startsWith(`${issueId}-`) && file.endsWith(".md")) {
      return join(reviewDir, file);
    }
  }
  return null;
}

/**
 * Read a file if it exists, return "" otherwise. Keeps prompt assembly
 * defensive — a missing rule or skill file should not break the output,
 * just surface a placeholder line.
 */
function safeRead(path: string): string {
  if (!existsSync(path)) return "";
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Run `git diff main...HEAD` to capture the branch's work. The caller
 * is expected to have checked out the PR branch first; we document that
 * contract in the command help, not enforce it here.
 *
 * We deliberately run from `cwd` and let any error surface as an empty
 * diff rather than throwing — a prompt with "no diff available" is more
 * useful than a hard failure.
 */
function tryGitDiff(cwd: string): string {
  try {
    const out = execSync("git diff main...HEAD", {
      cwd,
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return out || "(no diff — branch might be up to date with main)";
  } catch (err) {
    return `(git diff failed: ${err instanceof Error ? err.message : String(err)})`;
  }
}

export interface BuildPromptOptions {
  /** Project root that contains .lytos/ */
  cwd: string;
  /** Absolute path to the issue file being audited. */
  issueFilePath: string;
  /** Issue ID, used in the role framing. */
  issueId: string;
}

export function buildPrompt(opts: BuildPromptOptions): string {
  const lytosDir = join(opts.cwd, ".lytos");
  const manifest = safeRead(join(lytosDir, "manifest.md"));
  const defaultRules = safeRead(join(lytosDir, "rules", "default-rules.md"));
  const cliRules = safeRead(join(lytosDir, "rules", "cli-rules.md"));
  const reviewSkill =
    safeRead(join(lytosDir, "skills", "code-review", "SKILL.md")) ||
    safeRead(join(lytosDir, "skills", "code-review.md"));
  const issueBody = safeRead(opts.issueFilePath);
  const diff = tryGitDiff(opts.cwd);

  return `# Cross-model audit prompt — ${opts.issueId}

## 1 — Your role

You are auditing a Lytos-managed project. **You did NOT implement this issue.** Another AI session (or human) wrote the code. Your job is to read the issue, read the diff, apply the project's rules and the code-review skill, and return a single GO or NO_GO verdict in the exact block format defined in section 8.

Do not correct the code. Do not implement anything. Do not propose a diff. Only audit.

## 2 — What Lytos is, in 60 seconds

Lytos is a human-first method for AI-assisted development. The project's context (identity, conventions, rules, past decisions, issue lifecycle) lives as Markdown in the Git repo. Every AI session reads that context at the start. Issues move through Kanban columns: \`3-in-progress → 4-review → 5-done\`. An issue in \`4-review/\` is code-complete per the implementer; your job is to rule whether it passes review.

An audit that says **GO** lets the human run \`lyt close\` to promote the issue. An audit that says **NO_GO** sends the issue back to \`3-in-progress\` with a concrete list of points to fix.

## 3 — Project manifest excerpt

\`\`\`markdown
${manifest || "(manifest.md not found — proceed with general software-engineering defaults)"}
\`\`\`

## 4 — Quality rules in scope

### default-rules.md

\`\`\`markdown
${defaultRules || "(no default-rules.md in this project)"}
\`\`\`
${cliRules ? `
### cli-rules.md

\`\`\`markdown
${cliRules}
\`\`\`
` : ""}
## 5 — Review skill to follow

\`\`\`markdown
${reviewSkill || "(no code-review skill found — apply generic SOLID + test-coverage + readability checks)"}
\`\`\`

## 6 — The issue being audited (${opts.issueId})

\`\`\`markdown
${issueBody}
\`\`\`

## 7 — Implementation diff

The branch's work compared to \`main\`:

\`\`\`diff
${diff}
\`\`\`

## 8 — Expected output format (exact, parseable)

Return **only** the markdown block below, with your verdict filled in. No commentary outside the block.

\`\`\`markdown
## Audit — YYYY-MM-DD

**Verdict:** GO
<or>
**Verdict:** NO_GO

### Checks
- [x] Tests pass (mention count if visible in the diff)
- [x] Issue checklist complete
- [x] Rules respected (file/fn size, params, coverage as defined in default-rules.md)
- [x] Documentation aligned

### Notes
Free prose — reference specific files and line ranges from the diff when relevant.

### To fix before next review (only include this section if NO_GO)
- [ ] Concrete actionable point 1
- [ ] Concrete actionable point 2
\`\`\`

## 9 — Exit instructions

- If you have filesystem tools: append your audit block at the end of the issue file (\`${opts.issueFilePath}\`). If the verdict is NO_GO, also move the file from \`4-review/\` to \`3-in-progress/\` and update its frontmatter \`status\` to \`3-in-progress\`.
- If you do not have filesystem tools: reply with **only** the audit block (no preamble, no postscript). The human will pipe it back into \`lyt review ${opts.issueId} --accept\` to land the changes.

Do not mix the two modes.
`;
}

/**
 * Pull the audit block out of a free-form response. Accepts either a
 * bare block, or a block wrapped in noise (short preambles, code
 * fences). Looks for the "## Audit — <date>" heading as the anchor.
 */
export function parseAuditResponse(raw: string): ParsedAudit {
  // Strip outer code fence if the model wrapped the block in ```markdown …```
  const unwrapped = raw.replace(/^```(?:markdown)?\n([\s\S]*?)\n```\s*$/m, "$1");

  const match = unwrapped.match(/(^|\n)(##\s+Audit\s+—\s+\d{4}-\d{2}-\d{2}[\s\S]*?)$/);
  const block = match ? match[2].trim() : unwrapped.trim();

  let verdict: AuditVerdict = "UNKNOWN";
  if (/\*\*Verdict:\*\*\s*GO\b/i.test(block)) verdict = "GO";
  else if (/\*\*Verdict:\*\*\s*NO[_\s-]?GO\b/i.test(block)) verdict = "NO_GO";

  return { verdict, block };
}

export interface ApplyAuditOptions {
  boardDir: string;
  issueFilePath: string;
  parsed: ParsedAudit;
}

export interface ApplyAuditResult {
  newPath: string;
  moved: boolean;
}

/**
 * Append the audit block to the issue file. If the verdict is NO_GO,
 * also move the file from 4-review/ to 3-in-progress/ and rewrite the
 * frontmatter `status` to match.
 */
export function applyAudit(options: ApplyAuditOptions): ApplyAuditResult {
  const { boardDir, issueFilePath, parsed } = options;
  const original = readFileSync(issueFilePath, "utf-8");
  // Normalize: always two blank lines before the new block to separate
  // it from existing content, and a trailing newline.
  const separator = original.endsWith("\n\n") ? "" : original.endsWith("\n") ? "\n" : "\n\n";
  const withAudit = original + separator + parsed.block + "\n";

  let targetPath = issueFilePath;
  let moved = false;

  if (parsed.verdict === "NO_GO") {
    const fileName = issueFilePath.split("/").pop() as string;
    const inProgressDir = join(boardDir, "3-in-progress");
    targetPath = join(inProgressDir, fileName);
    const retagged = withAudit.replace(
      /^status:\s*4-review\s*$/m,
      "status: 3-in-progress"
    );
    writeFileSync(issueFilePath, retagged, "utf-8");
    renameSync(issueFilePath, targetPath);
    moved = true;
  } else {
    writeFileSync(issueFilePath, withAudit, "utf-8");
  }

  // Touch dirname imports to keep TS happy if the helper is tree-shaken
  void dirname;

  return { newPath: targetPath, moved };
}
