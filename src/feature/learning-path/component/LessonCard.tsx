import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Presentation } from "lucide-react";
import type { RoadmapLesson } from "../api/roadmapApi";
import {
    isLessonGenerated,
    isLessonGenerationFailed,
    isLessonGeneratedButLocked,
    isLessonReadyToStudy,
} from "../lessonAccess";
import {
    getDifficultyBadgeClasses,
    getSkillBadgeClasses,
} from "@/common/utils/historyBadgeStyles";
import { formatLabel, formatMinutes } from "../utils/roadmapFormatters";

interface LessonCardProps {
    lesson: RoadmapLesson;
    isWeakestReview?: boolean;
}

export function LessonCard({
    lesson,
    isWeakestReview = false,
}: LessonCardProps) {
    const { t } = useTranslation("profile");
    const isGenerated = isLessonGenerated(lesson);
    const isFailed = isLessonGenerationFailed(lesson);
    const isReadyToStudy = isLessonReadyToStudy(lesson);
    const isGeneratedButLocked = isLessonGeneratedButLocked(lesson);
    const content = (
        <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-14 sm:w-14 dark:bg-blue-950/60 dark:text-blue-400">
                <Presentation className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                        {lesson.title}
                    </h3>

                    <span
                        className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            isFailed
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                : !isGenerated
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                    : isReadyToStudy
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                        : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                        ].join(" ")}
                    >
                        {isFailed
                            ? t("generationFailed", { defaultValue: "Generation failed" })
                            : !isGenerated
                                ? t("pendingGeneration", { defaultValue: "Pending generation" })
                                : isReadyToStudy
                                    ? t("generated", { defaultValue: "Generated" })
                                    : t("generatedLocked", { defaultValue: "Generated · Locked" })}
                    </span>

                    {lesson.is_completed && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {t("passedBadge", { defaultValue: "✓ Passed" })}
                        </span>
                    )}

                    {isWeakestReview && (
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            {t("needsReviewBadge", { defaultValue: "🚩 Needs Review" })}
                        </span>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSkillBadgeClasses(lesson.primary_skill)}`}>
                        {formatLabel(lesson.primary_skill)}
                    </span>

                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getDifficultyBadgeClasses(lesson.difficulty_tier)}`}>
                        {formatLabel(lesson.difficulty_tier)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {formatMinutes(lesson.estimated_minutes ?? 0)}
                    </span>
                </div>

                <p className="mt-3 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {isFailed
                        ? t("lessonGenerationFailedDesc", { defaultValue: "Generation failed for this lesson. Please contact administrator or retry." })
                        : !isGenerated
                            ? t("lessonNotGeneratedDesc", { defaultValue: "This lesson exists in the roadmap but its content has not been generated yet." })
                            : isGeneratedButLocked
                                ? t("lessonLockedDesc", { defaultValue: "This lesson is generated, but you need to pass the previous lesson in this topic to unlock it." })
                                : t("lessonReadyDesc", { defaultValue: "Theory and quiz content are ready for this lesson." })}
                </p>
            </div>

            <div
                className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isReadyToStudy
                        ? "border-blue-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white dark:border-blue-800 dark:text-blue-400"
                        : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800",
                ].join(" ")}
            >
                <ChevronRight className="h-5 w-5" />
            </div>
        </>
    );

    const className =
        "group flex h-full w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:p-5";

    if (!isReadyToStudy) {
        return <div className={`${className} opacity-80`}>{content}</div>;
    }

    return (
        <Link
            to="/lessons/$lessonId"
            params={{ lessonId: String(lesson.id) }}
            className={`${className} hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:border-blue-700`}
        >
            {content}
        </Link>
    );
}
