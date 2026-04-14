/**
 * Terminal output helpers.
 *
 * No dependencies — uses ANSI escape codes directly.
 * Respects NO_COLOR env var and --no-color flag.
 */

const noColor =
  process.env.NO_COLOR !== undefined ||
  process.argv.includes("--no-color");

function color(code: string, text: string): string {
  if (noColor) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export const green = (t: string) => color("32", t);
export const red = (t: string) => color("31", t);
export const yellow = (t: string) => color("33", t);
export const blue = (t: string) => color("34", t);
export const bold = (t: string) => color("1", t);
export const dim = (t: string) => color("2", t);

export function info(msg: string): void {
  console.error(`${blue("→")} ${msg}`);
}

export function ok(msg: string): void {
  console.error(`${green("✓")} ${msg}`);
}

export function warn(msg: string): void {
  console.error(`${red("!")} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${red("✗")} ${msg}`);
}
