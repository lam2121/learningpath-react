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
                border border-border/70 bg-card shadow-sm
                transition-all duration-300 hover:shadow-md
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
                        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {pageTitle}
                        </h1>

                        <span
                            className={[
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                                error
                                    ? "border-amber-300/80 bg-amber-50 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-300"
                                    : "border-emerald-300/80 bg-emerald-50 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300",
                            ].join(" ")}
                        >
                            {!error && (
                                <span className="relative mr-1.5 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                            )}
                            {error ? t("roadmapUnavailable", { defaultValue: "Unavailable" }) : t("roadmapReady", { defaultValue: "Roadmap ready" })}
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Layers3 className="h-4 w-4 text-primary" />
                            {t("topicCount", { count: summary.totalTopics, defaultValue: pluralize(summary.totalTopics, "Topic") })}
                        </span>

                        <span className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {t("lessonCount", { count: summary.totalLessons, defaultValue: pluralize(summary.totalLessons, "Lesson") })}
                        </span>

                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            {t("generatedCount", { count: summary.generatedLessons, defaultValue: `${summary.generatedLessons} generated` })}
                        </span>

                        <span className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-primary" />
                            {formatMinutes(summary.totalEstimatedMinutes)}
                        </span>
                    </div>
                </div>

                <div className="min-w-0 rounded-xl border border-border/50 bg-accent/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-muted-foreground">
                            {t("contentReadiness", { defaultValue: "Content readiness" })}
                        </span>

                        <span className="font-bold text-foreground">
                            {summary.progress}%
                        </span>
                    </div>

                    <div
                        className="h-2.5 overflow-hidden rounded-full bg-secondary"
                        role="progressbar"
                        aria-label={t("contentReadiness", { defaultValue: "Lesson generation progress" })}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={summary.progress}
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                            style={{ width: `${summary.progress}%` }}
                        />
                    </div>
                </div>

                {startLesson ? (
                    <Button
                        asChild
                        size="lg"
                        className="
                            h-12 w-full rounded-xl bg-primary px-7
                            font-semibold text-primary-foreground shadow-md
                            transition-all duration-200 hover:scale-[1.02] hover:shadow-lg
                            active:scale-[0.98] lg:w-auto
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
                            h-12 w-full rounded-xl px-7
                            font-semibold text-muted-foreground lg:w-auto
                        "
                    >
                        {t("noUnlockedLessonInTopic", { defaultValue: "No unlocked lesson ready in this topic" })}
                    </Button>
                )}
            </div>
        </section>
    );
}
