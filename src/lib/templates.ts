/**
 * Template generators for all files created by `lytos init`.
 *
 * Each function returns the file content as a string.
 * Variables (project name, date, stack) are injected at generation time.
 */

import { DetectedStack } from "./detect-stack.js";

const REPO_URL = "https://github.com/getlytos/lytos-method";

interface TemplateContext {
  projectName: string;
  date: string;
  stack: Partial<DetectedStack>;
  lang?: "en" | "fr";
}

export function manifestTemplate(ctx: TemplateContext): string {
  const stackLabels = ctx.lang === "fr"
    ? { language: "Langage", framework: "Framework", database: "Base de données", tests: "Tests" }
    : { language: "Language", framework: "Framework", database: "Database", tests: "Tests" };

  const stackRows = [
    `| ${stackLabels.language} | ${ctx.stack.language || ""} |`,
    `| ${stackLabels.framework} | ${ctx.stack.framework || ""} |`,
    `| ${stackLabels.database} | ${ctx.stack.database || ""} |`,
    `| ${stackLabels.tests} | ${ctx.stack.tests || ""} |`,
  ].join("\n");

  if (ctx.lang === "fr") {
    return `# Manifest — ${ctx.projectName}

*Ce fichier est la constitution du projet. Il est lu par les agents au démarrage de chaque session de travail.*

---

## Identité

| Champ | Valeur |
|-------|--------|
| Nom | ${ctx.projectName} |
| Description | |
| Propriétaire | |
| Repo | |

---

## Pourquoi ce projet existe

*3-5 phrases. Le "pourquoi" de ce projet.*

---

## Ce que ce projet est

-

## Ce que ce projet n'est pas

-

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
${stackRows}

---

## Vocabulaire du projet

| Terme | Définition |
|-------|------------|
| | |

---

## Principes de développement

*Quand un agent hésite entre deux approches, il consulte ces principes pour décider. Formuler comme des arbitrages : "on préfère X plutôt que Y, parce que Z."*

-
-

---

## Modèles IA par complexité

*Mappez vos propres modèles selon votre budget et vos outils. Mettez à jour quand de meilleurs modèles sortent.*

| Complexité | Usage | Modèle |
|------------|-------|--------|
| \`light\` | Documentation, formatage, renommage, boilerplate | |
| \`standard\` | Développement quotidien, code review, tests | |
| \`heavy\` | Architecture complexe, algorithmes critiques, sécurité | |

---

## Liens importants

| Ressource | URL |
|-----------|-----|
| Repo principal | |
| Documentation | |
| Staging | |
| Production | |

---

*Dernière mise à jour : ${ctx.date}*
`;
  }

  return `# Manifest — ${ctx.projectName}

*This file is the project's constitution. It is read by agents at the start of each work session.*

---

## Identity

| Field | Value |
|-------|-------|
| Name | ${ctx.projectName} |
| Description | |
| Owner | |
| Repo | |

---

## Why this project exists

*3-5 sentences. The "why" of this project.*

---

## What this project is

-

## What this project is not

-

---

## Tech stack

| Component | Technology |
|-----------|------------|
${stackRows}

---

## Project vocabulary

| Term | Definition |
|------|-----------|
| | |

---

## Development principles

*When an agent hesitates between two approaches, it consults these principles to decide. Formulate as trade-offs: "we prefer X over Y, because Z."*

-
-

---

## AI models by complexity

*Map your own models based on your budget and tools. Update when better models come out.*

| Complexity | Usage | Model |
|------------|-------|-------|
| \`light\` | Documentation, formatting, renaming, boilerplate | |
| \`standard\` | Day-to-day development, code review, tests | |
| \`heavy\` | Complex architecture, critical algorithms, security | |

---

## Important links

| Resource | URL |
|----------|-----|
| Main repo | |
| Documentation | |
| Staging | |
| Production | |

---

*Last updated: ${ctx.date}*
`;
}

export function memoryTemplate(ctx: TemplateContext): string {
  if (ctx.lang === "fr") {
    return `# Mémoire — ${ctx.projectName}

*Ce fichier est la table des matières de la mémoire du projet. Ne pas tout lire — charger uniquement ce qui est pertinent pour la tâche en cours.*

> **Dernière mise à jour** : ${ctx.date}
> **Nombre d'entrées** : 0

---

## Index des sections

| Fichier | Contenu | Charger quand... |
|---------|---------|-----------------|
| [architecture.md](./cortex/architecture.md) | Décisions architecturales, choix techniques | Toute tâche structurelle |
| [backend.md](./cortex/backend.md) | Patterns et pièges côté serveur | Tâche backend |
| [frontend.md](./cortex/frontend.md) | Patterns et pièges côté client | Tâche frontend |
| [patterns.md](./cortex/patterns.md) | Patterns de code récurrents | Code review, nouveau code |
| [bugs.md](./cortex/bugs.md) | Problèmes récurrents et solutions | Debug, correction |
| [business.md](./cortex/business.md) | Contexte métier, vocabulaire | Logique métier, UX |
| [sprints.md](./cortex/sprints.md) | Historique des sprints | Planification |

---

## Résumé vivant

*3-5 lignes. L'état actuel du projet en un coup d'œil.*

---

*Le dossier est la structure. Le fichier est le contenu. Cette table des matières est la carte.*
`;
  }

  return `# Memory — ${ctx.projectName}

*This file is the project memory's table of contents. Do not read everything — load only what is relevant to the current task.*

> **Last updated**: ${ctx.date}
> **Number of entries**: 0

---

## Section index

| File | Content | Load when... |
|------|---------|--------------|
| [architecture.md](./cortex/architecture.md) | Architectural decisions, technical choices | Any structural task |
| [backend.md](./cortex/backend.md) | Server-side patterns and pitfalls | Backend task |
| [frontend.md](./cortex/frontend.md) | Client-side patterns and pitfalls | Frontend task |
| [patterns.md](./cortex/patterns.md) | Recurring code patterns | Code review, new code |
| [bugs.md](./cortex/bugs.md) | Recurring problems and solutions | Debug, fix |
| [business.md](./cortex/business.md) | Business context, vocabulary | Business logic, UX |
| [sprints.md](./cortex/sprints.md) | Sprint history | Planning |

---

## Living summary

*3-5 lines. The current state of the project at a glance.*

---

*The folder is the structure. The file is the content. This table of contents is the map.*
`;
}

interface CortexFile {
  name: string;
  title: string;
  description: string;
  example: string;
}

const cortexFiles: CortexFile[] = [
  {
    name: "architecture.md",
    title: "Architecture & Technical Decisions",
    description:
      "Load this file for any task that affects the project structure.",
    example: `### ${new Date().toISOString().slice(0, 10)} — Database choice

**Context**: Hesitation between SQLite (simple) and PostgreSQL (robust).
**Decision**: PostgreSQL from the start.
**Consequence**: Requires Docker for local dev, but no painful migration later.`,
  },
  {
    name: "backend.md",
    title: "Backend",
    description:
      "Load this file for any backend task: API, database, services.",
    example: `### Key files

| File | Role |
|------|------|
| \`src/main.py\` | Application entry point |
| \`src/models/\` | Data models |
| \`src/routes/\` | API endpoints |`,
  },
  {
    name: "frontend.md",
    title: "Frontend",
    description:
      "Load this file for any frontend task: UI, components, styles.",
    example: `### Key files

| File | Role |
|------|------|
| \`src/App.tsx\` | Root component |
| \`src/components/\` | Reusable components |
| \`src/hooks/\` | Custom hooks |`,
  },
  {
    name: "patterns.md",
    title: "Discovered Patterns",
    description:
      "Load this file for code review, refactoring, or writing new code.",
    example: `### Pattern name

**What**: One-sentence description of the pattern.
**Where**: File(s) where it is applied.
**Why it works**: What makes it effective in this context.`,
  },
  {
    name: "bugs.md",
    title: "Recurring Problems & Solutions",
    description:
      "Load this file before debugging — the problem may have already been solved.",
    example: `| Problem | Cause | Solution |
|---------|-------|----------|
| Tests fail on CI but pass locally | Missing env variables in pipeline | Add secrets in CI settings |`,
  },
  {
    name: "business.md",
    title: "Business Context",
    description:
      "Load this file for any task involving business logic or UX.",
    example: `### Business concept name

**Rule**: What the business requires.
**Why**: The business reason (not technical).
**Code impact**: What this means concretely in the code.`,
  },
  {
    name: "sprints.md",
    title: "Sprint History",
    description: "Load this file at sprint start, retrospective, or planning.",
    example: `| Sprint | Objective | Result | Key learning |
|--------|-----------|--------|--------------|`,
  },
];

const cortexFilesFr: CortexFile[] = [
  {
    name: "architecture.md",
    title: "Architecture & Décisions techniques",
    description: "Charger ce fichier pour toute tâche affectant la structure du projet.",
    example: `### ${new Date().toISOString().slice(0, 10)} — Choix de base de données

**Contexte** : Hésitation entre SQLite (simple) et PostgreSQL (robuste).
**Décision** : PostgreSQL dès le départ.
**Conséquence** : Nécessite Docker en local, mais pas de migration douloureuse plus tard.`,
  },
  {
    name: "backend.md",
    title: "Backend",
    description: "Charger ce fichier pour toute tâche backend : API, base de données, services.",
    example: `### Fichiers clés

| Fichier | Rôle |
|---------|------|
| \`src/main.py\` | Point d'entrée de l'application |
| \`src/models/\` | Modèles de données |
| \`src/routes/\` | Endpoints API |`,
  },
  {
    name: "frontend.md",
    title: "Frontend",
    description: "Charger ce fichier pour toute tâche frontend : UI, composants, styles.",
    example: `### Fichiers clés

| Fichier | Rôle |
|---------|------|
| \`src/App.tsx\` | Composant racine |
| \`src/components/\` | Composants réutilisables |
| \`src/hooks/\` | Hooks personnalisés |`,
  },
  {
    name: "patterns.md",
    title: "Patterns découverts",
    description: "Charger ce fichier pour la code review, le refactoring ou l'écriture de nouveau code.",
    example: `### Nom du pattern

**Quoi** : Description en une phrase du pattern.
**Où** : Fichier(s) où il est appliqué.
**Pourquoi ça marche** : Ce qui le rend efficace dans ce contexte.`,
  },
  {
    name: "bugs.md",
    title: "Problèmes récurrents & Solutions",
    description: "Charger ce fichier avant de déboguer — le problème a peut-être déjà été résolu.",
    example: `| Problème | Cause | Solution |
|----------|-------|----------|
| Les tests échouent en CI mais passent en local | Variables d'env manquantes dans le pipeline | Ajouter les secrets dans les paramètres CI |`,
  },
  {
    name: "business.md",
    title: "Contexte métier",
    description: "Charger ce fichier pour toute tâche impliquant de la logique métier ou de l'UX.",
    example: `### Nom du concept métier

**Règle** : Ce que le métier exige.
**Pourquoi** : La raison métier (pas technique).
**Impact code** : Ce que ça signifie concrètement dans le code.`,
  },
  {
    name: "sprints.md",
    title: "Historique des sprints",
    description: "Charger ce fichier au démarrage d'un sprint, en rétrospective ou en planification.",
    example: `| Sprint | Objectif | Résultat | Apprentissage clé |
|--------|----------|----------|-------------------|`,
  },
];

export function cortexTemplate(file: CortexFile, lang?: "en" | "fr"): string {
  const heading = lang === "fr" ? "Mémoire" : "Memory";
  return `# ${heading} — ${file.title}

*${file.description}*

---

<!-- Example to adapt or remove:

${file.example}

-->
`;
}

export function getCortexFiles(lang?: "en" | "fr"): CortexFile[] {
  return lang === "fr" ? cortexFilesFr : cortexFiles;
}

export function boardTemplate(ctx: TemplateContext): string {
  if (ctx.lang === "fr") {
    return `# Issue Board — ${ctx.projectName}

> Chaque issue = un fichier \`ISS-XXXX-titre.md\` dans le dossier correspondant à son statut.
>
> **Dernière mise à jour** : ${ctx.date}
> **Prochain numéro** : ISS-0001

> Régénérer : \`npx lytos board\`

---

## Index des issues

### 0-icebox (idées)

_Aucune issue._

### 1-backlog (priorisé)

_Aucune issue._

### 2-sprint (engagé)

_Aucune issue._

### 3-in-progress (en cours)

_Aucune issue._

### 4-review (révision)

_Aucune issue._

### Done

_Aucune issue archivée._

---

*Le frontmatter YAML est la source de vérité. Le dossier est le statut visuel. Le BOARD.md est la carte.*
`;
  }

  return `# Issue Board — ${ctx.projectName}

> Each issue = a \`ISS-XXXX-title.md\` file in the folder matching its status.
>
> **Last updated**: ${ctx.date}
> **Next number**: ISS-0001

> Regenerate: \`npx lytos board\`

---

## Issue index

### 0-icebox (ideas)

_No issues._

### 1-backlog (prioritized)

_No issues._

### 2-sprint (committed)

_No issues._

### 3-in-progress (in dev)

_No issues._

### 4-review (review/test)

_No issues._

### 5-done (completed)

_No issues._

---

*The YAML frontmatter is the source of truth. The folder is the visual status. The BOARD.md is the map.*
`;
}

export function claudeTemplate(_ctx: TemplateContext): string {
  return `# CLAUDE.md

This project uses **Lytos** — a human-first method for working with AI agents.

## First session (setup)

If the manifest is empty or incomplete, read first:
- .lytos/LYTOS.md — understand the method and how to help fill the files

## Every session

Read these files in order:
1. .lytos/manifest.md — the project constitution (identity, stack, principles, AI models)
2. .lytos/memory/MEMORY.md — the memory summary (then load relevant cortex/ sections)
3. .lytos/rules/default-rules.md — quality criteria

## To work on a task

4. .lytos/issue-board/BOARD.md — board state
5. .lytos/skills/session-start.md — full start and end-of-task procedure

## Rules

- The YAML frontmatter of issues is the source of truth
- Don't interpret silently — ask if an instruction is ambiguous
- At end of task: update frontmatter, move the file, update BOARD.md
- Check the issue's \`complexity\` field + the manifest table for which model to use

Documentation: ${REPO_URL}
`;
}

export function codexTemplate(_ctx: TemplateContext): string {
  return `# Lytos Agent Configuration

This project uses **Lytos** — a human-first method for working with AI agents.

## First session (setup)

If the manifest is empty or incomplete, read first:
- .lytos/LYTOS.md — understand the method and how to help fill the files

## Every session

Read these files in order:
1. .lytos/manifest.md — the project constitution (identity, stack, principles, AI models)
2. .lytos/memory/MEMORY.md — the memory summary (then load relevant cortex/ sections)
3. .lytos/rules/default-rules.md — quality criteria

## To work on a task

4. .lytos/issue-board/BOARD.md — board state
5. .lytos/skills/session-start.md — full start and end-of-task procedure

## Rules

- The YAML frontmatter of issues is the source of truth
- Don't interpret silently — ask if an instruction is ambiguous
- At end of task: update frontmatter, move the file, update BOARD.md
- Check the issue's \`complexity\` field + the manifest table for which model to use

Documentation: ${REPO_URL}
`;
}

export function cursorrTemplate(_ctx: TemplateContext): string {
  return `This project uses Lytos — a human-first method for working with AI agents.

First session (setup): if the manifest is empty, read @.lytos/LYTOS.md to understand the method.

Every session, read in order:
1. @.lytos/manifest.md — the project constitution
2. @.lytos/memory/MEMORY.md — the memory summary (then relevant cortex/ sections)
3. @.lytos/rules/default-rules.md — quality criteria

To work on a task:
4. @.lytos/issue-board/BOARD.md — board state
5. @.lytos/skills/session-start.md — start and end-of-task procedure

Rules:
- The YAML frontmatter of issues is the source of truth
- Don't interpret silently — ask if an instruction is ambiguous
- At end of task: update frontmatter, move the file, update BOARD.md
- Check the issue's complexity field + the manifest table for the model to use

Documentation: ${REPO_URL}
`;
}
