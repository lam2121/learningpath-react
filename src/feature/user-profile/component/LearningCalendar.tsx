import { Badge } from "@/shadcn/component/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { CalendarDays, Clock3, Flame } from "lucide-react";

type StudyActivity = {
    date: string;
    minutes: number;
    lessons: number;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function buildMockStudyActivities(today: Date): StudyActivity[] {
    const year = today.getFullYear();
    const month = today.getMonth();

    const entries = [
        { day: 1, minutes: 45, lessons: 1 },
        { day: 2, minutes: 70, lessons: 2 },
        { day: 3, minutes: 0, lessons: 0 },
        { day: 4, minutes: 95, lessons: 2 },
        { day: 5, minutes: 60, lessons: 1 },
        { day: 6, minutes: 35, lessons: 1 },
    ];

    return entries
        .filter((entry) => entry.day <= today.getDate())
        .map((entry) => ({
            date: formatDateKey(new Date(year, month, entry.day)),
            minutes: entry.minutes,
            lessons: entry.lessons,
        }));
}

function getIntensity(minutes: number) {
    if (minutes >= 90) return "high";
    if (minutes >= 60) return "medium";
    if (minutes > 0) return "low";
    return "none";
}

export function LearningCalendar({ embedded = false }: { embedded?: boolean }) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentMonthLabel = today.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
    });
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const leadingEmptyDays = (firstDayOfMonth.getDay() + 6) % 7;
    const dayCells = [
        ...Array.from({ length: leadingEmptyDays }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    const studyActivities = buildMockStudyActivities(today);
    const activityByDate = new Map(
        studyActivities.map((activity) => [activity.date, activity]),
    );
    const activeDays = studyActivities.filter((activity) => activity.minutes > 0).length;
    const totalMinutes = studyActivities.reduce((sum, activity) => sum + activity.minutes, 0);
    const totalLessons = studyActivities.reduce((sum, activity) => sum + activity.lessons, 0);
    const longestStreak = studyActivities.reduce(
        (state, activity) => {
            if (activity.minutes > 0) {
                const nextCurrent = state.current + 1;
                return {
                    current: nextCurrent,
                    best: Math.max(state.best, nextCurrent),
                };
            }

            return {
                current: 0,
                best: state.best,
            };
        },
        { current: 0, best: 0 },
    ).best;
    const bestDay = studyActivities.reduce<StudyActivity | null>((best, activity) => {
        if (activity.minutes === 0) return best;
        if (!best || activity.minutes > best.minutes) return activity;
        return best;
    }, null);

    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-700">
                        <CalendarDays className="h-4 w-4" />
                        <p className="text-sm font-semibold">Activity Calendar</p>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900">
                        Study rhythm
                    </CardTitle>
                </div>

                <Badge variant="secondary" className="rounded-full px-3 py-1 text-slate-700">
                    {currentMonthLabel}
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                        Active
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{activeDays}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-3">
                    <div className="flex items-center gap-1 text-orange-600">
                        <Flame className="h-3.5 w-3.5" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                            Streak
                        </p>
                    </div>
                    <p className="mt-1 text-lg font-bold text-slate-900">{longestStreak}</p>
                </div>
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-3">
                    <div className="flex items-center gap-1 text-cyan-700">
                        <Clock3 className="h-3.5 w-3.5" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                            Hours
                        </p>
                    </div>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                        {(totalMinutes / 60).toFixed(1)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {weekdayLabels.map((label) => (
                    <div key={label}>{label}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
                {dayCells.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="h-9 rounded-xl" />;
                    }

                    const cellDate = new Date(currentYear, currentMonth, day);
                    const dateKey = formatDateKey(cellDate);
                    const activity = activityByDate.get(dateKey);
                    const intensity = getIntensity(activity?.minutes ?? 0);
                    const isToday = day === today.getDate();

                    const intensityClassName = {
                        none: "border-slate-200 bg-slate-50 text-slate-400",
                        low: "border-blue-100 bg-blue-100 text-blue-700",
                        medium: "border-blue-200 bg-blue-300 text-blue-900",
                        high: "border-blue-500 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]",
                    }[intensity];

                    return (
                        <div
                            key={dateKey}
                            title={
                                activity && activity.minutes > 0
                                    ? `${day}: ${activity.minutes} min, ${activity.lessons} lesson${activity.lessons > 1 ? "s" : ""}`
                                    : `${day}: no study activity`
                            }
                            className={[
                                "relative flex h-9 items-center justify-center rounded-xl border text-xs font-semibold transition",
                                intensityClassName,
                                isToday ? "ring-2 ring-slate-900/15 ring-offset-1" : "",
                            ].join(" ")}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <span>Less</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-100" />
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                    <span>More</span>
                </div>
                <p>{totalLessons} lessons finished this month</p>
            </div>

            {bestDay && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Best Day
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                        {parseDateKey(bestDay.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })} · {bestDay.minutes} min · {bestDay.lessons} lessons
                    </p>
                </div>
            )}
        </>
    );

    if (embedded) {
        return <div className="space-y-4">{content}</div>;
    }

    return (
        <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="space-y-4 pb-4">
                {content}
            </CardHeader>
            <CardContent className="hidden" />
        </Card>
    );
}
