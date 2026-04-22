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

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "fs";
import { execFileSync } from "child_process";
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

function issueBranch(issueBody: string): string | null {
  const fm = parseFrontmatter(issueBody);
  if (!fm) return null;
  const branch = fm.branch;
  return typeof branch === "string" && branch.trim().length > 0
    ? branch.trim()
    : null;
}

/**
 * Capture the implementation diff for the branch declared in the issue
 * frontmatter. Falling back to HEAD is a last resort for older issues
 * that predate the branch field.
 */
function tryGitDiff(cwd: string, diffRef: string): string {
  try {
    const out = execFileSync("git", ["diff", `main...${diffRef}`], {
      cwd,
      encoding: "utf-8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return out || `(no diff — ${diffRef} might already match main)`;
  } catch (err) {
    return `(git diff main...${diffRef} failed: ${err instanceof Error ? err.message : String(err)})`;
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
  const declaredBranch = issueBranch(issueBody);
  const diffRef = declaredBranch || "HEAD";
  const diff = tryGitDiff(opts.cwd, diffRef);

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

The issue declares branch \`${diffRef}\`. The diff below is generated from \`git diff main...${diffRef}\`:

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

/**
 * Detect whether an issue file already carries an audit block. Used by
 * --accept to protect against silent overwrites (callers must pass
 * `--overwrite` to re-audit an already-audited issue).
 */
export function hasExistingAudit(issueFilePath: string): boolean {
  if (!existsSync(issueFilePath)) return false;
  const content = readFileSync(issueFilePath, "utf-8");
  return /^##\s+Audit\s+—\s+\d{4}-\d{2}-\d{2}/m.test(content);
}

export interface ApplyAuditOptions {
  boardDir: string;
  issueFilePath: string;
  parsed: ParsedAudit;
  /**
   * When true, replace any existing `## Audit — <date>` block (and
   * everything after it up to the next top-level heading or EOF) with
   * the new block. When false, append the new block after the existing
   * content — two audits will end up stacked.
   */
  overwrite?: boolean;
}

export interface ApplyAuditResult {
  newPath: string;
  moved: boolean;
  replacedExisting: boolean;
}

/**
 * Append or replace the audit block inside the issue file. On NO_GO,
 * also move the file from 4-review/ to 3-in-progress/ and rewrite the
 * frontmatter `status` to match.
 */
export function applyAudit(options: ApplyAuditOptions): ApplyAuditResult {
  const { boardDir, issueFilePath, parsed, overwrite } = options;
  const original = readFileSync(issueFilePath, "utf-8");

  let rewritten: string;
  let replacedExisting = false;

  if (overwrite && hasExistingAudit(issueFilePath)) {
    // Replace the existing audit block and everything after it. The
    // regex stops at the next `## <heading>` that isn't an Audit block,
    // or at EOF — whichever comes first. Subsequent top-level sections
    // of the issue body are preserved.
    rewritten = original.replace(
      /\n*##\s+Audit\s+—\s+\d{4}-\d{2}-\d{2}[\s\S]*?(?=\n##\s+(?!Audit\s+—)|$)/m,
      "\n\n" + parsed.block + "\n"
    );
    replacedExisting = true;
  } else {
    // Append: normalize spacing so the new block sits on its own.
    const separator = original.endsWith("\n\n") ? "" : original.endsWith("\n") ? "\n" : "\n\n";
    rewritten = original + separator + parsed.block + "\n";
  }

  let targetPath = issueFilePath;
  let moved = false;

  if (parsed.verdict === "NO_GO") {
    const fileName = issueFilePath.split("/").pop() as string;
    const inProgressDir = join(boardDir, "3-in-progress");
    targetPath = join(inProgressDir, fileName);
    const retagged = rewritten.replace(
      /^status:\s*4-review\s*$/m,
      "status: 3-in-progress"
    );
    writeFileSync(issueFilePath, retagged, "utf-8");
    renameSync(issueFilePath, targetPath);
    moved = true;
  } else {
    writeFileSync(issueFilePath, rewritten, "utf-8");
  }

  // Touch dirname imports to keep TS happy if the helper is tree-shaken
  void dirname;

  return { newPath: targetPath, moved, replacedExisting };
}

/**
 * Batch export: write one prompt file per pending issue in 4-review/,
 * under `.lytos/review/<id>.prompt.md`. Returns the list of paths
 * written so callers can print a summary.
 */
export function exportAllPrompts(
  cwd: string,
  boardDir: string
): Array<{ id: string; promptPath: string }> {
  const pending = listPendingReviews(boardDir);
  if (pending.length === 0) return [];

  const outDir = join(cwd, ".lytos", "review");
  if (!existsSync(outDir)) {
    // `.lytos/review/` is a transient work area — create it lazily.
    mkdirSync(outDir, { recursive: true });
  }

  const written: Array<{ id: string; promptPath: string }> = [];
  for (const p of pending) {
    const prompt = buildPrompt({
      cwd,
      issueFilePath: p.filePath,
      issueId: p.id,
    });
    const promptPath = join(outDir, `${p.id}.prompt.md`);
    writeFileSync(promptPath, prompt, "utf-8");
    written.push({ id: p.id, promptPath });
  }
  return written;
}
