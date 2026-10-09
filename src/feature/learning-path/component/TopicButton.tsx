import { useTranslation } from "react-i18next";
import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock3,
} from "lucide-react";
import type { RoadmapTopic } from "../api/roadmapApi";
import {
    pluralize,
    formatLabel,
    formatMinutes,
    getGeneratedLessonsCount,
} from "../utils/roadmapFormatters";

interface TopicButtonProps {
    topic: RoadmapTopic;
    isSelected: boolean;
    onClick: () => void;
}

export function TopicButton({
    topic,
    isSelected,
    onClick,
}: TopicButtonProps) {
    const { t } = useTranslation("profile");
    const generatedLessons = getGeneratedLessonsCount(topic);

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isSelected}
            className={[
                "w-full min-w-0 rounded-xl border p-4 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "dark:focus-visible:ring-offset-slate-900",
                isSelected
                    ? "border-blue-500 bg-blue-50/80 shadow-sm dark:border-blue-900 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800/60",
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <span
                    className={[
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                        isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    ].join(" ")}
                >
                    {topic.sort_order}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h3 className="break-words font-bold leading-5 text-slate-900 dark:text-white">
                                {topic.name}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                                {formatLabel(topic.primary_skill)} ·{" "}
                                {formatLabel(topic.seed_tier)}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            {isSelected ? (
                                <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                    {t("selected", { defaultValue: "Selected" })}
                                </span>
                            ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                            )}

                            {topic.topic_quiz_status === 'passed' && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    {t("quizPassed", { defaultValue: "Quiz Passed" })}
                                </span>
                            )}
                            {topic.topic_quiz_status === 'ready' && (
                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                    {t("quizReady", { defaultValue: "Quiz Ready" })}
                                </span>
                            )}
                            {topic.topic_quiz_status === 'failed' && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                                    {t("quizRetry", { defaultValue: "Quiz Retry" })}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 shrink-0" />
                            {t("lessonCount", { count: topic.lessons.length, defaultValue: pluralize(topic.lessons.length, "Lesson") })}
                        </span>

                        <span className="flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4 shrink-0" />
                            {formatMinutes(topic.total_estimated_minutes)}
                        </span>

                        <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            {t("generatedCount", { count: generatedLessons, defaultValue: `${generatedLessons} generated` })}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
}
