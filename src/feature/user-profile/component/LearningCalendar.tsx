import { Badge } from "@/shadcn/component/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";
import { CalendarDays, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getLoginDays } from "@/feature/user-profile/utils/StudyActivity";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

export function calculateLongestStreak(dateKeys: string[]) {
    const uniqueDates = [...new Set(dateKeys)].sort();
    let longestStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;

    uniqueDates.forEach((dateKey) => {
        const [year, month, day] = dateKey.split("-").map(Number);
        const currentDate = new Date(year, month - 1, day);

        if (previousDate) {
            const expectedDate = new Date(previousDate);
            expectedDate.setDate(expectedDate.getDate() + 1);

            currentStreak =
                formatDateKey(expectedDate) === dateKey ? currentStreak + 1 : 1;
        } else {
            currentStreak = 1;
        }

        longestStreak = Math.max(longestStreak, currentStreak);
        previousDate = currentDate;
    });

    return longestStreak;
}

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
    const activeDays = loginDays.filter((dateKey) =>
        dateKey.startsWith(monthPrefix),
    ).length;
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
                </div>

                <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-slate-700"
                >
                    {currentMonthLabel}
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
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
                    <p className="mt-1 text-lg font-bold text-slate-900">
                        {longestStreak}
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
                    const loggedIn = loginDaySet.has(dateKey);
                    const isToday = day === today.getDate();

                    const dayClassName = loggedIn
                        ? "border-blue-400 bg-blue-400 text-white shadow-[0_8px_20px_rgba(37,99,235,0.24)]"
                        : "border-slate-200 bg-slate-50 text-slate-400";

                    return (
                        <div
                            key={dateKey}
                            title={loggedIn ? `${day}: logged in` : `${day}: no login`}
                            className={[
                                "relative flex h-9 items-center justify-center rounded-xl border text-xs font-semibold transition",
                                dayClassName,
                                isToday ? "ring-2 ring-slate-900/15 ring-offset-1" : "",
                            ].join(" ")}
                        >
                            {day}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                    <span>No login</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    <span>Logged in</span>
                </div>
            </div>
        </>
    );

    if (embedded) {
        return <div className="space-y-4">{content}</div>;
    }

    return (
        <Card className="overflow-hidden border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="space-y-4 pb-4">{content}</CardHeader>
            <CardContent className="hidden" />
        </Card>
    );
}