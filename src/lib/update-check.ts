/**
 * Check if a newer version of lytos-cli is available on npm.
 *
 * Checks at most once per day (caches timestamp in ~/.lytos/last-update-check).
 * Non-blocking — never delays the command, never throws.
 * Zero dependencies.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { get } from "https";
import { bold, cyan, yellow, dim } from "./output.js";

const PACKAGE_NAME = "lytos-cli";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_DIR = join(homedir(), ".lytos");
const CACHE_FILE = join(CACHE_DIR, "last-update-check");

/** Compare two semver strings. Returns true if remote > local. */
function isNewer(remote: string, local: string): boolean {
  const r = remote.split(".").map(Number);
  const l = local.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((r[i] || 0) > (l[i] || 0)) return true;
    if ((r[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
}

/** Check if we should run the update check (max once per day) */
function shouldCheck(): boolean {
  try {
    if (!existsSync(CACHE_FILE)) return true;
    const lastCheck = parseInt(readFileSync(CACHE_FILE, "utf-8").trim(), 10);
    return Date.now() - lastCheck > CHECK_INTERVAL_MS;
  } catch {
    return true;
  }
}

/** Save the current timestamp to cache */
function saveCheckTimestamp(): void {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, String(Date.now()), "utf-8");
  } catch {
    // ignore — not critical
  }
}

/** Fetch latest version from npm registry */
function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 3000);

    get(
      `https://registry.npmjs.org/${PACKAGE_NAME}/latest`,
      { headers: { Accept: "application/json" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          clearTimeout(timeout);
          try {
            const json = JSON.parse(data);
            resolve(json.version || null);
          } catch {
            resolve(null);
          }
        });
        res.on("error", () => {
          clearTimeout(timeout);
          resolve(null);
        });
      }
    ).on("error", () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

/**
 * Run the update check. Non-blocking, silent on failure, max once per day.
 * Disabled with LYT_NO_UPDATE_CHECK=1 env var.
 */
export async function checkForUpdates(currentVersion: string): Promise<void> {
  if (process.env.LYT_NO_UPDATE_CHECK) return;
  if (!shouldCheck()) return;

  saveCheckTimestamp();

  const latest = await fetchLatestVersion();
  if (!latest) return;

  if (isNewer(latest, currentVersion)) {
    console.error("");
    console.error(
      `  ${yellow("⚠")} Update available: ${dim(currentVersion)} → ${cyan(bold(latest))}`
    );
    console.error(
      `    Run ${cyan(bold("lyt update"))} to update`
    );
    console.error("");
  }
}
