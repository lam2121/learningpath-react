import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarClock, Clock3 } from "lucide-react";

import { fetchCurrentUserProfile } from "@/feature/auth/api/authAPI";
import type {
    StudyHistoryEntryResponse,
    UserProfileResponse,
} from "@/feature/auth/type/Auth";
import { useAuth } from "@/common/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";
import {
    getTrackedStudyMinutesByDay,
    getTrackedStudyMinutesTotal,
} from "@/feature/user-profile/utils/StudyActivity";

import { LearningCalendar } from "./LearningCalendar";
import { SkillsOverview } from "../component/SkillsOverview";

type StudyTimeChartPoint = {
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

function formatStudyDuration(minutes: number) {
    if (minutes <= 0) {
        return "0 min";
    }

    if (minutes < 60) {
        return minutes === 1 ? "1 min" : `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return hours === 1 ? "1h" : `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function StudyTimeTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: Array<{ payload: StudyTimeChartPoint }>;
}) {
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
        : parsedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatStudyDuration(point.minutes)}
            </p>
        </div>
    );
}

type LoginHistoryCardProps = {
    compact?: boolean;
    stretch?: boolean;
};

export function LoginHistoryCard({
    compact = false,
    stretch = false,
}: LoginHistoryCardProps) {
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
    const activeDays = chartData.filter((item) => item.minutes > 0).length;
    const totalMinutes = chartData.reduce((sum, item) => sum + item.minutes, 0);
    const todayMinutes = chartData[chartData.length - 1]?.minutes ?? 0;
    const hasActivity = totalMinutes > 0;
    const trackedStudyMinutes = Number.isFinite(userId)
        ? getTrackedStudyMinutesTotal(userId)
        : 0;
    const totalTrackedMinutes = Math.max(
        0,
        (profile?.total_studied_minutes ?? 0) + trackedStudyMinutes,
    );
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
        ? "flex min-h-36 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center sm:min-h-40"
        : "flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center sm:min-h-44 sm:px-6";

    return (
        <Card className={`flex min-w-0 flex-col overflow-hidden border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] ${shouldStretch ? "h-full" : "h-fit self-start"}`}>
            <CardHeader className={cardHeaderClassName}>
                <CardTitle className="text-base text-slate-950 sm:text-lg">
                    Study Time History
                </CardTitle>
                <p className="text-xs leading-5 text-slate-500 sm:text-sm">
                    A monthly view of the time you have already logged from completed lessons.
                </p>
            </CardHeader>

            <CardContent className={cardContentClassName}>
                {!hasActivity ? (
                    <div className={emptyStateClassName}>
                        <CalendarClock className="h-10 w-10 text-slate-300" />
                        <div>
                            <p className="font-semibold text-slate-900">
                                No study time yet
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Complete your first lesson to start building your study-time history.
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
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                    Studied today
                                </p>
                                <p className={`mt-1.5 font-bold tracking-tight text-slate-950 sm:mt-2 ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
                                    {formatStudyDuration(todayMinutes)}
                                </p>
                                <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                                    {todayMinutes > 0
                                        ? "Logged so far today"
                                        : "No study time logged today yet"}
                                </p>
                            </div>

                            <div className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:rounded-2xl ${compact ? "h-9 w-9 sm:h-10 sm:w-10" : "h-10 w-10 sm:h-12 sm:w-12"}`}>
                                <Clock3 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                        </div>

                        <div className="flex min-w-0 flex-wrap gap-1.5 text-[11px] font-semibold sm:gap-2 sm:text-xs">
                            <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                                Active days: {activeDays}
                            </span>
                            <span className="max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                                Total tracked: {formatStudyDuration(totalTrackedMinutes)}
                            </span>
                        </div>

                        <div className={`${chartHeightClass} min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 sm:rounded-2xl sm:px-4 sm:py-3`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <Tooltip
                                        content={<StudyTimeTooltip />}
                                        cursor={{ stroke: "#93c5fd", strokeWidth: 1.5 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="minutes"
                                        stroke="#2563eb"
                                        strokeWidth={2.5}
                                        fill="rgba(37,99,235,0.14)"
                                        activeDot={{
                                            r: 5,
                                            fill: "#2563eb",
                                            stroke: "#ffffff",
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

type LearningHistoryChartProps = {
    showLoginHistory?: boolean;
};

export function LearningHistoryChart({
    showLoginHistory = true,
}: LearningHistoryChartProps) {
    const auth = useAuth();
    const userId = Number(auth.user?.id);

    return (
        <div className="space-y-6">
            <SkillsOverview />

            <div className={`grid grid-cols-1 gap-4 ${showLoginHistory ? "items-stretch lg:grid-cols-2" : "items-start"}`}>
                {showLoginHistory ? <LoginHistoryCard stretch /> : null}

                <Card className="flex h-full min-w-0 flex-col border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl">Learning Calendar</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col pt-0">
                        <div className="flex-1">
                            <LearningCalendar embedded userId={userId} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
