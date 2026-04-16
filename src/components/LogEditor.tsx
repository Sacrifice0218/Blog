import { useEffect, useMemo, useState } from "react";
import type { DailyLog } from "../types";

interface DraftSection {
  id: string;
  level: 1 | 2 | 3;
  heading: string;
  content: string;
}

interface LogEditorProps {
  selectedDate: string;
  existingLog?: DailyLog;
  customLogDates: Set<string>;
  onSave: (log: DailyLog) => void;
  onDeleteCustomLog: (date: string) => boolean;
}

function createDraftSection(partial?: Partial<DraftSection>): DraftSection {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    level: partial?.level ?? 1,
    heading: partial?.heading ?? "",
    content: partial?.content ?? "",
  };
}

function createDraftFromLog(log: DailyLog): {
  date: string;
  title: string;
  tags: string;
  sections: DraftSection[];
} {
  return {
    date: log.date,
    title: log.title ?? "",
    tags: log.tags.join(", "),
    sections: log.sections.map((section) =>
      createDraftSection({
        level: section.level,
        heading: section.heading,
        content: section.content.join("\n\n"),
      }),
    ),
  };
}

function createEmptyDraft(date: string) {
  return {
    date,
    title: "",
    tags: "",
    sections: [createDraftSection()],
  };
}

function parseTags(value: string): string[] {
  return value
    .split(/[;,，；]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function LogEditor({
  selectedDate,
  existingLog,
  customLogDates,
  onSave,
  onDeleteCustomLog,
}: LogEditorProps) {
  const [draft, setDraft] = useState(() => createEmptyDraft(selectedDate));
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!savedMessage) return;
    const timer = window.setTimeout(() => setSavedMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const canLoadCurrent = useMemo(() => Boolean(existingLog), [existingLog]);
  const hasCustomLogForDraftDate = useMemo(
    () => customLogDates.has(draft.date.trim()),
    [customLogDates, draft.date],
  );

  const handleSectionChange = (
    id: string,
    key: "level" | "heading" | "content",
    value: string,
  ) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== id) return section;

        if (key === "level") {
          return { ...section, level: Number(value) as 1 | 2 | 3 };
        }

        return { ...section, [key]: value };
      }),
    }));
  };

  const handleSave = () => {
    setError(null);
    const date = draft.date.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("日期格式应为 YYYY-MM-DD。");
      return;
    }

    const sections = draft.sections
      .map((section) => ({
        level: section.level,
        heading: section.heading.trim(),
        content: section.content
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean),
      }))
      .filter((section) => section.heading && section.content.length > 0);

    if (sections.length === 0) {
      setError("至少保留一个有效小节（标题和正文都不能为空）。");
      return;
    }

    onSave({
      date,
      title: draft.title.trim() || `日志 ${date}`,
      tags: parseTags(draft.tags),
      sections,
    });

    setSavedMessage("已保存到本地（localStorage）。");
  };

  const handleDeleteCustomLog = () => {
    setError(null);
    const date = draft.date.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("请先输入有效日期再删除。");
      return;
    }

    if (!customLogDates.has(date)) {
      setError("该日期没有自定义日志可删除。");
      return;
    }

    const confirmDelete = window.confirm(
      `确认删除 ${date} 的自定义日志吗？删除后将恢复默认日志（如果该日期有默认内容）。`,
    );
    if (!confirmDelete) return;

    const deleted = onDeleteCustomLog(date);
    if (!deleted) {
      setError("删除失败，请重试。");
      return;
    }

    setDraft(createEmptyDraft(date));
    setSavedMessage("已删除该日期的自定义日志。");
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">前端日志编辑器</h2>
          <p className="text-sm text-slate-500">
            你可以直接新增或覆盖某天日志，支持自定义大标题、小标题和正文。
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canLoadCurrent}
            onClick={() => {
              if (!existingLog) return;
              setDraft(createDraftFromLog(existingLog));
            }}
          >
            载入当前日期
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            onClick={() => setDraft(createEmptyDraft(selectedDate))}
          >
            新建空白
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          日期
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={draft.date}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, date: event.target.value }))
            }
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-2">
          日志标题
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="例如：Day 40 · 认证与授权"
            value={draft.title}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, title: event.target.value }))
            }
          />
        </label>
      </div>

      <label className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
        标签（逗号分隔）
        <input
          type="text"
          className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="spring, jwt, mysql"
          value={draft.tags}
          onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
        />
      </label>

      <div className="mt-4 space-y-3">
        {draft.sections.map((section, index) => (
          <div key={section.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <strong className="text-sm text-slate-700">小节 {index + 1}</strong>
              <button
                type="button"
                className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 transition hover:bg-rose-50"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    sections:
                      prev.sections.length === 1
                        ? prev.sections
                        : prev.sections.filter((item) => item.id !== section.id),
                  }))
                }
              >
                删除
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                标题级别
                <select
                  value={section.level}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => handleSectionChange(section.id, "level", event.target.value)}
                >
                  <option value={1}>一级（h2）</option>
                  <option value={2}>二级（h3）</option>
                  <option value={3}>三级（h4）</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-700 md:col-span-3">
                小节标题
                <input
                  type="text"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="例如：事务传播行为"
                  value={section.heading}
                  onChange={(event) =>
                    handleSectionChange(section.id, "heading", event.target.value)
                  }
                />
              </label>
            </div>

            <label className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
              正文（空行分段）
              <textarea
                rows={4}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="输入正文内容，两个换行会被拆成多个段落。"
                value={section.content}
                onChange={(event) =>
                  handleSectionChange(section.id, "content", event.target.value)
                }
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              sections: [...prev.sections, createDraftSection()],
            }))
          }
        >
          + 添加小节
        </button>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white transition hover:bg-blue-700"
          onClick={handleSave}
        >
          保存日志
        </button>
        <button
          type="button"
          className="rounded-md border border-rose-300 px-3 py-1.5 text-sm text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleDeleteCustomLog}
          disabled={!hasCustomLogForDraftDate}
          title={
            hasCustomLogForDraftDate ? "删除该日期的自定义日志" : "该日期没有自定义日志"
          }
        >
          删除当天自定义日志
        </button>
        {savedMessage ? <span className="text-sm text-emerald-600">{savedMessage}</span> : null}
        {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      </div>
    </section>
  );
}

export default LogEditor;

