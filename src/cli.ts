import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { boardCommand } from "./commands/board.js";
import { checkForUpdates } from "./lib/update-check.js";

const program = new Command();

program
  .name("lyt")
  .description(
    "CLI tool for Lytos — a human-first method for working with AI agents"
  )
  .version("0.2.1");

program.addCommand(initCommand);
program.addCommand(boardCommand);

// Coming soon — registered so they appear in help
program
  .command("lint")
  .description("Validate .lytos/ structure and content (coming soon)")
  .action(() => {
    console.error("Coming soon. Follow https://github.com/getlytos/lytos-cli for updates.");
    process.exit(0);
  });

program
  .command("doctor")
  .description("Full diagnostic — missing files, broken links, stale memory (coming soon)")
  .action(() => {
    console.error("Coming soon. Follow https://github.com/getlytos/lytos-cli for updates.");
    process.exit(0);
  });

program
  .command("status")
  .description("Display sprint DAG in terminal (coming soon)")
  .action(() => {
    console.error("Coming soon. Follow https://github.com/getlytos/lytos-cli for updates.");
    process.exit(0);
  });

const VERSION = "0.2.1";

program.parse();

// Non-blocking update check after command execution
checkForUpdates(VERSION);
