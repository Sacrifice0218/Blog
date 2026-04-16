import type { DailyLog, Section } from "../types";

const STORAGE_KEY = "blog-demo:user-logs:v1";

function isValidLevel(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isValidSection(value: unknown): value is Section {
  if (!value || typeof value !== "object") return false;
  const section = value as Section;

  return (
    isValidLevel(section.level) &&
    typeof section.heading === "string" &&
    Array.isArray(section.content) &&
    section.content.every((item) => typeof item === "string")
  );
}

function isValidDailyLog(value: unknown): value is DailyLog {
  if (!value || typeof value !== "object") return false;
  const log = value as DailyLog;

  return (
    typeof log.date === "string" &&
    (typeof log.title === "string" || typeof log.title === "undefined") &&
    Array.isArray(log.tags) &&
    log.tags.every((tag) => typeof tag === "string") &&
    Array.isArray(log.sections) &&
    log.sections.every(isValidSection)
  );
}

export function loadUserLogs(): DailyLog[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidDailyLog).sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

export function saveUserLogs(logs: DailyLog[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

