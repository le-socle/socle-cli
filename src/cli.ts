import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { boardCommand } from "./commands/board.js";

const program = new Command();

program
  .name("lytos")
  .description(
    "CLI tool for Lytos — a human-first method for working with AI agents"
  )
  .version("0.1.1");

program.addCommand(initCommand);
program.addCommand(boardCommand);

// Future commands:
// program.addCommand(lintCommand);
// program.addCommand(doctorCommand);
// program.addCommand(statusCommand);

program.parse();
