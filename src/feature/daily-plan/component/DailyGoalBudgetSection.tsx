import { CheckCircle2, ChevronDown, Clock, Flame, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Progress } from "@/shadcn/component/ui/progress";
import type { StudyGoalDecision } from "@/common/utils/dailyStudyGoal";
import { formatProgressMinutes } from "../utils/dailyPlanFormatters";

interface DailyGoalBudgetSectionProps {
    hasMetTodayGoal: boolean;
    todayLearnedMinutes: number;
    currentMinutes: number;
    minUnit: string;
    timeBudgetUsage: number;
    bonusTodayMinutes: number;
    remainingTodayMinutes: number;
    isStudyPlanExpanded: boolean;
    budgetCardClass: string;
    studyGoalDecision: StudyGoalDecision | null;
}

export function DailyGoalBudgetSection({
    hasMetTodayGoal,
    todayLearnedMinutes,
    currentMinutes,
    minUnit,
    timeBudgetUsage,
    bonusTodayMinutes,
    remainingTodayMinutes,
    isStudyPlanExpanded,
    studyGoalDecision,
}: DailyGoalBudgetSectionProps) {
    const { t } = useTranslation("profile");

    return (
        <div className="space-y-4">
            <div
                className={`rounded-2xl border p-3.5 sm:p-4.5 transition-all duration-300 w-full min-w-0 ${
                    hasMetTodayGoal
                        ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white shadow-xs dark:border-emerald-900/50 dark:bg-gradient-to-br dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900"
                        : "border-slate-200/80 bg-slate-50/70 dark:border-slate-800/80 dark:bg-slate-800/40"
                }`}
            >
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-semibold w-full min-w-0">
                    <span className={`truncate min-w-0 ${hasMetTodayGoal ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                        {t("todayTimeBudget", { defaultValue: "Today's time budget" })}
                    </span>
                    <span
                        className={`font-black tracking-tight shrink-0 whitespace-nowrap ${
                            hasMetTodayGoal
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-slate-900 dark:text-white"
                        }`}
                    >
                        {t("progressOfTarget", {
                            studied: formatProgressMinutes(todayLearnedMinutes, minUnit),
                            target: formatProgressMinutes(currentMinutes, minUnit),
                            defaultValue: `${formatProgressMinutes(todayLearnedMinutes, minUnit)} of ${formatProgressMinutes(currentMinutes, minUnit)}`,
                        })}
                    </span>
                </div>

                {hasMetTodayGoal ? (
                    <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-xs ring-1 ring-emerald-200/70 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{t("dailyGoalReached", { defaultValue: "Daily goal reached" })}</span>
                        <Sparkles className="ml-auto h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                ) : null}

                <div className="mt-3">
                    <Progress
                        value={timeBudgetUsage}
                        className="h-2.5 bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden"
                        indicatorClassName={
                            hasMetTodayGoal
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"
                        }
                    />
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full min-w-0">
                    <div className="rounded-xl border border-blue-200/70 bg-white/90 p-2 sm:p-3 shadow-xs dark:border-blue-900/40 dark:bg-slate-900/80 min-w-0">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span className="truncate">{t("plannedToday", { defaultValue: "Planned Today" })}</span>
                        </div>
                        <p className="mt-1 text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                            {formatProgressMinutes(currentMinutes, minUnit)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-cyan-200/70 bg-white/90 p-2 sm:p-3 shadow-xs dark:border-cyan-900/40 dark:bg-slate-900/80 min-w-0">
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 truncate">
                            <Flame className="h-3 w-3 shrink-0" />
                            <span className="truncate">{t("learnedToday", { defaultValue: "Learned Today" })}</span>
                        </div>
                        <p className="mt-1 text-sm sm:text-lg font-black text-cyan-600 dark:text-cyan-400 truncate">
                            {formatProgressMinutes(todayLearnedMinutes, minUnit)}
                        </p>
                    </div>

                    <div
                        className={`rounded-xl border p-2 sm:p-3 shadow-xs min-w-0 ${
                            hasMetTodayGoal
                                ? "border-emerald-200/70 bg-white/90 dark:border-emerald-900/40 dark:bg-slate-900/80"
                                : "border-amber-200/70 bg-white/90 dark:border-amber-900/40 dark:bg-slate-900/80"
                        }`}
                    >
                        <div
                            className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider truncate ${
                                hasMetTodayGoal
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-amber-600 dark:text-amber-400"
                            }`}
                        >
                            <Sparkles className="h-3 w-3 shrink-0" />
                            <span className="truncate">{hasMetTodayGoal ? t("bonusTime", { defaultValue: "Bonus Time" }) : t("remaining", { defaultValue: "Remaining" })}</span>
                        </div>
                        <p
                            className={`mt-1 text-sm sm:text-lg font-black truncate ${
                                hasMetTodayGoal
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-amber-600 dark:text-amber-400"
                            }`}
                        >
                            {hasMetTodayGoal
                                ? formatProgressMinutes(bonusTodayMinutes, minUnit)
                                : formatProgressMinutes(remainingTodayMinutes, minUnit)}
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <p className="leading-relaxed">
                        {hasMetTodayGoal
                            ? t("reachedPlannedStudyTime", {
                                defaultValue: "You have already reached the study time you planned for today.",
                            })
                            : remainingTodayMinutes > 0
                                ? t("leftToHitTodayGoal", {
                                    time: formatProgressMinutes(remainingTodayMinutes, minUnit),
                                    defaultValue: `${formatProgressMinutes(remainingTodayMinutes, minUnit)} left to hit today's goal.`,
                                })
                                : t("dailyTargetWillUpdate", {
                                    defaultValue: "Your daily study target will update here as you learn.",
                                })}
                    </p>
                </div>

                <div className="mt-2.5 flex items-center justify-center pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 group-hover:text-blue-700 dark:text-blue-400">
                        {isStudyPlanExpanded
                            ? t("hideTodayActions", { defaultValue: "Hide today's actions" })
                            : t("clickToViewTodayActions", { defaultValue: "Click to view today's actions" })}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isStudyPlanExpanded ? "rotate-180" : ""}`} />
                    </span>
                </div>
            </div>

            {hasMetTodayGoal ? (
                <div className="rounded-2xl border border-emerald-200/80 bg-[linear-gradient(135deg,_rgba(236,253,245,1)_0%,_rgba(239,246,255,1)_100%)] p-4 shadow-xs dark:border-emerald-900/40 dark:bg-[linear-gradient(135deg,rgba(6,78,59,0.25)_0%,rgba(15,23,42,0.9)_100%)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                {t("goalReachedBadge", { defaultValue: "Goal reached" })}
                            </p>
                            <p className="mt-0.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                {studyGoalDecision === "break"
                                    ? t("goalReachedStoppingPoint", { defaultValue: "Great stopping point for today." })
                                    : studyGoalDecision === "continue"
                                        ? t("goalReachedBonusTitle", {
                                            defaultValue: "Extra study time counts as bonus progress.",
                                        })
                                        : t("goalReachedFinishedTitle", {
                                            defaultValue: "You finished today's planned study time.",
                                        })}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {studyGoalDecision === "break"
                                    ? t("goalReachedBreakDesc", {
                                        defaultValue: "Take a break and come back tomorrow with a fresh start.",
                                    })
                                    : studyGoalDecision === "continue"
                                        ? t("goalReachedBonusDesc", {
                                            defaultValue:
                                                "Keep going if you still have energy. Everything beyond today's goal is extra momentum.",
                                        })
                                        : t("goalReachedAskNextDesc", {
                                            defaultValue:
                                                "If you continue learning in a lesson, the app will ask whether you want to stop for today or keep going.",
                                        })}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
