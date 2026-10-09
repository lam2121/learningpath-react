import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Clock3,
    Layers3,
} from "lucide-react";
import { Button } from "@/shadcn/component/ui/button";
import type { RoadmapLesson } from "../api/roadmapApi";
import { formatMinutes, pluralize } from "../utils/roadmapFormatters";

interface RoadmapSummaryHeaderProps {
    pageTitle: string;
    error: string | null;
    summary: {
        totalTopics: number;
        totalLessons: number;
        generatedLessons: number;
        totalEstimatedMinutes: number;
        progress: number;
    };
    startLesson: RoadmapLesson | null;
}

export function RoadmapSummaryHeader({
    pageTitle,
    error,
    summary,
    startLesson,
}: RoadmapSummaryHeaderProps) {
    const { t } = useTranslation("profile");

    return (
        <section
            className="
                w-full overflow-hidden rounded-2xl
                border border-blue-200 bg-white shadow-sm
                ring-1 ring-blue-100/80
                dark:border-blue-900 dark:bg-slate-900 dark:ring-blue-950
            "
        >
            <div
                className="
                    grid w-full gap-5 p-5
                    sm:p-6
                    lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)_auto]
                    lg:items-center
                "
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                            {pageTitle}
                        </h1>

                        <span
                            className={[
                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                error
                                    ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                                    : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
                            ].join(" ")}
                        >
                            {error ? t("roadmapUnavailable", { defaultValue: "Unavailable" }) : t("roadmapReady", { defaultValue: "Roadmap ready" })}
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-blue-600" />
                            {t("topicCount", { count: summary.totalTopics, defaultValue: pluralize(summary.totalTopics, "Topic") })}
                        </span>

                        <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            {t("lessonCount", { count: summary.totalLessons, defaultValue: pluralize(summary.totalLessons, "Lesson") })}
                        </span>

                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            {t("generatedCount", { count: summary.generatedLessons, defaultValue: `${summary.generatedLessons} generated` })}
                        </span>

                        <span className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-blue-600" />
                            {formatMinutes(summary.totalEstimatedMinutes)}
                        </span>
                    </div>
                </div>

                <div className="min-w-0 rounded-xl bg-blue-50/70 p-4 dark:bg-blue-950/30">
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t("contentReadiness", { defaultValue: "Content readiness" })}
                        </span>

                        <span className="font-bold text-slate-900 dark:text-white">
                            {summary.progress}%
                        </span>
                    </div>

                    <div
                        className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800"
                        role="progressbar"
                        aria-label={t("contentReadiness", { defaultValue: "Lesson generation progress" })}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={summary.progress}
                    >
                        <div
                            className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                            style={{ width: `${summary.progress}%` }}
                        />
                    </div>
                </div>

                {startLesson ? (
                    <Button
                        asChild
                        size="lg"
                        className="
                            h-12 w-full rounded-xl bg-blue-600 px-7
                            font-semibold text-white shadow-sm
                            hover:bg-blue-700 lg:w-auto
                        "
                    >
                        <Link
                            to="/lessons/$lessonId"
                            params={{ lessonId: String(startLesson.id) }}
                        >
                            {t("startLearning", { defaultValue: "Start learning" })}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        disabled
                        className="
                            h-12 w-full rounded-xl bg-blue-600 px-7
                            font-semibold text-white shadow-sm lg:w-auto
                        "
                    >
                        {t("noUnlockedLessonInTopic", { defaultValue: "No unlocked lesson ready in this topic" })}
                    </Button>
                )}
            </div>
        </section>
    );
}
