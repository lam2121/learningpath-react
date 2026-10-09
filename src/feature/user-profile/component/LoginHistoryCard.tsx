import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { Activity, CalendarClock, Clock3 } from "lucide-react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    StudyHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import { useAuth } from "@/common/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import { getTrackedStudyMinutesByDay } from "@/common/utils/StudyActivity";
import { formatStudyDuration, getIntlLocale } from "@/common/utils/historyFormatters";

const studyChartColors = {
    cursor: "#7DDCEB",
    line: "#0072BB",
    area: "rgba(0, 169, 206, 0.18)",
    dotBorder: "#FFFFFF",
} as const;

export type StudyTimeChartPoint = {
    day: string;
    dateKey: string;
    minutes: number;
};

function buildStudyTimeData(
    studyHistory: StudyHistoryEntryResponse[],
    trackedStudyMinutesByDay: Record<string, number>,
): StudyTimeChartPoint[] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const minutesByDay = new Map<number, number>();

    studyHistory.forEach((entry) => {
        const parsed = new Date(entry.studied_on);
        if (
            Number.isNaN(parsed.getTime())
            || parsed.getFullYear() !== year
            || parsed.getMonth() !== month
        ) {
            return;
        }

        const day = parsed.getDate();
        minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + Math.max(0, entry.minutes));
    });

    Object.entries(trackedStudyMinutesByDay).forEach(([dateKey, minutes]) => {
        const parsed = new Date(dateKey);
        if (
            Number.isNaN(parsed.getTime())
            || parsed.getFullYear() !== year
            || parsed.getMonth() !== month
        ) {
            return;
        }

        const day = parsed.getDate();
        minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + Math.max(0, minutes));
    });

    return Array.from({ length: daysInMonth }, (_, index) => {
        const dayNum = index + 1;
        const minutes = minutesByDay.get(dayNum) ?? 0;
        return {
            day: String(dayNum),
            dateKey: `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`,
            minutes,
        };
    });
}

export function StudyTimeTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: StudyTimeChartPoint }>;
}) {
    const { i18n } = useTranslation();
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0]?.payload;
    if (!point) {
        return null;
    }

    const parsedDate = new Date(point.dateKey);
    const label = Number.isNaN(parsedDate.getTime())
        ? point.day
        : parsedDate.toLocaleDateString(getIntlLocale(i18n.language), {
            month: "short",
            day: "numeric",
        });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {formatStudyDuration(point.minutes)}
            </p>
        </div>
    );
}

export type LoginHistoryCardProps = {
    compact?: boolean;
    stretch?: boolean;
};

export function LoginHistoryCard({
    compact = false,
    stretch = false,
}: LoginHistoryCardProps) {
    const { t } = useTranslation(["history", "profile"]);
    const auth = useAuth();
    const userId = Number(auth.user?.id);
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [trackedStudyMinutesByDay, setTrackedStudyMinutesByDay] = useState<Record<string, number>>(
        () => (Number.isFinite(userId) ? getTrackedStudyMinutesByDay(userId) : {}),
    );

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                const response = await fetchCurrentUserProfile();
                if (isMounted) {
                    setProfile(response);
                }
            } catch {
                if (isMounted) {
                    setProfile(null);
                }
            }
        };

        void loadProfile();
        if (Number.isFinite(userId)) {
            setTrackedStudyMinutesByDay(getTrackedStudyMinutesByDay(userId));
        }

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (isMounted) {
                setProfile(customEvent.detail);
            }
        };
        const handleStudyActivityUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{
                userId?: number;
                studyMinutesByDay?: Record<string, number>;
            }>;

            if (!isMounted || customEvent.detail.userId !== userId) {
                return;
            }

            setTrackedStudyMinutesByDay(
                customEvent.detail.studyMinutesByDay ?? getTrackedStudyMinutesByDay(userId),
            );
        };
        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        window.addEventListener("careerpath:study-activity-updated", handleStudyActivityUpdated);

        return () => {
            isMounted = false;
            window.removeEventListener(
                "careerpath:profile-updated",
                handleProfileUpdated,
            );
            window.removeEventListener(
                "careerpath:study-activity-updated",
                handleStudyActivityUpdated,
            );
        };
    }, [userId]);

    const studyTimeData = useMemo(() => {
        return buildStudyTimeData(
            profile?.study_history ?? [],
            trackedStudyMinutesByDay,
        );
    }, [profile, trackedStudyMinutesByDay]);

    const today = new Date().getDate();
    const chartData = studyTimeData.slice(0, today);
    const totalMinutes = chartData.reduce((sum, item) => sum + item.minutes, 0);
    const todayMinutes = chartData[chartData.length - 1]?.minutes ?? 0;
    const hasActivity = totalMinutes > 0;
    const activeStudyMinutes = chartData
        .filter((item) => item.minutes > 0)
        .map((item) => item.minutes);
    const shortestStudyMinutes = activeStudyMinutes.length > 0
        ? Math.min(...activeStudyMinutes)
        : 0;
    const longestStudyMinutes = activeStudyMinutes.length > 0
        ? Math.max(...activeStudyMinutes)
        : 0;
    const shouldStretch = compact || stretch;
    const chartHeightClass = shouldStretch
        ? "min-h-28 flex-1 sm:min-h-32"
        : "h-28 sm:h-32 xl:h-36";
    const cardHeaderClassName = compact
        ? "px-4 pb-2 pt-4 sm:px-5 sm:pt-5"
        : "px-4 pb-2 pt-4 sm:px-6 sm:pt-5";
    const cardContentClassName = shouldStretch
        ? "flex min-h-0 flex-1 flex-col px-4 pb-4 pt-0 sm:px-5 sm:pb-5"
        : "min-w-0 px-4 pb-4 pt-0 sm:px-6 sm:pb-6";
    const emptyStateClassName = shouldStretch
        ? "flex min-h-36 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center sm:min-h-40 dark:border-slate-800 dark:bg-slate-800/40"
        : "flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center sm:min-h-44 sm:px-6 dark:border-slate-800 dark:bg-slate-800/40";

    return (
        <Card className={`flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900 ${shouldStretch ? "h-full flex-1" : "h-fit self-start"}`}>
            <CardHeader className={cardHeaderClassName}>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-md shadow-cyan-500/20">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                            {t("studyActivity", { defaultValue: "Study Activity" })}
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            {t("loginHistory.subtitle", { defaultValue: "A monthly view of the time you have already logged from completed lessons." })}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className={cardContentClassName}>
                {!hasActivity ? (
                    <div className={emptyStateClassName}>
                        <CalendarClock className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                        <div className="w-full flex flex-col items-center justify-center text-center">
                            <p className="w-full text-center font-semibold text-slate-900 dark:text-white" style={{ textAlign: "center" }}>
                                {t("loginHistory.emptyTitle", { defaultValue: "No study time yet" })}
                            </p>
                            <p className="mt-2 w-full text-center text-lg leading-6 text-slate-500 dark:text-slate-400" style={{ textAlign: "center" }}>
                                {t("loginHistory.emptyDesc", { defaultValue: "Complete your first lesson to start building your study-time history." })}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className={shouldStretch
                        ? "flex min-h-0 flex-1 flex-col gap-3 sm:gap-4"
                        : "space-y-4 sm:space-y-5"
                    }>
                        <div className="flex items-start justify-between gap-3 sm:items-end sm:gap-4">
                            <div className="min-w-0">
                                <p className="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-700 dark:text-slate-300">
                                    {t("loginHistory.studiedToday", { defaultValue: "Studied today" })}
                                </p>
                                <p className={`mt-1.5 font-black tracking-tight text-slate-950 sm:mt-2 dark:text-white ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
                                    {formatStudyDuration(todayMinutes)}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-700 sm:mt-2 sm:text-[15px] font-medium dark:text-slate-300">
                                    {todayMinutes > 0
                                        ? t("loginHistory.loggedSoFar", { defaultValue: "Logged so far today" })
                                        : t("loginHistory.noneToday", { defaultValue: "No study time logged today yet" })}
                                </p>
                            </div>

                            <div className={`flex shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#005596] sm:rounded-2xl dark:bg-cyan-950/60 dark:text-cyan-400 ${compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"}`}>
                                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-wrap gap-1.5 text-[11px] font-bold sm:gap-2 sm:text-sm">
                            <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                {t("loginHistory.shortest", { duration: formatStudyDuration(shortestStudyMinutes), defaultValue: `Shortest time: ${formatStudyDuration(shortestStudyMinutes)}` })}
                            </span>
                            <span className="max-w-full truncate rounded-full bg-cyan-50 px-2.5 py-1 text-[#005596] font-bold dark:bg-cyan-950/60 dark:text-cyan-400">
                                {t("loginHistory.longest", { duration: formatStudyDuration(longestStudyMinutes), defaultValue: `Longest time: ${formatStudyDuration(longestStudyMinutes)}` })}
                            </span>
                        </div>

                        <div className={`${chartHeightClass} min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-2 py-2 sm:rounded-2xl sm:px-4 sm:py-3 dark:border-slate-700 dark:bg-slate-800/40`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                                    <defs>
                                        <linearGradient id="studyActivityFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={studyChartColors.line} stopOpacity={0.35} />
                                            <stop offset="100%" stopColor={studyChartColors.line} stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        vertical={false}
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 4"
                                        className="text-slate-300 dark:text-slate-600"
                                    />

                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        className="text-slate-400 dark:text-slate-500"
                                        minTickGap={24}
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        width={36}
                                        tickFormatter={(value: number) => (value === 0 ? "0" : `${value}m`)}
                                        tick={{ fontSize: 11, fill: "currentColor" }}
                                        className="text-slate-400 dark:text-slate-500"
                                        allowDecimals={false}
                                    />

                                    <Tooltip
                                        content={<StudyTimeTooltip />}
                                        cursor={{ stroke: studyChartColors.cursor, strokeWidth: 1.5 }}
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="minutes"
                                        stroke={studyChartColors.line}
                                        strokeWidth={2.5}
                                        fill="url(#studyActivityFill)"
                                        activeDot={{
                                            r: 5,
                                            fill: studyChartColors.line,
                                            stroke: studyChartColors.dotBorder,
                                            strokeWidth: 2,
                                        }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
