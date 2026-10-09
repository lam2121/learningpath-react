import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { LessonQuizHistoryEntryResponse } from "@/feature/auth/type/Auth";
import {
    getDifficultyBadgeClasses,
    getSkillBadgeClasses,
} from "@/common/utils/historyBadgeStyles";
import {
    formatHistoryDate,
    formatLabel,
    formatPercent,
    formatStatusLabel,
} from "@/common/utils/historyFormatters";

interface LessonQuizCardItemProps {
    entry: LessonQuizHistoryEntryResponse;
    onClick: () => void;
}

export function LessonQuizCardItem({ entry, onClick }: LessonQuizCardItemProps) {
    const { t } = useTranslation("history");

    const recordedLabel = formatHistoryDate(entry.recorded_at);
    const completedLabel = formatHistoryDate(entry.completed_at);
    const submittedLabel = formatHistoryDate(entry.last_submitted_at);
    const statusLabel = formatStatusLabel(entry.status);
    const topicLabel = entry.topic_sort_order
        ? t("list.topic", { count: entry.topic_sort_order, defaultValue: `Topic ${entry.topic_sort_order}` })
        : t("list.topicFallback", { defaultValue: "Topic" });

    const statusClasses =
        entry.status === "passed"
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold"
            : entry.status === "failed"
                ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold"
                : "bg-amber-100 text-amber-800 border border-amber-200 font-bold";

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={t("detail.viewDetailsAria", {
                title: entry.lesson_title,
                defaultValue: `View quiz details for ${entry.lesson_title}`,
            })}
            className="group flex w-full cursor-pointer flex-col rounded-xl border border-cyan-200 bg-[#eef7ff] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_8px_20px_rgba(0,169,206,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:border-cyan-900/40 dark:bg-slate-800/70 dark:hover:bg-slate-800 dark:hover:border-cyan-500"
        >
            {/* Top section: Badges + Lesson Title on left, Best Score Badge on right */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-cyan-200 px-2.5 py-1 text-xs font-bold text-[#004a82] dark:bg-cyan-900 dark:text-cyan-200">
                            {topicLabel}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getSkillBadgeClasses(entry.skill)}`}>
                            {formatLabel(entry.skill)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getDifficultyBadgeClasses(entry.difficulty_tier)}`}>
                            {formatLabel(entry.difficulty_tier)}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-xs ${statusClasses}`}>
                            {entry.status === "passed" ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : null}
                            {statusLabel}
                        </span>
                    </div>

                    {/* Lesson Title */}
                    <p className="mt-2 line-clamp-1 text-base font-bold text-slate-800 transition-colors group-hover:text-[#005596] dark:text-slate-100 dark:group-hover:text-cyan-400">
                        {entry.lesson_title}
                    </p>
                </div>

                {/* Enlarged best score */}
                <div className="min-w-[84px] shrink-0 rounded-xl bg-[#0082c9] px-3 py-2 text-center shadow-md transition-colors group-hover:bg-[#0069aa] dark:bg-blue-600 dark:group-hover:bg-blue-500">
                    <p className="text-[10px] font-black uppercase leading-none tracking-[0.16em] text-cyan-50">
                        {t("list.best", { defaultValue: "Best" })}
                    </p>
                    <p className="mt-1 text-2xl font-black leading-none text-white">
                        {formatPercent(entry.best_score_percent)}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 pt-2 dark:border-slate-700/60">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t("list.attempts", {
                        count: entry.attempt_count,
                        defaultValue: `${entry.attempt_count} attempts`,
                    })}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t("list.failed", {
                        count: entry.failed_attempts,
                        defaultValue: `${entry.failed_attempts} failed`,
                    })}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t("list.noHint", {
                        correct: entry.correct_no_hint_count,
                        total: entry.total_no_hint_questions,
                        defaultValue: `No hint: ${entry.correct_no_hint_count}/${entry.total_no_hint_questions}`,
                    })}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                    {t("list.withHint", {
                        correct: entry.correct_with_hint_count,
                        total: entry.total_with_hint_questions,
                        defaultValue: `With hint: ${entry.correct_with_hint_count}/${entry.total_with_hint_questions}`,
                    })}
                </span>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    {recordedLabel ?? completedLabel ?? submittedLabel ?? t("list.unknown", { defaultValue: "Unknown" })}
                </span>
            </div>
        </button>
    );
}
