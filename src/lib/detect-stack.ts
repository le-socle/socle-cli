/**
 * Detects the project's tech stack by looking at common config files.
 *
 * Returns a partial manifest-like object with what was detected.
 * The human (or their AI) fills in the rest.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface DetectedStack {
  language: string;
  framework: string;
  database: string;
  tests: string;
  packageManager: string;
}

interface Detector {
  file: string;
  detect: (content: string, cwd: string) => Partial<DetectedStack>;
}

const detectors: Detector[] = [
  {
    file: "package.json",
    detect: (content) => {
      const pkg = JSON.parse(content);
      const deps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      const stack: Partial<DetectedStack> = {};

      // Language
      if (deps.typescript || deps["ts-node"]) {
        stack.language = "TypeScript";
      } else {
        stack.language = "JavaScript";
      }

      // Framework
      if (deps.next) stack.framework = "Next.js";
      else if (deps.nuxt) stack.framework = "Nuxt";
      else if (deps.react) stack.framework = "React";
      else if (deps.vue) stack.framework = "Vue";
      else if (deps.svelte || deps["@sveltejs/kit"]) stack.framework = "SvelteKit";
      else if (deps.express) stack.framework = "Express";
      else if (deps.fastify) stack.framework = "Fastify";
      else if (deps.hono) stack.framework = "Hono";
      else if (deps.astro) stack.framework = "Astro";

      // Database
      if (deps.prisma || deps["@prisma/client"]) stack.database = "Prisma";
      else if (deps.mongoose) stack.database = "MongoDB (Mongoose)";
      else if (deps.pg) stack.database = "PostgreSQL";
      else if (deps.mysql2) stack.database = "MySQL";
      else if (deps.drizzle || deps["drizzle-orm"]) stack.database = "Drizzle ORM";

      // Tests
      if (deps.vitest) stack.tests = "Vitest";
      else if (deps.jest) stack.tests = "Jest";
      else if (deps["@playwright/test"]) stack.tests = "Playwright";
      else if (deps.mocha) stack.tests = "Mocha";

      // Package manager
      if (existsSync("bun.lockb")) stack.packageManager = "Bun";
      else if (existsSync("pnpm-lock.yaml")) stack.packageManager = "pnpm";
      else if (existsSync("yarn.lock")) stack.packageManager = "Yarn";
      else stack.packageManager = "npm";

      return stack;
    },
  },
  {
    file: "requirements.txt",
    detect: (content) => {
      const stack: Partial<DetectedStack> = { language: "Python" };
      const lower = content.toLowerCase();

      if (lower.includes("fastapi")) stack.framework = "FastAPI";
      else if (lower.includes("django")) stack.framework = "Django";
      else if (lower.includes("flask")) stack.framework = "Flask";

      if (lower.includes("sqlalchemy")) stack.database = "SQLAlchemy";
      else if (lower.includes("psycopg")) stack.database = "PostgreSQL";
      else if (lower.includes("pymongo")) stack.database = "MongoDB";

      if (lower.includes("pytest")) stack.tests = "Pytest";

      return stack;
    },
  },
  {
    file: "pyproject.toml",
    detect: (content) => {
      const stack: Partial<DetectedStack> = { language: "Python" };
      const lower = content.toLowerCase();

      if (lower.includes("fastapi")) stack.framework = "FastAPI";
      else if (lower.includes("django")) stack.framework = "Django";
      else if (lower.includes("flask")) stack.framework = "Flask";

      if (lower.includes("pytest")) stack.tests = "Pytest";

      return stack;
    },
  },
  {
    file: "go.mod",
    detect: (content) => {
      const stack: Partial<DetectedStack> = { language: "Go" };

      if (content.includes("gin-gonic")) stack.framework = "Gin";
      else if (content.includes("gorilla/mux")) stack.framework = "Gorilla Mux";
      else if (content.includes("labstack/echo")) stack.framework = "Echo";
      else if (content.includes("gofiber")) stack.framework = "Fiber";

      return stack;
    },
  },
  {
    file: "Cargo.toml",
    detect: (content) => {
      const stack: Partial<DetectedStack> = { language: "Rust" };

      if (content.includes("actix-web")) stack.framework = "Actix Web";
      else if (content.includes("axum")) stack.framework = "Axum";
      else if (content.includes("rocket")) stack.framework = "Rocket";

      return stack;
    },
  },
  {
    file: "composer.json",
    detect: (content) => {
      const pkg = JSON.parse(content);
      const stack: Partial<DetectedStack> = { language: "PHP" };
      const req = JSON.stringify(pkg.require || {}).toLowerCase();

      if (req.includes("laravel")) stack.framework = "Laravel";
      else if (req.includes("symfony")) stack.framework = "Symfony";
      else if (req.includes("wordpress")) stack.framework = "WordPress";

      if (req.includes("phpunit")) stack.tests = "PHPUnit";

      return stack;
    },
  },
];

export function detectStack(cwd: string): Partial<DetectedStack> {
  let result: Partial<DetectedStack> = {};

  for (const detector of detectors) {
    const filePath = join(cwd, detector.file);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        result = { ...result, ...detector.detect(content, cwd) };
      } catch {
        // File exists but can't be parsed — skip
      }
    }
  }

  return result;
}
