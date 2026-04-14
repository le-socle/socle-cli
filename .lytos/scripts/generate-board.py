#!/usr/bin/env python3
"""
Génère le BOARD.md à partir des frontmatter YAML des issues.

Usage :
    python .lytos/scripts/generate-board.py
    python .lytos/scripts/generate-board.py --board-dir .lytos/issue-board

Le script lit tous les fichiers .md dans les sous-dossiers de l'issue-board,
extrait le frontmatter YAML, et régénère le BOARD.md.

Pas de dépendance externe — uniquement la bibliothèque standard Python.
"""

import os
import re
import sys
from datetime import date
from pathlib import Path


def parse_frontmatter(filepath):
    """Extrait le frontmatter YAML d'un fichier markdown.

    Retourne un dict avec les champs du frontmatter, ou None si pas de frontmatter.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None

    frontmatter = {}
    for line in match.group(1).strip().split("\n"):
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Traiter les listes YAML simples [item1, item2]
        if value.startswith("[") and value.endswith("]"):
            value = [v.strip().strip('"').strip("'") for v in value[1:-1].split(",") if v.strip()]
        frontmatter[key] = value

    frontmatter["_filepath"] = str(filepath)
    return frontmatter


def find_issues(board_dir):
    """Find all issues in status subdirectories. Uses frontmatter status as source of truth."""
    issues = []
    status_dirs = ["0-icebox", "1-backlog", "2-sprint", "3-in-progress", "4-review", "5-done"]

    for status_dir in status_dirs:
        dir_path = board_dir / status_dir
        if not dir_path.exists():
            continue
        for filepath in sorted(dir_path.glob("ISS-*.md")):
            fm = parse_frontmatter(filepath)
            if fm:
                fm["_folder"] = status_dir
                fm["_filename"] = filepath.name
                # Frontmatter status is the source of truth
                fm_status = fm.get("status", "")
                if fm_status and fm_status != status_dir:
                    print(f"  Warning: {filepath.name} is in {status_dir}/ but frontmatter says status: {fm_status}")
                fm["_status_dir"] = fm_status if fm_status else status_dir
                issues.append(fm)

    return issues


def generate_board(issues, board_dir):
    """Génère le contenu du BOARD.md."""
    # Compter le prochain numéro
    max_num = 0
    for issue in issues:
        issue_id = issue.get("id", "")
        match = re.search(r"ISS-(\d+)", issue_id)
        if match:
            max_num = max(max_num, int(match.group(1)))
    next_num = f"ISS-{max_num + 1:04d}"

    today = date.today().isoformat()

    lines = []
    lines.append("# Issue Board")
    lines.append("")
    lines.append("> Ce fichier est généré automatiquement par `scripts/generate-board.py`.")
    lines.append("> La source de vérité est le frontmatter YAML de chaque issue.")
    lines.append(">")
    lines.append(f"> **Dernière génération** : {today}")
    lines.append(f"> **Prochain numéro** : {next_num}")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Colonnes
    status_config = [
        ("0-icebox", "idées"),
        ("1-backlog", "priorisé"),
        ("2-sprint", "engagé"),
        ("3-in-progress", "en dev"),
        ("4-review", "review/test"),
        ("5-done", "terminé"),
    ]

    lines.append("## Index des issues")
    lines.append("")

    for status_dir, label in status_config:
        lines.append(f"### {status_dir} ({label})")
        lines.append("")

        status_issues = [i for i in issues if i["_status_dir"] == status_dir]

        if not status_issues:
            lines.append("_Aucune issue._")
            lines.append("")
            continue

        if status_dir == "5-done":
            lines.append("| # | Titre | Terminé |")
            lines.append("|---|-------|---------|")
            for issue in status_issues:
                issue_id = issue.get("id", "?")
                title = issue.get("title", "?")
                updated = issue.get("updated", "?")
                rel_path = f"{status_dir}/{issue['_filename']}"
                lines.append(f"| [{issue_id}]({rel_path}) | {title} | {updated} |")
        else:
            has_depends = any(issue.get("depends") for issue in status_issues)
            if has_depends:
                lines.append("| # | Titre | Priorité | Effort | Depends |")
                lines.append("|---|-------|----------|--------|---------|")
            else:
                lines.append("| # | Titre | Priorité | Effort |")
                lines.append("|---|-------|----------|--------|")

            for issue in status_issues:
                issue_id = issue.get("id", "?")
                title = issue.get("title", "?")
                priority = issue.get("priority", "?")
                effort = issue.get("effort", "?")
                depends = issue.get("depends", [])
                rel_path = f"{status_dir}/{issue['_filename']}"

                if has_depends:
                    depends_str = ", ".join(depends) if isinstance(depends, list) and depends else "—"
                    lines.append(f"| [{issue_id}]({rel_path}) | {title} | {priority} | {effort} | {depends_str} |")
                else:
                    lines.append(f"| [{issue_id}]({rel_path}) | {title} | {priority} | {effort} |")

        lines.append("")

    # Footer
    lines.append("---")
    lines.append("")
    lines.append("*Généré par `scripts/generate-board.py` — ne pas modifier à la main.*")
    lines.append("*La source de vérité est le frontmatter YAML de chaque issue.*")
    lines.append("")

    return "\n".join(lines)


def main():
    # Trouver le répertoire de l'issue-board
    if "--board-dir" in sys.argv:
        idx = sys.argv.index("--board-dir")
        board_dir = Path(sys.argv[idx + 1])
    else:
        # Chercher dans .lytos/issue-board/ ou issue-board/
        cwd = Path.cwd()
        candidates = [
            cwd / ".lytos" / "issue-board",
            cwd / "issue-board",
        ]
        board_dir = None
        for c in candidates:
            if c.exists():
                board_dir = c
                break
        if board_dir is None:
            print("Erreur : aucun dossier issue-board/ trouvé.")
            print("Utilisez --board-dir pour spécifier le chemin.")
            sys.exit(1)

    issues = find_issues(board_dir)
    content = generate_board(issues, board_dir)

    board_path = board_dir / "BOARD.md"
    with open(board_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"BOARD.md généré : {board_path}")
    print(f"  {len(issues)} issues trouvées")


if __name__ == "__main__":
    main()
