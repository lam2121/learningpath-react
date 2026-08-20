import { Badge } from "@/shadcn/component/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";
import { CalendarDays, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
    calculateLongestStreak,
    getLoginDays,
} from "@/feature/user-profile/utils/StudyActivity";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

type LearningCalendarProps = {
    embedded?: boolean;
    userId: number;
};

export function LearningCalendar({
    embedded = false,
    userId,
}: LearningCalendarProps) {
    const [loginDays, setLoginDays] = useState<string[]>([]);

    useEffect(() => {
        setLoginDays(getLoginDays(userId));
    }, [userId]);

    const loginDaySet = useMemo(() => new Set(loginDays), [loginDays]);
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
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-`;
    const activeDays = loginDays.filter((dateKey) => dateKey.startsWith(monthPrefix)).length;
    const longestStreak = calculateLongestStreak(loginDays);

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
                    <p className="text-sm text-slate-500">
                        Keep small daily wins visible and let your streak build naturally.
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <Badge
                        variant="secondary"
                        className="rounded-full px-3 py-1 text-slate-700"
                    >
                        {currentMonthLabel}
                    </Badge>
                    <div className="flex flex-wrap justify-end gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            Active {activeDays}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            <Flame className="h-3.5 w-3.5" />
                            Streak {longestStreak}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {WEEKDAY_LABELS.map((label) => (
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
                    const loggedIn = loginDaySet.has(dateKey);
                    const isToday = day === today.getDate();

                    return (
                        <div
                            key={dateKey}
                            title={
                                isToday
                                    ? loggedIn
                                        ? `${day}: today with learning activity`
                                        : `${day}: today`
                                    : loggedIn
                                        ? `${day}: logged in`
                                        : `${day}: no login`
                            }
                            className={[
                                "relative flex h-9 items-center justify-center rounded-xl border text-sm font-semibold transition",
                                isToday && loggedIn
                                    ? "border-amber-300 bg-[linear-gradient(135deg,#fef3c7_0%,#f59e0b_100%)] text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.28)] ring-2 ring-amber-200 ring-offset-1"
                                    : isToday
                                        ? "border-amber-300 bg-amber-50 text-amber-700 shadow-[0_8px_18px_rgba(245,158,11,0.16)] ring-2 ring-amber-200 ring-offset-1"
                                        : loggedIn
                                    ? "border-blue-500 bg-blue-500 text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)]"
                                    : "border-slate-200 bg-slate-50 text-slate-400",
                            ].join(" ")}
                        >
                            {day}
                            {isToday ? (
                                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white/90" />
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span>No activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <span>Learning activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span>Today</span>
                </div>
            </div>
        </>
    );

    if (embedded) {
        return <div className="space-y-4">{content}</div>;
    }

    return (
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="space-y-4 pb-4">{content}</CardHeader>
            <CardContent className="hidden" />
        </Card>
    );
}
