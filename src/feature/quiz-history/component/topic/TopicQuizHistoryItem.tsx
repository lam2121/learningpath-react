import {
    AlertCircle,
    CheckCircle2,
    Clock3,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TopicQuizHistoryEntryResponse } from "@/feature/auth/type/Auth";
import { formatHistoryDate, formatPercent } from "@/common/utils/historyFormatters";

interface TopicQuizHistoryItemProps {
    entry: TopicQuizHistoryEntryResponse;
    onClick: () => void;
}

export function TopicQuizHistoryItem({ entry, onClick }: TopicQuizHistoryItemProps) {
    const { t } = useTranslation(["history", "profile"]);

    const recordedLabel = formatHistoryDate(entry.recorded_at ?? entry.completed_at);
    const topicOrderLabel = entry.topic_sort_order
        ? t("list.topic", { count: entry.topic_sort_order, defaultValue: `Topic ${entry.topic_sort_order}` })
        : t("list.topicFallback", { defaultValue: "Topic" });

    const statusClasses =
        entry.status === "passed"
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60"
            : entry.status === "failed"
                ? "bg-rose-100 text-rose-800 border border-rose-200 font-bold dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60"
                : "bg-amber-100 text-amber-800 border border-amber-200 font-bold dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60";

    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex w-full cursor-pointer flex-col rounded-xl border border-cyan-200 bg-[#eef7ff] p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:bg-white hover:shadow-[0_8px_20px_rgba(0,169,206,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-cyan-900/40 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:hover:border-cyan-500"
        >
            {/* Top section: Badges + Topic Name on left, Best Score Badge on right */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-cyan-200 px-2.5 py-1 text-xs font-bold text-[#004a82] dark:bg-cyan-900 dark:text-cyan-200">
                            {topicOrderLabel}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${statusClasses}`}>
                            {entry.status === "passed" ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : entry.status === "failed" ? (
                                <AlertCircle className="h-3 w-3" />
                            ) : (
                                <Clock3 className="h-3 w-3" />
                            )}
                            <span className="capitalize">
                                {entry.status === "passed"
                                    ? t("topicQuiz.filters.passed", { defaultValue: "Passed" })
                                    : entry.status === "failed"
                                        ? t("topicQuiz.filters.failed", { defaultValue: "Failed" })
                                        : entry.status}
                            </span>
                        </span>
                    </div>

                    {/* Topic Name */}
                    <p className="mt-2 text-base font-bold text-slate-800 dark:text-slate-100 transition-colors group-hover:text-[#005596] dark:group-hover:text-cyan-400 line-clamp-1">
                        {entry.topic_name}
                    </p>
                </div>

                {/* Best Score Badge */}
                <div className="min-w-[84px] shrink-0 rounded-xl bg-[#0082c9] px-3 py-2 text-center shadow-md transition-colors group-hover:bg-[#0069aa] dark:bg-blue-600 dark:group-hover:bg-blue-500">
                    <p className="text-[10px] font-black uppercase leading-none tracking-[0.16em] text-cyan-50">
                        {t("topicQuiz.best", { defaultValue: "BEST" })}
                    </p>
                    <p className="mt-1 text-2xl font-black leading-none text-white">
                        {formatPercent(entry.best_score_percent)}
                    </p>
                </div>
            </div>

            {/* Stats line */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-200 dark:border-slate-700/60 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <span>
                    {t(entry.attempt_count === 1 ? "topicQuiz.attempt_one" : "topicQuiz.attempt_other", {
                        count: entry.attempt_count,
                        defaultValue: `${entry.attempt_count} attempt${entry.attempt_count !== 1 ? "s" : ""}`,
                    })}
                </span>
                <span>•</span>
                <span>
                    {t("topicQuiz.failed", {
                        count: entry.failed_attempts,
                        defaultValue: `${entry.failed_attempts} failed`,
                    })}
                </span>
                <span>•</span>
                <span>
                    {t("topicQuiz.correct", {
                        correct: entry.correct_count,
                        total: entry.total_questions,
                        defaultValue: `${entry.correct_count}/${entry.total_questions} correct`,
                    })}
                </span>
                <span className="ml-auto text-slate-500 dark:text-slate-400">
                    {recordedLabel ?? t("topicQuiz.notRecorded", { defaultValue: "Not recorded" })}
                </span>
            </div>
        </button>
    );
}
