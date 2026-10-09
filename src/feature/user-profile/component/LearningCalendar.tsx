import { Badge } from "@/shadcn/component/ui/badge";
import { Button } from "@/shadcn/component/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shadcn/component/ui/card";
import { Progress } from "@/shadcn/component/ui/progress";
import {
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Flame,
    RotateCcw,
    Shield,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
    calculateCurrentStreak,
    calculateLongestStreak,
    findMissedDays,
    getLoginDays,
    getRestoredDays,
    getStreakRestoreStatus,
    getStreakRestoreStudyMinutes,
    getTrackedStudyMinutesTotal,
    LOGIN_DAYS_UPDATED_EVENT,
    restoreMissedDays,
    RESTORE_MINUTES_PER_DAY,
    STREAK_RESTORED_EVENT,
    syncServerStreakStatus,
    type StreakRestoreStatus,
} from "@/common/utils/StudyActivity";
import { getIntlLocale } from "@/common/utils/historyFormatters";
import type { UserProfileResponse } from "@/feature/auth/type/Auth";
import {
    fetchServerStreakStatus,
    restoreServerStreak,
} from "@/feature/user-profile/api/streakApi";

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
    const { t, i18n } = useTranslation("profile");
    const [loginDays, setLoginDays] = useState<string[]>([]);
    const [restoredDays, setRestoredDays] = useState<string[]>([]);
    const [streakStatus, setStreakStatus] = useState<StreakRestoreStatus | null>(null);
    const [today, setToday] = useState(() => new Date());
    const [isRestoring, setIsRestoring] = useState(false);
    const [showRestorePanel, setShowRestorePanel] = useState(true);

    const refreshState = useCallback(() => {
        if (!Number.isFinite(userId) || userId <= 0) {
            setLoginDays([]);
            setRestoredDays([]);
            setStreakStatus(null);
            return;
        }

        const days = getLoginDays(userId);
        const restored = getRestoredDays(userId);
        const status = getStreakRestoreStatus(userId);
        setLoginDays(days);
        setRestoredDays(restored);
        setStreakStatus(status);
        setToday(new Date());
    }, [userId]);

    const syncFromServer = useCallback(async () => {
        if (!Number.isFinite(userId) || userId <= 0) return;
        try {
            const clientActiveMinutes = getTrackedStudyMinutesTotal(userId);
            const serverStatus = await fetchServerStreakStatus(clientActiveMinutes);
            syncServerStreakStatus(userId, serverStatus);

            const days = getLoginDays(userId);
            const restored = getRestoredDays(userId);
            const missed = findMissedDays(days, new Date());
            setLoginDays(days);
            setRestoredDays(restored);
            setStreakStatus({
                totalStudiedMinutes: serverStatus.total_studied_minutes,
                requiredMinutesPerDay: serverStatus.required_minutes_per_day,
                totalEarnedCredits: serverStatus.total_earned_credits,
                usedCredits: serverStatus.used_credits,
                availableCredits: serverStatus.available_credits,
                progressMinutes: serverStatus.progress_minutes,
                progressPercent: serverStatus.progress_percent,
                restoredDays: serverStatus.restored_dates,
                missedDays: missed,
                currentStreak: serverStatus.current_streak,
                longestStreak: serverStatus.longest_streak,
            });
            setToday(new Date());
        } catch {
            // Offline fallback - local storage remains source of truth
            refreshState();
        }
    }, [userId, refreshState]);

    useEffect(() => {
        refreshState();
        void syncFromServer();

        const handleLoginDaysUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== userId) {
                return;
            }
            refreshState();
        };

        const handleStreakRestored = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail.userId !== userId) {
                return;
            }
            void syncFromServer();
        };

        const handleProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<UserProfileResponse>;
            if (customEvent.detail && Number.isFinite(userId)) {
                void syncFromServer();
            }
        };

        const handleStudyActivityUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ userId?: number }>;
            if (customEvent.detail && customEvent.detail.userId === userId) {
                refreshState();
                void syncFromServer();
            }
        };

        window.addEventListener(LOGIN_DAYS_UPDATED_EVENT, handleLoginDaysUpdated);
        window.addEventListener(STREAK_RESTORED_EVENT, handleStreakRestored);
        window.addEventListener("careerpath:profile-updated", handleProfileUpdated);
        window.addEventListener("careerpath:study-activity-updated", handleStudyActivityUpdated);

        return () => {
            window.removeEventListener(
                LOGIN_DAYS_UPDATED_EVENT,
                handleLoginDaysUpdated,
            );
            window.removeEventListener(
                STREAK_RESTORED_EVENT,
                handleStreakRestored,
            );
            window.removeEventListener(
                "careerpath:profile-updated",
                handleProfileUpdated,
            );
            window.removeEventListener(
                "careerpath:study-activity-updated",
                handleStudyActivityUpdated,
            );
        };
    }, [userId, refreshState, syncFromServer]);

    const loginDaySet = useMemo(() => new Set(loginDays), [loginDays]);
    const restoredDaySet = useMemo(() => new Set(restoredDays), [restoredDays]);
    const missedDaySet = useMemo(
        () => new Set(streakStatus?.missedDays ?? []),
        [streakStatus],
    );

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentLocale = getIntlLocale(i18n.language);
    const currentMonthLabel = today.toLocaleDateString(currentLocale, {
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
    const currentStreak = calculateCurrentStreak(loginDays, today);

    const weekdayLabels = [
        t("weekdayMon", { defaultValue: "Mon" }),
        t("weekdayTue", { defaultValue: "Tue" }),
        t("weekdayWed", { defaultValue: "Wed" }),
        t("weekdayThu", { defaultValue: "Thu" }),
        t("weekdayFri", { defaultValue: "Fri" }),
        t("weekdaySat", { defaultValue: "Sat" }),
        t("weekdaySun", { defaultValue: "Sun" }),
    ];

    const handleRestoreDates = async (datesToRestore: string[]) => {
        if (isRestoring || datesToRestore.length === 0) return;
        setIsRestoring(true);

        try {
            const streakMinutes = getStreakRestoreStudyMinutes(userId);

            // 1. Local update
            const result = restoreMissedDays(userId, datesToRestore, streakMinutes);
            if (!result.success) {
                toast.error(t("learningCalendar.restoreErrorToast"), {
                    description: result.error,
                });
                setIsRestoring(false);
                return;
            }

            // 2. Server sync
            try {
                const clientActiveMinutes = getTrackedStudyMinutesTotal(userId);
                const serverStatus = await restoreServerStreak(datesToRestore, clientActiveMinutes);
                syncServerStreakStatus(userId, serverStatus);
            } catch {
                // If backend sync fails, client still holds state
            }

            await syncFromServer();
            toast.success(t("learningCalendar.restoreSuccessToast"), {
                description: t("learningCalendar.restoreSuccessDetail", {
                    count: datesToRestore.length,
                }),
            });
        } catch {
            toast.error(t("learningCalendar.restoreErrorToast"));
        } finally {
            setIsRestoring(false);
        }
    };

    const header = (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <CalendarDays className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                    <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {t("learningCalendar.title")}
                    </CardTitle>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("learningCalendar.subtitle")}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 dark:border-blue-900/40 dark:bg-blue-950/40">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                        {t("learningCalendar.activeDays", { count: activeDays, defaultValue: "{{count}} active" })}
                    </span>
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50/70 px-3 py-1.5 dark:border-orange-900/40 dark:bg-orange-950/40">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                        {t("learningCalendar.streak", { count: currentStreak > 0 ? currentStreak : longestStreak, defaultValue: "Streak {{count}}" })}
                    </span>
                </span>

                {streakStatus && streakStatus.availableCredits > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 shadow-sm shadow-emerald-500/10 dark:border-emerald-800/40 dark:bg-emerald-950/40">
                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {t("learningCalendar.availableCredits", { count: streakStatus.availableCredits, defaultValue: "{{count}} restore credits" })}
                        </span>
                    </span>
                ) : null}

                <Badge
                    variant="secondary"
                    className="shrink-0 rounded-full bg-slate-100 px-3.5 py-1.5 text-base font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                    {currentMonthLabel}
                </Badge>
            </div>
        </div>
    );

    const restoreShieldCard = streakStatus ? (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-sky-50/50 p-4 shadow-sm transition-all duration-200 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-slate-900">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {t("learningCalendar.streakRestoreTitle", { defaultValue: "Streak Restoration" })}
                            </h4>
                            <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                {t("learningCalendar.ruleInfo", {
                                    minutes: streakStatus.requiredMinutesPerDay,
                                    defaultValue: "{{minutes}}m study = 1 credit",
                                })}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {t("learningCalendar.streakRestoreSubtitle", {
                                minutes: streakStatus.requiredMinutesPerDay,
                                defaultValue: "Accumulate {{minutes}} minutes of study time to earn restore credits.",
                            })}
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRestorePanel((prev) => !prev)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                    {showRestorePanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
            </div>

            {showRestorePanel ? (
                <div className="mt-3.5 space-y-3 pt-2 border-t border-emerald-100/80 dark:border-emerald-900/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {t("learningCalendar.accumulatedMinutes", {
                                    minutes: streakStatus.totalStudiedMinutes,
                                    defaultValue: "{{minutes}} mins accumulated",
                                })}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                {t("learningCalendar.availableCredits", {
                                    count: streakStatus.availableCredits,
                                    defaultValue: "{{count}} restore credits",
                                })}
                            </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400">
                            {t("learningCalendar.progressToNextCredit", {
                                remaining: streakStatus.requiredMinutesPerDay - streakStatus.progressMinutes,
                                progress: streakStatus.progressPercent,
                                defaultValue: "{{remaining}} mins to next credit ({{progress}}%)",
                            })}
                        </span>
                    </div>

                    <Progress
                        value={streakStatus.progressPercent}
                        className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-950/60"
                    />

                    {/* Missed days actions */}
                    {streakStatus.missedDays.length > 0 ? (
                        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                        {t("learningCalendar.missedDaysCount", {
                                            count: streakStatus.missedDays.length,
                                            defaultValue: "{{count}} missed days",
                                        })}
                                    </span>
                                </div>

                                {streakStatus.availableCredits > 0 ? (
                                    <div className="flex items-center gap-2">
                                        {streakStatus.availableCredits > 1 && streakStatus.missedDays.length > 1 ? (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    const countToRestore = Math.min(
                                                        streakStatus.missedDays.length,
                                                        streakStatus.availableCredits,
                                                    );
                                                    handleRestoreDates(
                                                        streakStatus.missedDays.slice(0, countToRestore),
                                                    );
                                                }}
                                                disabled={isRestoring}
                                                className="h-7 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
                                            >
                                                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                                                {t("learningCalendar.restoreAllButton", {
                                                    count: Math.min(
                                                        streakStatus.missedDays.length,
                                                        streakStatus.availableCredits,
                                                    ),
                                                    defaultValue: "Restore all ({{count}} days)",
                                                })}
                                            </Button>
                                        ) : null}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRestoreDates([streakStatus.missedDays[0]])}
                                            disabled={isRestoring}
                                            className="h-7 rounded-lg border-emerald-300 bg-white px-2.5 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-50 dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                                        >
                                            <Shield className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                                            {t("learningCalendar.restoreDayButton", { defaultValue: "Restore day" })}: {streakStatus.missedDays[0]}
                                        </Button>
                                    </div>
                                ) : (
                                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                        {t("learningCalendar.learnMoreToEarn", {
                                            defaultValue: "Study more to earn restore credits",
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-100/50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-semibold">
                                {t("learningCalendar.noMissedDaysDesc", {
                                    defaultValue: "Your streak is intact! Keep up the momentum.",
                                })}
                            </span>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    ) : null;

    const weekdayHeader = (
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
            {weekdayLabels.map((label, idx) => (
                <div key={idx}>{label}</div>
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
                const isRestored = restoredDaySet.has(dateKey);
                const loggedIn = loginDaySet.has(dateKey);
                const isToday = day === today.getDate();
                const isMissedEligible =
                    missedDaySet.has(dateKey) &&
                    (streakStatus?.availableCredits ?? 0) > 0;

                let tooltip = isToday
                    ? loggedIn
                        ? t("learningCalendar.tooltipTodayWithActivity", { day })
                        : t("learningCalendar.tooltipToday", { day })
                    : isRestored
                        ? t("learningCalendar.tooltipRestored", {
                            day,
                            minutes: streakStatus?.requiredMinutesPerDay ?? RESTORE_MINUTES_PER_DAY,
                            defaultValue: "{{day}}: Streak restored ({{minutes}}m study)",
                        })
                        : loggedIn
                            ? t("learningCalendar.tooltipLoggedIn", { day })
                            : isMissedEligible
                                ? `${day}: ${t("learningCalendar.readyToRestore", { defaultValue: "Click to restore streak" })}`
                                : t("learningCalendar.tooltipNoLogin", { day });

                return (
                    <button
                        type="button"
                        key={dateKey}
                        title={tooltip}
                        disabled={isRestoring || !isMissedEligible}
                        onClick={() => {
                            if (isMissedEligible) {
                                handleRestoreDates([dateKey]);
                            }
                        }}
                        className={[
                            `group relative flex items-center justify-center rounded-xl border-2 text-base font-bold transition-all duration-200 ${embedded ? "min-h-[2.75rem] h-full" : "h-9"}`,
                            isRestored
                                ? "border-transparent bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.32)] ring-2 ring-emerald-200 ring-offset-1 hover:-translate-y-0.5 dark:ring-emerald-800 dark:ring-offset-slate-900"
                                : isToday && loggedIn
                                    ? "border-amber-400 bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.32)] ring-2 ring-amber-200 ring-offset-1 hover:-translate-y-0.5 dark:ring-offset-slate-900 dark:ring-amber-800"
                                    : isToday
                                        ? "border-amber-400 bg-amber-50 text-amber-700 shadow-[0_8px_18px_rgba(245,158,11,0.16)] ring-2 ring-amber-200 ring-offset-1 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-800 dark:ring-offset-slate-900"
                                        : loggedIn
                                            ? "border-transparent bg-gradient-to-br from-[#0072BB] to-[#00A9CE] text-white shadow-[0_8px_20px_rgba(0,114,187,0.28)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(0,114,187,0.36)]"
                                            : isMissedEligible
                                                ? "cursor-pointer border-dashed border-emerald-400 bg-emerald-50/70 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 hover:shadow-sm dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                                : "border-dashed border-slate-300 bg-slate-50/60 text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 font-bold",
                        ].join(" ")}
                    >
                        {day}
                        {isRestored ? (
                            <Shield className="absolute right-0.5 top-0.5 h-3 w-3 text-white/90" />
                        ) : null}
                        {isToday ? (
                            <span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
                        ) : null}
                    </button>
                );
            })}
        </div>
    );

    const legend = (
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900">
                <span className="h-2 w-2 rounded-full border border-dashed border-slate-300 dark:border-slate-600" />
                {t("learningCalendar.noActivity")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900">
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#0072BB] to-[#00A9CE]" />
                {t("learningCalendar.learningActivity")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900">
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                {t("learningCalendar.streakRestored", { defaultValue: "Streak restored" })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900">
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 to-amber-500" />
                {t("learningCalendar.today")}
            </span>
        </div>
    );

    if (embedded) {
        return (
            <div className="flex h-full flex-col gap-3">
                {header}
                {restoreShieldCard}
                <div className="mt-1 flex flex-col gap-2"></div>
                {weekdayHeader}
                <div className="flex flex-1 flex-col gap-3">
                    {calendarGrid}
                    {legend}
                </div>
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border border-slate-300 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.07)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            <CardHeader className="space-y-4 pb-4">
                {header}
                {restoreShieldCard}
                {weekdayHeader}
                {calendarGrid}
                {legend}
            </CardHeader>
            <CardContent className="hidden" />
        </Card>
    );
}