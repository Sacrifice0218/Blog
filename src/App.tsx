import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
} from "date-fns";
import { useEffect, useMemo, useState } from "react";
import Calendar from "./components/Calendar";
import DailyContent from "./components/DailyContent";
import Layout from "./components/Layout";
import LogEditor from "./components/LogEditor";
import { allLogs } from "./data/markdownLogs";
import { loadUserLogs, saveUserLogs } from "./data/userLogsStorage";
import type { DailyLog } from "./types";

const DEFAULT_DATE = "2026-04-16";

function containsQuery(log: DailyLog, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;

  const corpus = [
    log.date,
    log.title ?? "",
    ...log.tags,
    ...log.sections.flatMap((section) => [section.heading, ...section.content]),
  ]
    .join(" ")
    .toLowerCase();

  return corpus.includes(normalizedQuery);
}

function mergeLogs(baseLogs: DailyLog[], userLogs: DailyLog[]): DailyLog[] {
  const mergedByDate = new Map<string, DailyLog>();

  for (const log of baseLogs) {
    mergedByDate.set(log.date, log);
  }

  for (const log of userLogs) {
    mergedByDate.set(log.date, log);
  }

  return Array.from(mergedByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function upsertUserLog(existing: DailyLog[], incoming: DailyLog): DailyLog[] {
  const withoutCurrentDate = existing.filter((item) => item.date !== incoming.date);
  return [...withoutCurrentDate, incoming].sort((a, b) => a.date.localeCompare(b.date));
}

function removeUserLog(existing: DailyLog[], date: string): DailyLog[] {
  return existing.filter((item) => item.date !== date);
}

function App() {
  const baseLogs = useMemo(
    () => [...allLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );

  const [userLogs, setUserLogs] = useState<DailyLog[]>([]);
  const [userLogsReady, setUserLogsReady] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    setUserLogs(loadUserLogs());
    setUserLogsReady(true);
  }, []);

  const logs = useMemo(() => mergeLogs(baseLogs, userLogs), [baseLogs, userLogs]);

  const initialDate = useMemo(() => {
    if (logs.some((entry) => entry.date === DEFAULT_DATE)) {
      return DEFAULT_DATE;
    }

    return logs[0]?.date ?? "2026-04-01";
  }, [logs]);

  const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(parseISO(DEFAULT_DATE)));
  const [query, setQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!userLogsReady) return;
    setSelectedDate(initialDate);
    setViewMonth(startOfMonth(parseISO(initialDate)));
  }, [initialDate, userLogsReady]);

  const logsInViewMonth = useMemo(
    () => logs.filter((log) => isSameMonth(parseISO(log.date), viewMonth)),
    [logs, viewMonth],
  );

  const availableTags = useMemo(
    () =>
      [...new Set(logsInViewMonth.flatMap((log) => log.tags))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [logsInViewMonth],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredLogs = useMemo(
    () =>
      logsInViewMonth.filter((log) => {
        if (selectedTag && !log.tags.includes(selectedTag)) {
          return false;
        }

        return containsQuery(log, normalizedQuery);
      }),
    [logsInViewMonth, selectedTag, normalizedQuery],
  );

  const activeDates = useMemo(
    () => new Set(logsInViewMonth.map((log) => log.date)),
    [logsInViewMonth],
  );

  const customLogDates = useMemo(
    () => new Set(userLogs.map((log) => log.date)),
    [userLogs],
  );

  const selectedLog = useMemo(
    () => logs.find((log) => log.date === selectedDate),
    [logs, selectedDate],
  );

  useEffect(() => {
    if (!selectedTag) return;
    if (availableTags.includes(selectedTag)) return;
    setSelectedTag(null);
  }, [availableTags, selectedTag]);

  useEffect(() => {
    const selectedInViewMonth = isSameMonth(parseISO(selectedDate), viewMonth);
    if (selectedInViewMonth) return;

    const fallbackDate = logsInViewMonth[0]?.date ?? format(viewMonth, "yyyy-MM-01");
    setSelectedDate(fallbackDate);
  }, [selectedDate, viewMonth, logsInViewMonth]);

  useEffect(() => {
    if (filteredLogs.length === 0) return;
    if (filteredLogs.some((log) => log.date === selectedDate)) return;
    setSelectedDate(filteredLogs[0].date);
  }, [filteredLogs, selectedDate]);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);

    const element = document.getElementById(`day-${date}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSaveLog = (incoming: DailyLog) => {
    setUserLogs((prev) => {
      const next = upsertUserLog(prev, incoming);
      saveUserLogs(next);
      return next;
    });

    setSelectedDate(incoming.date);
    setViewMonth(startOfMonth(parseISO(incoming.date)));
    setQuery("");
    setSelectedTag(null);

    requestAnimationFrame(() => {
      const element = document.getElementById(`day-${incoming.date}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  const handleDeleteCustomLog = (date: string): boolean => {
    let deleted = false;

    setUserLogs((prev) => {
      if (!prev.some((item) => item.date === date)) {
        return prev;
      }

      deleted = true;
      const next = removeUserLog(prev, date);
      saveUserLogs(next);
      return next;
    });

    if (deleted) {
      setSelectedDate(date);
      setViewMonth(startOfMonth(parseISO(date)));
      setQuery("");
      setSelectedTag(null);

      requestAnimationFrame(() => {
        const element = document.getElementById(`day-${date}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    return deleted;
  };

  return (
    <Layout
      sidebar={
        <Calendar
          year={viewMonth.getFullYear()}
          month={viewMonth.getMonth() + 1}
          selectedDate={selectedDate}
          activeDates={activeDates}
          onDateClick={handleDateClick}
          onPreviousMonth={() => setViewMonth((prev) => addMonths(prev, -1))}
          onNextMonth={() => setViewMonth((prev) => addMonths(prev, 1))}
        />
      }
    >
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {format(viewMonth, "yyyy-MM")} 日志
            </h2>
            <p className="text-sm text-slate-500">
              共 {logsInViewMonth.length} 条，筛选后 {filteredLogs.length} 条
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700"
              onClick={() => setIsEditorOpen(true)}
            >
              编辑日志
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => {
                setQuery("");
                setSelectedTag(null);
              }}
            >
              清空筛选
            </button>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="搜索标题、正文或标签，例如：transaction / jwt / spring"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              selectedTag === null
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            ].join(" ")}
            onClick={() => setSelectedTag(null)}
          >
            全部标签
          </button>

          {availableTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                selectedTag === tag
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              ].join(" ")}
              onClick={() => setSelectedTag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      <DailyContent
        logs={filteredLogs}
        selectedDate={selectedDate}
        emptyMessage="当前月份在所选标签或关键词下没有匹配日志。"
      />

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="text-base font-semibold text-slate-900">日志编辑窗口</h3>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => setIsEditorOpen(false)}
              >
                关闭
              </button>
            </div>

            <div className="max-h-[78vh] overflow-y-auto p-4">
              <LogEditor
                selectedDate={selectedDate}
                existingLog={selectedLog}
                customLogDates={customLogDates}
                onSave={handleSaveLog}
                onDeleteCustomLog={handleDeleteCustomLog}
              />
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}

export default App;

