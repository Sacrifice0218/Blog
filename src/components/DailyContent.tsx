import type { DailyLog, Section } from "../types";

interface DailyContentProps {
  logs: DailyLog[];
  selectedDate: string;
  emptyMessage?: string;
}

function renderHeading(section: Section) {
  if (section.level === 1) {
    return <h2 className="text-2xl font-bold text-slate-900">{section.heading}</h2>;
  }

  if (section.level === 2) {
    return <h3 className="text-xl font-semibold text-slate-800">{section.heading}</h3>;
  }

  return <h4 className="text-lg font-semibold text-slate-700">{section.heading}</h4>;
}

function DailyContent({ logs, selectedDate, emptyMessage }: DailyContentProps) {
  if (logs.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        {emptyMessage ?? "当前筛选条件下暂无日志内容。"}
      </section>
    );
  }

  return (
    <article className="space-y-6">
      {logs.map((log) => {
        const isSelected = selectedDate === log.date;

        return (
          <section
            key={log.date}
            id={`day-${log.date}`}
            className={[
              "scroll-mt-12 rounded-2xl border bg-white p-6 shadow-sm transition",
              isSelected ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200",
            ].join(" ")}
          >
            <header className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{log.date}</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">{log.title ?? log.date}</h2>
              {log.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {log.tags.map((tag) => (
                    <span
                      key={`${log.date}-${tag}`}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </header>

            <div className="space-y-5">
              {log.sections.map((section, index) => (
                <div key={`${log.date}-${section.level}-${index}`} className="space-y-2">
                  {renderHeading(section)}
                  {section.content.map((paragraph, paragraphIndex) => (
                    <p
                      key={`${log.date}-${index}-${paragraphIndex}`}
                      className="whitespace-pre-line leading-7 text-slate-700"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </article>
  );
}

export default DailyContent;

