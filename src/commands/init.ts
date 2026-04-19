/**
 * lytos init — Scaffold Lytos in a project.
 *
 * Interactive mode: prompts for project name, AI tool, profile, and language.
 * Non-interactive: uses --name, --tool, --profile, --lang, --yes flags.
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { basename, resolve } from "path";
import { createInterface } from "readline";
import { detectStack } from "../lib/detect-stack.js";
import { scaffold } from "../lib/scaffold.js";
import { info, ok, warn, error, bold, green, blue, cyan, dim, yellow } from "../lib/output.js";
import { checkForUpdates } from "../lib/update-check.js";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);
const { version: VERSION } = _require("../package.json");

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

export type Profile = "vibe-coder" | "developer" | "lead";
export type Lang = "en" | "fr";

function showBriefing(profile: Profile, lang: Lang): void {
  console.error("");
  console.error(bold(green(lang === "fr" ? "Lytos est installé !" : "Lytos is installed!")));
  console.error("");

  if (profile === "vibe-coder") {
    if (lang === "fr") {
      console.error(cyan(bold("  L'IDÉE CLÉ")));
      console.error("  Tout repose sur les issues — des tâches claires et précises.");
      console.error("  Une bonne issue = ton IA sait exactement quoi construire.");
      console.error("  Une issue vague = ton IA devine et produit du code générique.");
      console.error("");
      console.error(cyan(bold("  COMMENT ÇA MARCHE")));
      console.error("");
      console.error(`  ${cyan(bold("Étape 1"))} — ${yellow("BRAINSTORM")}`);
      console.error("    Ouvre ton outil IA et décris ton idée de projet.");
      console.error("    L'IA va t'aider à écrire un manifest (l'identité du projet)");
      console.error("    et créer des issues (les tâches à accomplir).");
      console.error("");
      console.error(`  ${cyan(bold("Étape 2"))} — ${blue("ORGANISER")}`);
      console.error("    L'IA trie les tâches par priorité dans un kanban board.");
      console.error("    Tu valides ce qu'on fait en premier.");
      console.error(`    Lance : ${cyan(bold("lyt board"))} — pour voir ton board à tout moment.`);
      console.error("");
      console.error(`  ${cyan(bold("Étape 3"))} — ${green("CONSTRUIRE")}`);
      console.error("    Travaille sur une issue à la fois avec ton IA.");
      console.error("    Chaque issue a une checklist — suis-la étape par étape.");
      console.error("    Quand c'est fini, l'IA la déplace en \"done\".");
      console.error("");
      console.error(`  ${cyan(bold("Étape 4"))} — ${dim("APPRENDRE")}`);
      console.error("    L'IA sauvegarde ce qu'elle a appris dans memory/.");
      console.error("    À la prochaine session, elle se souvient de ton projet.");
      console.error("    Plus besoin de tout réexpliquer.");
      console.error("");
      console.error(cyan(bold("  PROCHAINE ÉTAPE")));
      console.error("  Ouvre ton outil IA et dis :");
      console.error(`  ${cyan(bold("\"Aide-moi à configurer Lytos et planifier mon projet.\""))}`);
    } else {
      console.error(cyan(bold("  THE KEY IDEA")));
      console.error("  Everything starts with issues — small, clear tasks.");
      console.error("  A good issue = your AI knows exactly what to build.");
      console.error("  A vague issue = your AI guesses and produces generic code.");
      console.error("");
      console.error(cyan(bold("  HOW IT WORKS")));
      console.error("");
      console.error(`  ${cyan(bold("Step 1"))} — ${yellow("BRAINSTORM")}`);
      console.error("    Open your AI tool and describe your project idea.");
      console.error("    The AI will help you write a manifest (your project's identity)");
      console.error("    and create issues (tasks to accomplish).");
      console.error("");
      console.error(`  ${cyan(bold("Step 2"))} — ${blue("ORGANIZE")}`);
      console.error("    The AI sorts tasks by priority in a kanban board.");
      console.error("    You validate what to do first.");
      console.error(`    Run: ${cyan(bold("lyt board"))} — to see your board at any time.`);
      console.error("");
      console.error(`  ${cyan(bold("Step 3"))} — ${green("BUILD")}`);
      console.error("    Work on one issue at a time with your AI.");
      console.error("    Each issue has a checklist — follow it step by step.");
      console.error("    When it's done, the AI moves it to \"done\".");
      console.error("");
      console.error(`  ${cyan(bold("Step 4"))} — ${dim("LEARN")}`);
      console.error("    The AI saves what it learned in memory/.");
      console.error("    Next session, it remembers your project.");
      console.error("    No more re-explaining everything.");
      console.error("");
      console.error(cyan(bold("  NEXT STEP")));
      console.error("  Open your AI tool and say:");
      console.error(`  ${cyan(bold("\"Help me configure Lytos and plan my project.\""))}`);
    }
  } else if (profile === "developer") {
    if (lang === "fr") {
      console.error(cyan(bold("  L'IDÉE CLÉ")));
      console.error("  La qualité du code de ton IA dépend de tes issues.");
      console.error("  Une issue structurée avec contexte, checklist et definition of done");
      console.error("  = du code précis et testable du premier coup.");
      console.error(`  Lance : ${cyan(bold("lyt board"))} — ton cockpit projet.`);
      console.error("");
      console.error(cyan(bold("  STRUCTURE")));
      console.error("  .lytos/manifest.md      <- constitution du projet");
      console.error("  .lytos/skills/           <- 9 procédures opérationnelles");
      console.error("  .lytos/rules/            <- critères de qualité (appliqués)");
      console.error("  .lytos/issue-board/      <- kanban board (source de vérité)");
      console.error("  .lytos/memory/           <- savoir persistant");
      console.error("");
      console.error(cyan(bold("  PROCHAINE ÉTAPE")));
      console.error("  Ouvre ton outil IA et dis :");
      console.error(`  ${cyan(bold("\"Aide-moi à configurer Lytos pour ce projet.\""))}`);
    } else {
      console.error(cyan(bold("  THE KEY IDEA")));
      console.error("  The quality of your AI output depends on your issues.");
      console.error("  A well-structured issue with context, checklist, and definition");
      console.error("  of done = precise, testable code on the first try.");
      console.error(`  Run: ${cyan(bold("lyt board"))} — your project cockpit.`);
      console.error("");
      console.error(cyan(bold("  STRUCTURE")));
      console.error("  .lytos/manifest.md      <- project constitution");
      console.error("  .lytos/skills/           <- 9 operational procedures");
      console.error("  .lytos/rules/            <- quality criteria (enforced)");
      console.error("  .lytos/issue-board/      <- kanban board (source of truth)");
      console.error("  .lytos/memory/           <- persistent knowledge");
      console.error("");
      console.error(cyan(bold("  NEXT STEP")));
      console.error("  Open your AI tool and say:");
      console.error(`  ${cyan(bold("\"Help me configure Lytos for this project.\""))}`);
    }
  } else {
    // lead
    if (lang === "fr") {
      console.error(cyan(bold("  TON RÔLE")));
      console.error("  Tu es l'architecte du système. Tu définis :");
      console.error("  - Le manifest (identité et contraintes du projet)");
      console.error("  - Les rules (critères de qualité que l'IA applique)");
      console.error("  - Le sprint (quoi construire et dans quel ordre)");
      console.error("");
      console.error("  Ton équipe utilise " + cyan(bold("lyt board")) + " pour suivre l'avancement.");
      console.error("  La qualité de leur production dépend de la qualité");
      console.error("  des issues que tu définis.");
      console.error("");
      console.error(cyan(bold("  FICHIERS CLÉS")));
      console.error("  .lytos/manifest.md      <- le fichier le plus impactant");
      console.error("  .lytos/rules/            <- ce que \"fini\" veut dire");
      console.error("  .lytos/issue-board/      <- ton kanban (YAML = source de vérité)");
      console.error("  .lytos/memory/           <- grandit à chaque sprint");
      console.error("");
      console.error(cyan(bold("  PROCHAINE ÉTAPE")));
      console.error("  Ouvre ton outil IA et dis :");
      console.error(`  ${cyan(bold("\"Aide-moi à configurer Lytos et planifier le premier sprint.\""))}`);
    } else {
      console.error(cyan(bold("  YOUR ROLE")));
      console.error("  You are the system architect. You define:");
      console.error("  - The manifest (project identity and constraints)");
      console.error("  - The rules (quality criteria your AI enforces)");
      console.error("  - The sprint (what to build and in what order)");
      console.error("");
      console.error("  Your team uses " + cyan(bold("lyt board")) + " to track progress.");
      console.error("  The quality of their output depends on the quality");
      console.error("  of the issues you define.");
      console.error("");
      console.error(cyan(bold("  KEY FILES")));
      console.error("  .lytos/manifest.md      <- highest-leverage file");
      console.error("  .lytos/rules/            <- what \"done\" means");
      console.error("  .lytos/issue-board/      <- your kanban (YAML = source of truth)");
      console.error("  .lytos/memory/           <- grows with each sprint");
      console.error("");
      console.error(cyan(bold("  NEXT STEP")));
      console.error("  Open your AI tool and say:");
      console.error(`  ${cyan(bold("\"Help me configure Lytos and plan the first sprint.\""))}`);
    }
  }

  console.error("");
  console.error(`  Documentation: https://lytos.org`);
  console.error("");
}

export const initCommand = new Command("init")
  .description("Scaffold Lytos in your project")
  .option("--name <name>", "Project name")
  .option(
    "--tool <tool>",
    "AI tool to configure (claude, cursor, codex, none)",
    ""
  )
  .option(
    "--profile <profile>",
    "User profile (vibe-coder, developer, lead)",
    ""
  )
  .option("--lang <lang>", "Language (en, fr)", "")
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

    // Get language (first — drives all subsequent prompts)
    let lang = opts.lang as Lang;
    if (!lang && !opts.yes) {
      const choice = await promptChoice("Language / Langue ?", [
        { key: "1", label: "English" },
        { key: "2", label: "Français" },
      ]);
      lang = choice === "2" ? "fr" : "en";
    }
    lang = lang || "en";

    // Get profile
    let profile = opts.profile as Profile;
    if (!profile && !opts.yes) {
      const choice = await promptChoice(
        lang === "fr"
          ? "Quel est ton niveau d'expérience ?"
          : "What's your experience level?",
        lang === "fr"
          ? [
              { key: "1", label: "Je débute avec l'IA (vibe coder)" },
              { key: "2", label: "Je suis développeur" },
              { key: "3", label: "Je suis lead développeur" },
            ]
          : [
              { key: "1", label: "I'm new to coding with AI (vibe coder)" },
              { key: "2", label: "I'm a developer" },
              { key: "3", label: "I'm a lead developer" },
            ]
      );
      profile =
        choice === "1" ? "vibe-coder" :
        choice === "2" ? "developer" : "lead";
    }
    profile = profile || "developer";

    // Get project name
    let projectName = opts.name;
    if (!projectName && !opts.yes) {
      projectName = await prompt(
        lang === "fr" ? "Nom du projet" : "Project name",
        basename(cwd)
      );
    }
    projectName = projectName || basename(cwd);

    // Get AI tool
    let tool = opts.tool;
    if (!tool && !opts.yes) {
      const choice = await promptChoice(
        lang === "fr" ? "Quel outil IA utilises-tu ?" : "Which AI tool do you use?",
        [
          { key: "1", label: "Claude Code" },
          { key: "2", label: "Cursor" },
          { key: "3", label: "Codex (OpenAI)" },
          { key: "4", label: lang === "fr" ? "Autre / Aucun" : "Other / None" },
        ]
      );
      tool =
        choice === "1" ? "claude" :
        choice === "2" ? "cursor" :
        choice === "3" ? "codex" : "none";
    }
    tool = tool || "none";

    // Dry run notice
    if (opts.dryRun) {
      console.error("");
      info(`${yellow(bold("Dry run"))} — nothing will be created.`);
    }

    // Scaffold
    console.error("");
    info(lang === "fr" ? "Installation de Lytos dans .lytos/..." : "Installing Lytos in .lytos/...");
    console.error("");

    const result = await scaffold({
      projectName,
      tool: tool as "claude" | "cursor" | "codex" | "none",
      lang,
      profile,
      stack,
      cwd,
      dryRun: opts.dryRun,
    });

    // Report
    for (const w of result.warnings) {
      warn(w);
    }

    ok(lang === "fr"
      ? `${result.filesCreated.length} fichiers créés`
      : `${result.filesCreated.length} files created`
    );

    // Show adapted briefing
    showBriefing(profile, lang);

    // Non-blocking update check (init already uses network)
    checkForUpdates(VERSION);
  });
