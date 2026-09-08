import { Badge } from "@/shadcn/component/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";
import { CalendarDays, Flame } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    calculateLongestStreak,
    getLoginDays,
    LOGIN_DAYS_UPDATED_EVENT,
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
    const { t } = useTranslation("profile");
    const [loginDays, setLoginDays] = useState<string[]>([]);
    const [today, setToday] = useState(() => new Date());

    useEffect(() => {
        const syncCalendar = () => {
            setLoginDays(getLoginDays(userId));
            setToday(new Date());
        };

        const handleLoginDaysUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== userId) {
                return;
            }

            syncCalendar();
        };

        syncCalendar();
        window.addEventListener(LOGIN_DAYS_UPDATED_EVENT, handleLoginDaysUpdated);

        return () => {
            window.removeEventListener(
                LOGIN_DAYS_UPDATED_EVENT,
                handleLoginDaysUpdated,
            );
        };
    }, [userId]);

    const loginDaySet = useMemo(() => new Set(loginDays), [loginDays]);
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
    const header = (
        <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-blue-700">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-lg font-semibold">{t("learningCalendar.activityCalendar")}</p>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">
                    {t("learningCalendar.title")}
                </CardTitle>
                <p className="text-ls text-slate-500">
                    {t("learningCalendar.subtitle")}
                </p>
            </div>

            <div className="flex flex-col items-end gap-2">
                <Badge
                    variant="secondary"
                    className="rounded-full px-3 py-1 text-slate-700 text-sm"
                >
                    {currentMonthLabel}
                </Badge>
                <div className="flex flex-wrap justify-end gap-2">
                    <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                        {t("learningCalendar.activeDays", { count: activeDays })}
                    </span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                        <Flame className="h-3.5 w-3.5" />
                        {t("learningCalendar.streak", { count: longestStreak })}
                    </span>
                </div>
            </div>
        </div>
    );

    const weekdayHeader = (
        <div className="grid grid-cols-7 gap-1.5 text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {WEEKDAY_LABELS.map((label) => (
                <div key={label}>{label}</div>
            ))}
        </div>
    );

    const calendarGrid = (
        <div className={`grid grid-cols-7 gap-1.5 ${embedded ? "flex-1 auto-rows-fr" : ""}`}>
            {dayCells.map((day, index) => {
                if (day === null) {
                    return (
                        <div
                            key={`empty-${index}`}
                            className={embedded ? "min-h-[2.75rem] rounded-xl" : "h-9 rounded-xl"}
                        />
                    );
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
                                    ? t("learningCalendar.tooltipTodayWithActivity", { day })
                                    : t("learningCalendar.tooltipToday", { day })
                                : loggedIn
                                    ? t("learningCalendar.tooltipLoggedIn", { day })
                                    : t("learningCalendar.tooltipNoLogin", { day })
                        }
                        className={[
                            `relative flex items-center justify-center rounded-xl border text-sm font-semibold transition ${embedded ? "min-h-[2.75rem] h-full" : "h-9"}`,
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
    );

    const legend = (
        <div className="flex flex-wrap items-center gap-4 text-[16px] text-slate-500">
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span>{t("learningCalendar.noActivity")}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>{t("learningCalendar.learningActivity")}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span>{t("learningCalendar.today")}</span>
            </div>
        </div>
    );

    if (embedded) {
        return (
            <div className="flex h-full flex-col gap-4">
                {header}
                {weekdayHeader}
                <div className="flex flex-1 flex-col gap-4">
                    {calendarGrid}
                    {legend}
                </div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
            <CardHeader className="space-y-4 pb-4">
                {header}
                {weekdayHeader}
                {calendarGrid}
                {legend}
            </CardHeader>
            <CardContent className="hidden" />
        </Card>
    );
}
