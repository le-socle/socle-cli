/**
 * Terminal output helpers.
 *
 * No dependencies — uses ANSI escape codes directly.
 * Respects NO_COLOR env var and --no-color flag.
 *
 * Palette convention (semantic):
 *   - red     → errors only (error(), ✗ icon, failure counts)
 *   - yellow  → warnings, in-progress state, pending items
 *   - green   → success, done state, completed items
 *   - cyan    → chrome: issue IDs, titles, field labels
 *   - blue    → info prefix (→), sprint/review states
 *   - dim     → de-emphasised secondary text only
 *   - bold    → emphasis; never used alone for color (some terminal
 *               themes render bold with a hue shift, so always pair
 *               it with an explicit color when hierarchy matters).
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
export const cyan = (t: string) => color("36", t);
export const bold = (t: string) => color("1", t);
export const dim = (t: string) => color("2", t);

export function info(msg: string): void {
  console.error(`${blue("→")} ${msg}`);
}

export function ok(msg: string): void {
  console.error(`${green("✓")} ${msg}`);
}

export function warn(msg: string): void {
  console.error(`${yellow("!")} ${msg}`);
}

export function error(msg: string): void {
  console.error(`${red("✗")} ${msg}`);
}
