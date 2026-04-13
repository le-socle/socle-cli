import { Command } from "commander";
import { initCommand } from "./commands/init.js";

const program = new Command();

program
  .name("socle")
  .description(
    "CLI tool for Le Socle — a human-first method for working with AI agents"
  )
  .version("0.0.0");

program.addCommand(initCommand);

// Future commands:
// program.addCommand(boardCommand);
// program.addCommand(lintCommand);
// program.addCommand(doctorCommand);
// program.addCommand(statusCommand);

program.parse();
