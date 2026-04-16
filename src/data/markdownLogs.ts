import { isValid, parseISO } from "date-fns";
import { marked } from "marked";
import type { DailyLog, Section } from "../types";

interface FrontMatter {
  date?: string;
  title?: string;
  tags?: string;
}

const markdownModules = import.meta.glob("../content/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function parseFrontMatter(source: string): { frontMatter: FrontMatter; body: string } {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontMatter: {}, body: source };
  }

  const frontMatter: FrontMatter = {};
  const lines = match[1].split(/\r?\n/);

  for (const line of lines) {
    const parsed = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!parsed) continue;

    const [, key, value] = parsed;
    frontMatter[key as keyof FrontMatter] = value.trim();
  }

  return {
    frontMatter,
    body: source.slice(match[0].length),
  };
}

function parseTags(rawTags?: string): string[] {
  if (!rawTags) return [];

  return rawTags
    .replace(/^\[|\]$/g, "")
    .split(/[;,，；]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function clampDepthToLevel(depth: number): 1 | 2 | 3 | null {
  if (depth === 2) return 1;
  if (depth === 3) return 2;
  if (depth === 4) return 3;
  return null;
}

function ensureSectionContent(section: Section) {
  if (section.content.length === 0) {
    section.content.push("（待补充）");
  }
}

function parseSections(markdownBody: string): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  const tokens = marked.lexer(markdownBody);

  const flushCurrentSection = () => {
    if (!currentSection) return;
    ensureSectionContent(currentSection);
    sections.push(currentSection);
    currentSection = null;
  };

  for (const token of tokens) {
    if (token.type === "heading") {
      const level = clampDepthToLevel(token.depth);
      if (!level) continue;

      flushCurrentSection();
      currentSection = {
        level,
        heading: token.text.trim(),
        content: [],
      };
      continue;
    }

    if (!currentSection) continue;

    if (token.type === "paragraph") {
      const paragraph = token.text.trim();
      if (paragraph) {
        currentSection.content.push(paragraph);
      }
      continue;
    }

    if (token.type === "list") {
      const bulletText = token.items
        .map((item: { text: string }) => `- ${item.text.trim()}`)
        .filter((line: string) => line !== "-")
        .join("\n");

      if (bulletText) {
        currentSection.content.push(bulletText);
      }
    }
  }

  flushCurrentSection();
  return sections;
}

function parseSingleMarkdownDocument(raw: string): DailyLog | null {
  const { frontMatter, body } = parseFrontMatter(raw);
  if (!frontMatter.date) return null;

  const date = frontMatter.date.trim();
  if (!isValid(parseISO(date))) return null;

  const sections = parseSections(body);
  if (sections.length === 0) return null;

  return {
    date,
    title: frontMatter.title?.trim() || `日志 ${date}`,
    tags: parseTags(frontMatter.tags),
    sections,
  };
}

export const markdownLogs: DailyLog[] = Object.values(markdownModules)
  .map(parseSingleMarkdownDocument)
  .filter((entry): entry is DailyLog => entry !== null)
  .sort((a, b) => a.date.localeCompare(b.date));

export const allLogs: DailyLog[] = markdownLogs;
