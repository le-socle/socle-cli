import { Command } from "commander";
import { execSync } from "child_process";
import { createRequire } from "module";
import { initCommand } from "./commands/init.js";
import { boardCommand } from "./commands/board.js";
import { archiveCommand } from "./commands/archive.js";
import { reviewCommand } from "./commands/review.js";
import { lintCommand } from "./commands/lint.js";
import { doctorCommand } from "./commands/doctor.js";
import { showCommand } from "./commands/show.js";
import { startCommand } from "./commands/start.js";
import { closeCommand } from "./commands/close.js";
import { claimCommand, unclaimCommand } from "./commands/claim.js";
import { upgradeCommand } from "./commands/upgrade.js";
import { ok, error, bold, cyan, green } from "./lib/output.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json");

const program = new Command();

program
  .name("lyt")
  .description(
    "CLI tool for Lytos — a human-first method for working with AI agents"
  )
  .version(VERSION);

program.on("--help", () => {
  console.log("");
  console.log("Examples:");
  console.log("  lyt init --tool claude");
  console.log("  lyt init --tool claude,cursor,copilot");
  console.log("  lyt init --all-tools");
  console.log("  lyt board");
  console.log("  lyt board --all");
  console.log("  lyt start ISS-0053");
  console.log("  lyt close ISS-0053");
  console.log("  lyt close --dry-run");
  console.log("  lyt upgrade --dry-run");
  console.log("  lyt review                 # list pending reviews");
  console.log("  lyt review ISS-0053        # print the audit prompt (use a FRESH AI session, ideally a different vendor)");
  console.log("");
  console.log('Use "lyt <command> --help" for command-specific options and arguments.');
});

program.addCommand(initCommand);
program.addCommand(boardCommand);
program.addCommand(archiveCommand);
program.addCommand(reviewCommand);
program.addCommand(lintCommand);
program.addCommand(doctorCommand);
program.addCommand(showCommand);
program.addCommand(startCommand);
program.addCommand(closeCommand);
program.addCommand(claimCommand);
program.addCommand(unclaimCommand);
program.addCommand(upgradeCommand);

program
  .command("update")
  .description("Update lytos-cli to the latest version")
  .action(() => {
    console.error(`\n  ${cyan(bold("Updating lytos-cli..."))}\n`);
    try {
      execSync("npm install -g lytos-cli@latest", { stdio: "inherit" });
      const newVersion = execSync("lyt --version", { encoding: "utf-8" }).trim();
      console.error("");
      ok(`Updated to ${green(newVersion)}`);
    } catch {
      error("Update failed. Try manually: npm install -g lytos-cli@latest");
      process.exit(1);
    }
  });

program.parse();
