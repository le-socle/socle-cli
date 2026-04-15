/**
 * lytos init — Scaffold Lytos in a project.
 *
 * Interactive mode: prompts for project name and AI tool.
 * Non-interactive: uses --name, --tool, --yes flags.
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { basename, resolve } from "path";
import { createInterface } from "readline";
import { detectStack } from "../lib/detect-stack.js";
import { scaffold } from "../lib/scaffold.js";
import { info, ok, warn, error, bold, green } from "../lib/output.js";

function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  const suffix = defaultValue ? ` (${defaultValue})` : "";

  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

async function promptChoice(
  question: string,
  choices: { key: string; label: string }[]
): Promise<string> {
  console.error("");
  console.error(question);
  for (const choice of choices) {
    console.error(`  ${choice.key}) ${choice.label}`);
  }
  console.error("");

  const answer = await prompt("Choice");
  const match = choices.find((c) => c.key === answer);
  return match ? match.key : choices[0].key;
}

export const initCommand = new Command("init")
  .description("Scaffold Lytos in your project")
  .option("--name <name>", "Project name")
  .option(
    "--tool <tool>",
    "AI tool to configure (claude, cursor, codex, none)",
    ""
  )
  .option("--yes", "Skip prompts, use defaults", false)
  .option("--force", "Override existing .lytos/ directory", false)
  .option("--dry-run", "Show what would be created without creating", false)
  .action(async (opts) => {
    const cwd = process.cwd();
    const lytosDir = resolve(cwd, ".lytos");

    // Check if .lytos already exists
    if (existsSync(lytosDir) && !opts.force) {
      error(
        ".lytos/ already exists. Use --force to override."
      );
      process.exit(2);
    }

    // Detect stack
    info("Detecting project stack...");
    const stack = detectStack(cwd);
    if (stack.language) {
      ok(`Detected: ${stack.language}${stack.framework ? ` + ${stack.framework}` : ""}${stack.tests ? ` + ${stack.tests}` : ""}`);
    } else {
      info("No known stack detected — you can fill it in manually.");
    }

    // Get project name
    let projectName = opts.name;
    if (!projectName && !opts.yes) {
      projectName = await prompt(
        "Project name",
        basename(cwd)
      );
    }
    projectName = projectName || basename(cwd);

    // Get AI tool
    let tool = opts.tool;
    if (!tool && !opts.yes) {
      const choice = await promptChoice("Which AI tool do you use?", [
        { key: "1", label: "Claude Code" },
        { key: "2", label: "Cursor" },
        { key: "3", label: "Codex (OpenAI)" },
        { key: "4", label: "Other / None" },
      ]);
      tool =
        choice === "1" ? "claude" :
        choice === "2" ? "cursor" :
        choice === "3" ? "codex" : "none";
    }
    tool = tool || "none";

    // Dry run notice
    if (opts.dryRun) {
      console.error("");
      info(`${bold("Dry run")} — nothing will be created.`);
    }

    // Scaffold
    console.error("");
    info(`Installing Lytos in .lytos/...`);
    console.error("");

    const result = await scaffold({
      projectName,
      tool: tool as "claude" | "cursor" | "codex" | "none",
      stack,
      cwd,
      dryRun: opts.dryRun,
    });

    // Report
    for (const w of result.warnings) {
      warn(w);
    }

    ok(`${result.filesCreated.length} files created`);
    console.error("");

    // Summary
    console.error(bold(green("Lytos is installed.")));
    console.error("");
    console.error("  Next step — open your AI tool and say:");
    console.error("");
    console.error(
      `  ${bold('"Help me configure Lytos for this project."')}`
    );
    console.error("");
    console.error(
      "  The AI will read the briefing, understand the method, and ask"
    );
    console.error(
      "  you the right questions to fill your manifest."
    );
    console.error("");
    console.error("  Installed structure:");
    console.error("  .lytos/");
    console.error("  ├── LYTOS.md              <- AI briefing");
    console.error(
      "  ├── manifest.md           <- fill with your AI's help"
    );
    console.error("  ├── memory/");
    console.error("  │   ├── MEMORY.md");
    console.error(
      "  │   └── cortex/           <- will fill up as you work"
    );
    console.error("  ├── skills/               <- 9 operational skills");
    console.error("  ├── rules/                <- quality criteria");
    console.error("  ├── issue-board/          <- Kanban board");
    console.error("  └── templates/            <- sprint template");
    console.error("");
    console.error(
      `  Documentation: https://github.com/getlytos/lytos-method`
    );
    console.error("");
  });
