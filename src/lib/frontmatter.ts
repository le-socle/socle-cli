/**
 * Simple YAML frontmatter parser.
 *
 * Only handles the subset of YAML used in Le Socle issues:
 * strings, simple lists ([a, b]), and dates. No nested objects,
 * no multi-line values, no anchors. This keeps us dependency-free.
 */

export interface Frontmatter {
  [key: string]: string | string[];
}

export function parseFrontmatter(content: string): Frontmatter | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter: Frontmatter = {};

  for (const line of match[1].trim().split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove surrounding quotes
    value = value.replace(/^["']|["']$/g, "");

    // Parse simple YAML lists: [item1, item2]
    if (value.startsWith("[") && value.endsWith("]")) {
      const items = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^["']|["']$/g, ""))
        .filter((v) => v.length > 0);
      frontmatter[key] = items;
    } else {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

export function serializeFrontmatter(data: Frontmatter): string {
  const lines = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}: [${value.join(", ")}]`);
      }
    } else {
      // Quote strings that contain special characters
      const needsQuotes = value.includes(":") || value.includes("#");
      lines.push(`${key}: ${needsQuotes ? `"${value}"` : value}`);
    }
  }

  lines.push("---");
  return lines.join("\n");
}
