import { Command } from "commander";
import { execSync } from "child_process";
import { createRequire } from "module";
import { initCommand } from "./commands/init.js";
import { boardCommand } from "./commands/board.js";
import { lintCommand } from "./commands/lint.js";
import { doctorCommand } from "./commands/doctor.js";
import { checkForUpdates } from "./lib/update-check.js";
import { ok, error, bold, dim, green } from "./lib/output.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json");

const program = new Command();

program
  .name("lyt")
  .description(
    "CLI tool for Lytos — a human-first method for working with AI agents"
  )
  .version(VERSION);

program.addCommand(initCommand);
program.addCommand(boardCommand);
program.addCommand(lintCommand);
program.addCommand(doctorCommand);

program
  .command("status")
  .description("Display sprint DAG in terminal (coming soon)")
  .action(() => {
    console.error("Coming soon. Follow https://github.com/getlytos/lytos-cli for updates.");
    process.exit(0);
  });

program
  .command("update")
  .description("Update lytos-cli to the latest version")
  .action(() => {
    console.error(`\n  ${bold("Updating lytos-cli...")}\n`);
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

// Non-blocking update check after command execution
checkForUpdates(VERSION);
