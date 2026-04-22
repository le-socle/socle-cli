# Lytos CLI

[![npm](https://img.shields.io/npm/v/lytos-cli)](https://www.npmjs.com/package/lytos-cli)
[![CI](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/getlytos/lytos-cli/actions/workflows/ci.yml)

> L'outil en ligne de commande de [Lytos](https://lytos.org/fr/) — une méthode human-first pour travailler avec des agents IA de code.

**[Documentation — lytos.org](https://lytos.org/fr/)** · **[La méthode](https://github.com/getlytos/lytos-method)** · **[Read in English](../../README.md)**

---

## Vous développez avec l'IA ?

Vous changez de modèle. Vous ouvrez une nouvelle session. Vous passez de Claude à Codex.
Et chaque fois, le même rituel : il faut redonner le contexte, répéter les conventions, corriger les mêmes dérives.

Pendant ce temps, la dette s'installe. Le code généré aujourd'hui ne ressemble plus à celui d'hier. Les conventions glissent. Le projet grossit plus vite que la capacité de l'IA à s'y repérer.

Cette friction, beaucoup ont fini par l'accepter comme normale. Elle ne l'est pas.

**Lytos répond à ce problème en ancrant le contexte à l'endroit où il doit vivre : dans le repo.**

---

## Pour qui, pour quoi

| Profil | Setup typique | Ce que Lytos apporte |
|---|---|---|
| **Vibe-coder / maker** | Claude Code, Codex, apps IA + GitHub | Un manifest que l'IA lit à chaque session. Moins de réexplication, un contexte qui s'enrichit. |
| **Développeur** | IDE + Git (GitHub / GitLab) + IA en appoint | Règles versionnées, mémoire qui se construit, board qui trace le travail — dans le repo, pas dans un SaaS. |
| **Équipe** | IDE + Git + CI + revues + ticketing produit | Manifest, skills, rules partagés. L'IA produit dans le style du projet. Les specs techniques pour l'IA vivent dans le repo, à côté du code. |

---

## Installation

```bash
npm install -g lytos-cli
lyt init
```

Ou sans installer :

```bash
npx lytos-cli init
```

En 2 minutes, votre dépôt a son manifest, ses rules, son board. À partir de là, l'IA connaît votre projet.

![Démo Lytos](../screenshots/lytos.gif)

![lyt board](../screenshots/lyt-board.png)

---

## Commandes

| Commande | Ce qu'elle fait |
|----------|-----------------|
| `lyt init` | Génère `.lytos/` dans un projet (interactif, détecte la stack) |
| `lyt board` | Régénère BOARD.md depuis le frontmatter YAML des issues |
| `lyt lint` | Valide la structure et le contenu de `.lytos/` |
| `lyt doctor` | Diagnostic complet — liens cassés, mémoire obsolète, skills manquants, score de santé |
| `lyt show [ISS-XXXX]` | Affiche le détail d'une issue avec sa progression, ou toutes les issues en cours |
| `lyt start ISS-XXXX` | Démarre une issue — déplace en in-progress, crée la branche, met à jour le board |
| `lyt close ISS-XXXX` | Ferme une issue — déplace en done, alerte sur les items non cochés |
| `lyt close` | Ferme en lot toutes les issues de 4-review/ → 5-done/ (demande confirmation ; `--yes` saute le prompt ; `--dry-run` previewe) |
| `lyt review [ISS-XXXX]` | Audit cross-model pour les issues en `4-review/` — imprime un prompt autonome ou ingère un bloc audit retourné (`--accept`). À lancer depuis une **session IA fraîche**, idéalement un vendor différent de l'implémenteur. |
| `lyt update` | Met à jour lytos-cli vers la dernière version |

![lyt show](../screenshots/lyt-show.png)

---

## Ce que `lyt init` génère

```
project/
└── .lytos/
    ├── manifest.md              # Intent — identité du projet et contraintes
    ├── LYTOS.md                 # Référence de la méthode
    ├── config.yml               # Préférences langue et profil
    ├── skills/                  # Design — protocole Lytos + task skills agentskills.io
    │   ├── session-start.md     # Protocole de bootstrap Lytos (flat)
    │   ├── code-structure/SKILL.md
    │   ├── code-review/SKILL.md
    │   ├── testing/SKILL.md
    │   ├── documentation/SKILL.md
    │   ├── git-workflow/SKILL.md
    │   ├── deployment/SKILL.md
    │   ├── security/SKILL.md
    │   └── api-design/SKILL.md  # 8 task skills (format agentskills.io)
    ├── rules/                   # Standards — critères de qualité
    │   └── default-rules.md
    ├── issue-board/             # Progress — kanban
    │   ├── BOARD.md
    │   ├── 0-icebox/
    │   ├── 1-backlog/
    │   ├── 2-sprint/
    │   ├── 3-in-progress/
    │   ├── 4-review/
    │   └── 5-done/
    ├── memory/                  # Memory — connaissance accumulée
    │   ├── MEMORY.md
    │   └── cortex/
    └── templates/               # Templates d'issue et de sprint
```

`lyt init` détecte aussi la stack du projet (langage, framework, runner de tests, package manager) et pré-remplit le manifest. Il génère le fichier d'adaptateur approprié pour l'outil IA choisi — `CLAUDE.md`, `.cursor/rules/lytos.mdc`, `AGENTS.md`, `.github/copilot-instructions.md`, `GEMINI.md`, ou `.windsurfrules`.

Un hook pre-commit est installé pour faire respecter les conventions de nommage de branches (`type/ISS-XXXX-slug`). Cela évite tout travail non tracé sur `main` — quel que soit l'outil IA ou le modèle utilisé.

---

## Fonctionne avec n'importe quel outil IA

| Outil | Ce que `lyt init` génère |
|-------|--------------------------|
| **Claude Code** | `CLAUDE.md` à la racine du projet |
| **Cursor** | `.cursor/rules/lytos.mdc` (règle Cursor moderne avec front-matter YAML) |
| **Codex (OpenAI)** | `AGENTS.md` à la racine |
| **GitHub Copilot** | `.github/copilot-instructions.md` |
| **Gemini CLI** | `GEMINI.md` à la racine |
| **Windsurf** | `.windsurfrules` à la racine |
| **Autres** | Le dossier `.lytos/` est en Markdown brut — n'importe quel LLM peut le lire |

> *"Choisissez votre IA. Ne lui appartenez pas."*

---

## Principes de design

- **Offline-first** — `lyt lint`, `lyt doctor`, `lyt board`, `lyt show`, `lyt start`, `lyt close` ne demandent jamais de réseau
- **Zéro lock-in** — fichiers Markdown bruts, portables vers n'importe quel outil IA
- **Pas de télémétrie** — aucun tracking, aucune analytics, jamais. Opt-out pour le check de mise à jour : `LYT_NO_UPDATE_CHECK=1`
- **Human-first** — l'humain définit la méthode, l'IA la suit
- **Fail with context** — quand quelque chose ne va pas, le CLI dit quoi, où, et comment corriger

![lyt lint](../screenshots/lyt-lint.png)
![lyt doctor](../screenshots/lyt-doctor.png)

---

## Construit avec Lytos

Ce CLI est développé en utilisant Lytos lui-même. Le dossier `.lytos/` de ce dépôt contient le vrai manifest, le sprint, les issues et la mémoire — pas des templates. Chaque feature a été trackée comme une issue, démarrée avec `lyt start`, et fermée avec `lyt close`.

[Voir le board →](../../.lytos/issue-board/BOARD.md)

---

## Liens

- **Documentation** — [lytos.org](https://lytos.org/fr/)
- **Tutoriel** — [lytos-learn](https://github.com/getlytos/lytos-learn) — apprendre en faisant en 7 étapes
- **La méthode** — [github.com/getlytos/lytos-method](https://github.com/getlytos/lytos-method)
- **npm** — [npmjs.com/package/lytos-cli](https://www.npmjs.com/package/lytos-cli)

---

## Auteur

Créé par **Frédéric Galliné**

- GitHub : [@FredericGalline](https://github.com/FredericGalline)
- X : [@fred](https://x.com/fred)

---

## Licence

MIT — voir [LICENSE](../../LICENSE)

---

## Historique des étoiles

[![Star History Chart](https://api.star-history.com/svg?repos=getlytos/lytos-cli,getlytos/lytos-method&type=Date)](https://www.star-history.com/#getlytos/lytos-cli&getlytos/lytos-method&Date)
