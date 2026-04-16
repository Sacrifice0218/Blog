import { endOfMonth, format, getDate, getDay, isToday, parseISO } from "date-fns";

interface CalendarProps {
  year: number;
  month: number;
  selectedDate: string;
  activeDates: Set<string>;
  onDateClick: (date: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const WEEK_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function Calendar({
  year,
  month,
  selectedDate,
  activeDates,
  onDateClick,
  onPreviousMonth,
  onNextMonth,
}: CalendarProps) {
  const monthStart = new Date(year, month - 1, 1);
  const daysInMonth = getDate(endOfMonth(monthStart));
  const weekStartOffset = (getDay(monthStart) + 6) % 7;

  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - weekStartOffset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return format(new Date(year, month - 1, day), "yyyy-MM-dd");
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPreviousMonth}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label="切换到上个月"
        >
          {"<"}
        </button>
        <h2 className="text-center text-lg font-semibold text-slate-800">
          {format(monthStart, "yyyy-MM")}
        </h2>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label="切换到下个月"
        >
          {">"}
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {WEEK_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`blank-${index}`}
                className="h-11 rounded-lg border border-transparent"
                aria-hidden="true"
              />
            );
          }

          const dayNumber = getDate(parseISO(date));
          const selected = selectedDate === date;
          const hasLog = activeDates.has(date);
          const today = isToday(parseISO(date));

          const className = [
            "relative h-11 rounded-lg border text-sm font-medium transition",
            "hover:border-blue-300 hover:bg-blue-50",
            selected
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-700",
            today && !selected ? "ring-1 ring-emerald-400" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={date}
              type="button"
              className={className}
              onClick={() => onDateClick(date)}
              aria-current={selected ? "date" : undefined}
              title={hasLog ? "含日志记录" : "暂无日志记录"}
            >
              <span>{dayNumber}</span>
              {hasLog && !selected ? (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;

